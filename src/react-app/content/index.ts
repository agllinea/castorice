import charactersCn from "./cn/characters.json";
import scriptsCn from "./cn/scripts.json";
import butterflyByTheRiverCn from "./cn/scripts/butterfly-by-the-river.md?raw";
import okhemaSleeplessCn from "./cn/scripts/okhema-sleepless.md?raw";
import thirteenthSeatCn from "./cn/scripts/thirteenth-seat.md?raw";
import type { Character, ScriptEntry, ScriptMetadata } from "../types/content";

export type ContentLocale = "cn";

const markdownByLocale: Record<ContentLocale, Record<string, string>> = {
  cn: {
    "butterfly-by-the-river": butterflyByTheRiverCn,
    "okhema-sleepless": okhemaSleeplessCn,
    "thirteenth-seat": thirteenthSeatCn,
  },
};

const contentByLocale: Record<ContentLocale, { characters: Character[]; scripts: ScriptMetadata[] }> = {
  cn: {
    characters: charactersCn as Character[],
    scripts: scriptsCn as ScriptMetadata[],
  },
};

export function getContent(locale: ContentLocale) {
  const content = contentByLocale[locale];
  const markdown = markdownByLocale[locale];
  return {
    characters: content.characters,
    scripts: content.scripts.map<ScriptEntry>(({ markdownFile, ...script }) => ({
      ...script,
      markdown: markdown[markdownFile] ?? "",
    })),
  };
}
