/**
 * Generate the `cast` array of each script in content/<lang>/scripts.json
 * from its markdown file.
 *
 * A speaker line is a list item whose text starts with `名字：`, either at the
 * top level or inside a blockquote (cutscene / animation blocks):
 *
 *     *	卡芙卡：艾利欧看见的未来是不会出错的。
 *     > *   银狼：不，我想你来得正是时候。
 *
 * Names are collected in order of first appearance, after ruby/markup is
 * stripped and cast.config.json has been applied.
 *
 * Usage:
 *   node src/scripts/generate-cast.mjs                 # fill empty casts, write
 *   node src/scripts/generate-cast.mjs --dry           # preview only
 *   node src/scripts/generate-cast.mjs 001 003         # only these ids
 *   node src/scripts/generate-cast.mjs --force         # also rewrite non-empty casts
 *   node src/scripts/generate-cast.mjs --lang cn
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const CONFIG_PATH = path.join(ROOT, "src/scripts/cast.config.json");

// Longest plausible speaker name, in characters, before the full-width colon.
const MAX_NAME_LENGTH = 12;

// A leading `>` (any depth) then a list marker, then `名字：`.
const SPEAKER_LINE = /^\s*(?:>\s*)*[*+-]\s+(.+?)：/;

// Characters that never appear in a name — used to reject narration that
// happens to contain a full-width colon.
const NOT_IN_NAME = /[，。！？、；：…—「」『』（）()[\]{}<>*_`]/;

function parseArgs(argv) {
    const options = { lang: "cn", dry: false, force: false, ids: [] };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--dry" || arg === "-n") options.dry = true;
        else if (arg === "--force" || arg === "-f") options.force = true;
        else if (arg === "--lang") options.lang = argv[++i];
        else if (arg.startsWith("--lang=")) options.lang = arg.slice(7);
        else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
        else options.ids.push(arg);
    }
    return options;
}

function readConfig() {
    if (!fs.existsSync(CONFIG_PATH)) return { ignore: [], aliases: {}, overrides: {} };
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return {
        ignore: config.ignore ?? [],
        aliases: config.aliases ?? {},
        overrides: config.overrides ?? {},
    };
}

/** `<ruby><rb>阿基维利</rb><rt>开拓者</rt></ruby>` -> `阿基维利`, plus markdown noise. */
function stripMarkup(text) {
    return text
        .replace(/<rt>.*?<\/rt>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/[*_`\\]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function isPlausibleName(name) {
    if (!name) return false;
    if ([...name].length > MAX_NAME_LENGTH) return false;
    if (NOT_IN_NAME.test(name)) return false;
    return true;
}

/**
 * @returns {{ cast: string[], skipped: Map<string, number>, counts: Map<string, number> }}
 */
function extractCast(markdown, { ignore, aliases }) {
    const ignored = new Set(ignore);
    const cast = [];
    const counts = new Map();
    const skipped = new Map();

    for (const line of markdown.split(/\r?\n/)) {
        const match = line.match(SPEAKER_LINE);
        if (!match) continue;

        const name = stripMarkup(match[1]);
        if (!isPlausibleName(name)) continue;

        if (ignored.has(name)) {
            skipped.set(name, (skipped.get(name) ?? 0) + 1);
            continue;
        }

        const resolved = aliases[name] ?? name;
        counts.set(resolved, (counts.get(resolved) ?? 0) + 1);
        if (!cast.includes(resolved)) cast.push(resolved);
    }

    return { cast, counts, skipped };
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const config = readConfig();

    const contentDir = path.join(ROOT, "src/react-app/content", options.lang);
    const indexPath = path.join(contentDir, "scripts.json");
    const scripts = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    const wanted = new Set(options.ids);
    let changed = 0;

    for (const script of scripts) {
        if (wanted.size && !wanted.has(script.id)) continue;

        const hasCast = Array.isArray(script.cast) && script.cast.length > 0;
        if (hasCast && !options.force) {
            console.log(`- ${script.id} ${script.title}: cast already set (${script.cast.length}), skipped`);
            continue;
        }

        const markdownPath = path.join(contentDir, "scripts", `${script.markdownFile}.md`);
        if (!fs.existsSync(markdownPath)) {
            console.warn(`! ${script.id} ${script.title}: missing ${path.relative(ROOT, markdownPath)}`);
            continue;
        }

        const markdown = fs.readFileSync(markdownPath, "utf8");
        const { cast, counts, skipped } = extractCast(markdown, config);

        const override = config.overrides[script.id] ?? {};
        for (const name of override.remove ?? []) {
            const at = cast.indexOf(name);
            if (at !== -1) cast.splice(at, 1);
        }
        for (const name of override.add ?? []) {
            if (!cast.includes(name)) cast.push(name);
        }

        script.cast = cast;
        changed++;

        console.log(`+ ${script.id} ${script.title}: ${cast.length} cast`);
        console.log(`    ${cast.map((n) => `${n}(${counts.get(n) ?? 0})`).join(" ")}`);

        // One-off names are usually either a bit part or narration that slipped
        // through — worth eyeballing before committing.
        const rare = cast.filter((n) => (counts.get(n) ?? 0) <= 1 && !(override.add ?? []).includes(n));
        if (rare.length) console.log(`    check (single line): ${rare.join(" ")}`);
        if (skipped.size) console.log(`    ignored: ${[...skipped].map(([n, c]) => `${n}(${c})`).join(" ")}`);
    }

    if (!changed) {
        console.log("\nNothing to write.");
        return;
    }

    if (options.dry) {
        console.log(`\nDry run — ${changed} script(s) would change.`);
        return;
    }

    fs.writeFileSync(indexPath, `${JSON.stringify(scripts, null, 4)}\n`, "utf8");
    console.log(`\nWrote ${changed} script(s) to ${path.relative(ROOT, indexPath)}`);
}

main();
