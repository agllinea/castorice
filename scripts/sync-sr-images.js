import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectMissionImageNames, createImageAssetStore } from "./sr-image-assets.js";
import { parseStarRailMission } from "./sr-wikitext-parser.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const missionDirectory = path.join(projectDirectory, "data", "missions");

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".wiki")) output.push(fullPath);
  }
  return output;
}

async function main() {
  const wikiFiles = await walk(missionDirectory);
  const sources = await Promise.all(wikiFiles.map(async (file) => ({ file, source: await readFile(file, "utf8") })));
  const names = [...new Set(sources.flatMap(({ source }) => collectMissionImageNames(source)))];
  const store = await createImageAssetStore(projectDirectory);
  console.log(`扫描 ${wikiFiles.length} 份任务源码，发现 ${names.length} 张不同图片`);
  const results = await store.ensureAll(names, {
    concurrency: 4,
    onProgress: (result, current, total) => console.log(`[${current}/${total}] ${result.status}: ${result.name}${result.error ? ` · ${result.error}` : ""}`),
  });
  const failures = results.filter((result) => result.status === "error");

  let updatedJson = 0;
  for (const { file, source } of sources) {
    const jsonPath = file.replace(/\.wiki$/iu, ".json");
    let metadata = {};
    try { metadata = JSON.parse(await readFile(jsonPath, "utf8")).source ?? {}; } catch { /* create from source */ }
    const parsed = store.attach(parseStarRailMission(source, metadata));
    await writeFile(jsonPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    updatedJson += 1;
  }
  console.log(`已更新 ${updatedJson} 份任务 JSON；资源清单：${path.relative(projectDirectory, store.manifestPath)}`);
  if (failures.length) {
    console.error(`仍有 ${failures.length} 张图片下载失败`);
    process.exitCode = 1;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
