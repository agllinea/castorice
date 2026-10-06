import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRevision, safeFilename, sourceMetadata, titleFromInput } from "./sr-bwiki-client.js";
import { collectMissionImageNames, createImageAssetStore } from "./sr-image-assets.js";
import { parseStarRailMission } from "./sr-wikitext-parser.js";

const DEFAULT_PAGE = "星星是冰冷的玩具";

async function main() {
  const input = process.argv.slice(2).find((argument) => !argument.startsWith("--")) ?? DEFAULT_PAGE;
  const requestedTitle = titleFromInput(input);
  if (!requestedTitle) throw new Error("请提供 BWiki 页面 URL 或任务标题");

  const revision = await fetchRevision(requestedTitle);
  const parsed = parseStarRailMission(revision.wikitext, sourceMetadata(revision));

  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectDirectory = path.resolve(scriptDirectory, "..");
  const imageStore = await createImageAssetStore(projectDirectory);
  await imageStore.ensureAll(collectMissionImageNames(revision.wikitext));
  imageStore.attach(parsed);
  const outputDirectory = path.resolve(scriptDirectory, "..", "data");
  const basename = safeFilename(revision.title);
  const sourcePath = path.join(outputDirectory, `${basename}.wiki`);
  const jsonPath = path.join(outputDirectory, `${basename}.json`);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(sourcePath, revision.wikitext, "utf8");
  await writeFile(jsonPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");

  const choiceCount = JSON.stringify(parsed.content).match(/"type":"choice"/g)?.length ?? 0;
  console.log(`已获取：${revision.title}`);
  console.log(`源文本：${path.relative(process.cwd(), sourcePath)}`);
  console.log(`JSON：${path.relative(process.cwd(), jsonPath)}`);
  console.log(`顶层内容节点：${parsed.content.length}，选项组：${choiceCount}`);
  if (parsed.warnings.length) console.warn(`警告：${parsed.warnings.join("；")}`);
}

main().catch((error) => {
  console.error(`获取失败：${error.message}`);
  process.exitCode = 1;
});
