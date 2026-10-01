import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "screenplays");

function plainRubyText(text) {
  return String(text ?? "").replace(/\{\{([^{}|]+)\|[^{}]*\}\}/gu, "$1");
}

function scanSpeakers(blocks) {
  const result = [];
  const seen = new Set();
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "dialogue" && typeof node.speaker === "string") {
      const speaker = plainRubyText(node.speaker).trim();
      if (speaker && !seen.has(speaker)) { seen.add(speaker); result.push(speaker); }
    }
    if (Array.isArray(node.content)) node.content.forEach(visit);
    if (Array.isArray(node.options)) node.options.forEach((option) => Array.isArray(option.content) && option.content.forEach(visit));
    if (Array.isArray(node.tabs)) node.tabs.forEach((tab) => Array.isArray(tab.content) && tab.content.forEach(visit));
  };
  blocks.forEach((block) => visit(block.node));
  return result;
}

function sortKey(name) {
  const value = Number(path.basename(name, path.extname(name)));
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

async function main() {
  await fs.mkdir(root, { recursive: true });
  const names = (await fs.readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.(?:json|md)$/iu.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => sortKey(left) - sortKey(right) || left.localeCompare(right, "zh-CN"));
  if (!names.length) return;

  const stamp = new Date().toISOString().replace(/[:.]/gu, "-");
  const backupRoot = path.join(root, `.migration-backup-${stamp}`);
  const stagingRoot = path.join(root, `.migration-staging-${stamp}`);
  await fs.mkdir(backupRoot, { recursive: true });
  await fs.mkdir(stagingRoot, { recursive: true });

  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const sourcePath = path.join(root, name);
    const document = JSON.parse(await fs.readFile(sourcePath, "utf8"));
    await fs.copyFile(sourcePath, path.join(backupRoot, name));
    const id = String(index + 1).padStart(3, "0");
    const oldStem = path.basename(name, path.extname(name));
    const speakers = scanSpeakers(Array.isArray(document.blocks) ? document.blocks : []);
    const previousHidden = new Set(Array.isArray(document.characters?.hidden) ? document.characters.hidden : []);
    const hidden = speakers.filter((speaker) => previousHidden.has(speaker));
    const migrated = {
      ...document,
      schemaVersion: 2,
      id,
      title: document.title === oldStem ? "" : String(document.title ?? ""),
      chapter: String(document.chapter ?? document.description ?? ""),
      characters: { visible: speakers.filter((speaker) => !previousHidden.has(speaker)), hidden },
    };
    delete migrated.description;
    await fs.writeFile(path.join(stagingRoot, `${id}.md`), `${JSON.stringify(migrated, null, 2)}\n`, "utf8");
  }

  for (const name of names) await fs.unlink(path.join(root, name));
  for (let index = 0; index < names.length; index += 1) {
    const id = String(index + 1).padStart(3, "0");
    await fs.rename(path.join(stagingRoot, `${id}.md`), path.join(root, `${id}.md`));
  }
  await fs.rm(stagingRoot, { recursive: true });
  console.log(`已迁移 ${names.length} 个剧本；备份：${path.relative(process.cwd(), backupRoot)}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
