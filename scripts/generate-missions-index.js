import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const legacyIndex = process.argv[2] ?? "E:\\repo\\3799\\scripts\\mission_sr.json";
const outputPath = path.join(projectDirectory, "data", "missions.legacy.json");

const missions = JSON.parse(await readFile(path.resolve(legacyIndex), "utf8"));
const normalized = {};

for (const mission of missions) {
  const match = mission.name.match(/^(.+?)(X?\d+(?:-\d+)?)\s+(.+)$/);
  if (!match) throw new Error(`无法从任务名称中识别地点和序号：${mission.name}`);

  const [, location, sequence, name] = match;
  normalized[location] ??= [];
  normalized[location].push({
    name,
    link: mission.link,
    ...(sequence.includes("X") ? { type: "ex" } : {}),
    ...(mission.children?.length
      ? {
          children: mission.children.map((child) => ({
            name: child.name,
            link: child.link,
          })),
        }
      : {}),
  });
}

await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

const normalizedMissions = Object.values(normalized).flat();
const pageCount = normalizedMissions.reduce((total, mission) => total + (mission.children?.length || 1), 0);
console.log(`已生成 ${path.relative(projectDirectory, outputPath)}`);
console.log(`地点 ${Object.keys(normalized).length} 个，任务 ${normalizedMissions.length} 个，页面 ${pageCount} 个`);
