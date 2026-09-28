import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { safeFilename } from "./sr-bwiki-client.js";

const API_URL = "https://wiki.biligame.com/sr/api.php";
const USER_AGENT = "castorice-star-rail-index-fetcher/1.0";
const CATEGORIES = ["开拓任务", "开拓续闻", "同行任务"];
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const outputPath = path.join(projectDirectory, "data", "missions.json");
const reportPath = path.join(projectDirectory, "data", "mission-index-report.json");
const legacyIndexPath = "E:\\repo\\3799\\scripts\\mission_sr.json";
const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });

function first(values) {
  return Array.isArray(values) ? values[0] ?? "" : "";
}

function semanticLinkTarget(value) {
  const match = String(value).trim().match(/^\[\[([^|\]]+)(?:\|[^\]]*)?\]\]$/);
  return match ? match[1].trim() : String(value).trim();
}

function semanticLinkLabel(value) {
  const match = String(value).trim().match(/^\[\[([^|\]]+)(?:\|([^\]]*))?\]\]$/);
  return match ? (match[2] || match[1]).trim() : String(value).trim();
}

function entryFromResult(result) {
  const printouts = result.printouts ?? {};
  return {
    title: result.fulltext,
    url: result.fullurl,
    series: (printouts.系列任务 ?? []).map((value) => ({
      target: semanticLinkTarget(value),
      label: semanticLinkLabel(value),
    })),
    seriesName: first(printouts.系列任务名),
    regions: printouts.任务地区 ?? [],
    missionTypes: printouts.任务类型 ?? [],
    versions: printouts.所属版本 ?? [],
    missionNumber: first(printouts.任务编号),
    description: first(printouts.描述),
    createdAt: first(printouts.创建日期)?.timestamp ?? null,
  };
}

async function askEntries(condition, sort = "所属版本,创建日期") {
  const entries = [];
  let offset = 0;

  for (;;) {
    const query = [
      condition,
      "?系列任务",
      "?系列任务名",
      "?任务地区",
      "?任务类型",
      "?所属版本",
      "?任务编号",
      "?描述",
      "?创建日期",
      `sort=${sort}`,
      "order=asc",
      "limit=500",
      `offset=${offset}`,
    ].join("|");
    const params = new URLSearchParams({ action: "ask", query, format: "json" });
    const response = await fetch(`${API_URL}?${params}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
    if (!response.ok) throw new Error(`${condition} 查询失败：HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.error) throw new Error(`${condition} 查询失败：${payload.error.info}`);
    entries.push(...Object.values(payload.query?.results ?? {}).map(entryFromResult));

    const nextOffset = payload["query-continue-offset"];
    if (nextOffset === undefined || nextOffset === null) break;
    offset = Number(nextOffset);
  }

  return entries;
}

async function readLegacyExtraMissionNames() {
  try {
    const legacy = JSON.parse(await readFile(legacyIndexPath, "utf8"));
    return new Set(
      legacy
        .map((mission) => mission.name.match(/^.+?(X\d+(?:-\d+)?)\s+(.+)$/))
        .filter(Boolean)
        .map((match) => match[2]),
    );
  } catch {
    return new Set();
  }
}

function compareChildren(left, right) {
  const numberOrder = collator.compare(left._number || "999999", right._number || "999999");
  if (numberOrder !== 0) return numberOrder;
  return (left._createdAt ?? 0) - (right._createdAt ?? 0);
}

