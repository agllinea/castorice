import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRevision, safeFilename, sourceMetadata } from "./sr-bwiki-client.js";
import { collectTemplateNames, countNodeTypes, parseStarRailMission } from "./sr-wikitext-parser.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const defaultIndexPath = "E:\\repo\\3799\\scripts\\mission_sr.json";
const indexArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const indexPath = path.resolve(indexArgument ?? defaultIndexPath);
const refresh = process.argv.includes("--refresh");
const outputRoot = path.join(projectDirectory, "data", "sr-missions");
const reportPath = path.join(projectDirectory, "data", "sr-fetch-report.json");
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function exists(filePath) {
  return access(filePath).then(() => true).catch(() => false);
}

function flattenIndex(groups) {
  return groups.flatMap((group, groupIndex) => {
    const pages = group.children?.length ? group.children : [{ name: group.name, link: group.link }];
    return pages.map((page, pageIndex) => ({
      group: group.name,
      groupIndex,
      pageIndex,
      expectedName: page.name,
      link: page.link,
    }));
  });
}

function inspectPage(entry, revision, parsed) {
  const nodeTypes = countNodeTypes(parsed.content);
  const templateNames = collectTemplateNames(revision.wikitext);
  const issues = [...parsed.warnings];
  const rawChoiceCount = templateNames.剧情选项 ?? 0;
  const rawMessageChoiceCount = templateNames.短信选项 ?? 0;
  const rawFoldCount = (templateNames.折叠 ?? 0) + (templateNames.折叠框 ?? 0);
  if ((nodeTypes.choice ?? 0) !== rawChoiceCount + rawMessageChoiceCount) {
    issues.push(`选项模板 ${rawChoiceCount + rawMessageChoiceCount} 个，但 JSON choice 节点 ${nodeTypes.choice ?? 0} 个`);
  }
  if ((nodeTypes.fold ?? 0) !== rawFoldCount) {
    issues.push(`折叠模板 ${rawFoldCount} 个，但 JSON fold 节点 ${nodeTypes.fold ?? 0} 个`);
  }
  const rawTabCount = (revision.wikitext.match(/<(?:tabber|tabs)>/gi) ?? []).length;
  if ((nodeTypes.tabs ?? 0) !== rawTabCount) {
    issues.push(`分页结构 ${rawTabCount} 个，但 JSON tabs 节点 ${nodeTypes.tabs ?? 0} 个`);
  }
  if (nodeTypes.template) {
    issues.push(`仍有 ${nodeTypes.template} 个未分类模板节点`);
  }
  const comparableMissionName = parsed.mission?.name?.replaceAll("•", "·");
  const comparableTitle = revision.title.replaceAll("•", "·").replace(/（任务）$/, "");
  if (comparableMissionName && comparableMissionName !== comparableTitle) {
    issues.push(`任务模板名称“${parsed.mission.name}”与页面标题“${revision.title}”不同`);
  }

  return {
    group: entry.group,
    expectedName: entry.expectedName,
    actualTitle: revision.title,
    link: entry.link,
    revisionId: revision.revisionId,
    status: issues.length ? "warning" : "ok",
    issues,
    nodeTypes,
    templateNames,
  };
}

async function saveReport(report) {
  const totals = report.pages.reduce((result, page) => {
    result[page.status] = (result[page.status] ?? 0) + 1;
    return result;
  }, {});
  const content = `${JSON.stringify({ ...report, totals }, null, 2)}\n`;
  for (let attempt = 0; ; attempt += 1) {
    try {
      await writeFile(reportPath, content, "utf8");
      return;
    } catch (error) {
      if (attempt >= 5 || !["EBUSY", "EPERM", "UNKNOWN"].includes(error.code)) throw error;
      await delay(150 * (attempt + 1));
    }
  }
}

async function main() {
  const groups = JSON.parse(await readFile(indexPath, "utf8"));
  const entries = flattenIndex(groups);
  await mkdir(outputRoot, { recursive: true });

  const report = {
    schemaVersion: 1,
    sourceIndex: indexPath,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    pages: [],
  };
  console.log(`任务组 ${groups.length} 个，页面 ${entries.length} 个；输出到 ${path.relative(projectDirectory, outputRoot)}`);

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const groupDirectory = path.join(outputRoot, safeFilename(entry.group));
    const basename = safeFilename(entry.expectedName);
    const sourcePath = path.join(groupDirectory, `${basename}.wiki`);
    const jsonPath = path.join(groupDirectory, `${basename}.json`);
    process.stdout.write(`[${index + 1}/${entries.length}] ${entry.expectedName} ... `);

    try {
      if (!refresh && await exists(sourcePath) && await exists(jsonPath)) {
        const savedSource = await readFile(sourcePath, "utf8");
        const savedJson = JSON.parse(await readFile(jsonPath, "utf8"));
        const revision = {
          title: savedJson.source?.title ?? entry.expectedName,
          revisionId: savedJson.source?.revisionId ?? null,
          wikitext: savedSource,
        };
        const reparsed = parseStarRailMission(savedSource, savedJson.source ?? {});
        const inspection = inspectPage(entry, revision, reparsed);
        await writeFile(jsonPath, `${JSON.stringify(reparsed, null, 2)}\n`, "utf8");
        report.pages.push({ ...inspection, status: inspection.issues.length ? "warning" : "ok", cached: true });
        console.log(inspection.issues.length ? `已有，警告 ${inspection.issues.length}` : "已有，跳过");
        await saveReport(report);
        continue;
      }

      const revision = await fetchRevision(entry.link, {
        onRetry: ({ status, attempt, delay: retryDelay }) =>
          process.stdout.write(`HTTP ${status}，第 ${attempt} 次退避 ${retryDelay / 1000}s ... `),
      });
      const parsed = parseStarRailMission(revision.wikitext, sourceMetadata(revision));
      const inspection = inspectPage(entry, revision, parsed);
      await mkdir(groupDirectory, { recursive: true });
      await writeFile(sourcePath, revision.wikitext, "utf8");
      await writeFile(jsonPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
      report.pages.push(inspection);
      console.log(inspection.issues.length ? `警告 ${inspection.issues.length}` : "OK");
    } catch (error) {
      report.pages.push({
        group: entry.group,
        expectedName: entry.expectedName,
        link: entry.link,
        status: "error",
        error: error.message,
      });
      console.log(`ERROR: ${error.message}`);
    }

    await saveReport(report);
    await delay(350);
  }

  report.finishedAt = new Date().toISOString();
  await saveReport(report);
  console.log(`完成。报告：${path.relative(projectDirectory, reportPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