function buildCategoryIndex(category, seriesEntries, allChildEntries, extraMissionNames) {
  const seriesByTitle = new Map(seriesEntries.map((entry) => [entry.title, entry]));
  const seriesByName = new Map(seriesEntries.map((entry) => [entry.seriesName, entry]));
  const childrenBySeries = new Map();
  const issues = [];
  const matchedChildren = new Set();

  for (const child of allChildEntries) {
    const matches = child.series
      .map((relation) => ({
        relation,
        series: seriesByTitle.get(relation.target) ?? seriesByName.get(relation.label),
      }))
      .filter((match) => match.series);
    if (matches.length === 0) continue;
    matchedChildren.add(child.title);
    if (matches.length > 1) {
      issues.push({
        kind: "multiple-series",
        category,
        title: child.title,
        series: matches.map((match) => match.series.title),
      });
    }

    for (const { series } of matches) {
      const children = childrenBySeries.get(series.title) ?? [];
      children.push({
        name: child.title,
        link: child.url,
        ...(extraMissionNames.has(child.title) ? { type: "ex" } : {}),
        _number: child.missionNumber,
        _createdAt: child.createdAt,
      });
      childrenBySeries.set(series.title, children);
    }
  }

  const locations = {};
  for (const series of seriesEntries) {
    let location;
    if (series.regions.length === 0 && series.title === "宇宙均衡") location = "均衡等级突破";
    else if (series.regions.length === 1) location = series.regions[0];
    else {
      issues.push({ kind: "ambiguous-location", category, title: series.title, regions: series.regions });
      location = series.regions.join(" / ") || "未归类";
    }

    locations[location] ??= [];
    const children = (childrenBySeries.get(series.title) ?? [])
      .sort(compareChildren)
      .map(({ name, link, type }) => ({ name, link, ...(type ? { type } : {}) }));
    const name = series.seriesName || series.title.replace(/（系列任务）$/, "");
    if (children.length === 0) {
      issues.push({ kind: "series-without-children", category, title: series.title });
    }
    locations[location].push({
      name,
      link: series.url,
      ...(extraMissionNames.has(name) ? { type: "ex" } : {}),
      ...(children.length ? { children } : {}),
    });
  }

  return {
    locations,
    issues,
    stats: {
      records: seriesEntries.length + matchedChildren.size,
      missions: seriesEntries.length,
      children: matchedChildren.size,
      indexedChildren: [...childrenBySeries.values()].reduce((total, children) => total + children.length, 0),
    },
  };
}

function attachLocalFileLinks(missions) {
  const pathsByLink = new Map();
  const ownersByBasePath = new Map();

  for (const [category, locations] of Object.entries(missions)) {
    for (const [location, seriesList] of Object.entries(locations)) {
      for (const series of seriesList) {
        const pages = series.children?.length ? series.children : [series];
        for (const page of pages) {
          let files = pathsByLink.get(page.link);
          if (!files) {
            const directory = ["missions", category, location, series.name].map(safeFilename);
            let basename = safeFilename(page.name);
            let basePath = path.posix.join(...directory, basename);
            const owner = ownersByBasePath.get(basePath);
            if (owner && owner !== page.link) {
              const suffix = createHash("sha1").update(page.link).digest("hex").slice(0, 8);
              basename = `${basename}-${suffix}`;
              basePath = path.posix.join(...directory, basename);
            }
            ownersByBasePath.set(basePath, page.link);
            files = { sourceFile: `${basePath}.wiki`, dataFile: `${basePath}.json` };
            pathsByLink.set(page.link, files);
          }
          Object.assign(page, files);
        }
      }
    }
  }
}

async function main() {
  const extraMissionNames = await readLegacyExtraMissionNames();
  const missions = {};
  const report = {
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    sources: CATEGORIES.map((title) => `https://wiki.biligame.com/sr/${encodeURIComponent(title)}`),
    categories: {},
    issues: [],
  };

  process.stdout.write("读取全部系列子任务 ... ");
  const allChildEntries = await askEntries("[[系列任务::+]]", "所属版本,创建日期");
  console.log(`${allChildEntries.length} 条带系列关系的任务`);

  for (const category of CATEGORIES) {
    process.stdout.write(`${category} ... `);
    const seriesEntries = await askEntries(`[[分类:${category}]][[分类:系列任务]]`);
    const built = buildCategoryIndex(category, seriesEntries, allChildEntries, extraMissionNames);
    missions[category] = built.locations;
    report.categories[category] = built.stats;
    report.issues.push(...built.issues);
    console.log(`${built.stats.missions} 个系列，${built.stats.children} 个子任务`);
  }

  attachLocalFileLinks(missions);

  await writeFile(outputPath, `${JSON.stringify(missions, null, 2)}\n`, "utf8");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`已生成 ${path.relative(projectDirectory, outputPath)}`);
  console.log(`检查报告 ${path.relative(projectDirectory, reportPath)}：${report.issues.length} 个待确认项`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
