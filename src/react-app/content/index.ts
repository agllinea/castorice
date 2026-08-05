import charactersCn from "./cn/characters.json";
import scriptsCn from "./cn/scripts.json";
import type { Character, ScriptEntry, ScriptMetadata } from "../types/content";

export type ContentLocale = "cn";

const markdownModulesCn = import.meta.glob("./cn/scripts/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const markdownCn = Object.fromEntries(Object.entries(markdownModulesCn).map(([filePath, markdown]) => {
  const fileName = filePath.split("/").pop()?.replace(/\.md$/, "") ?? filePath;
  return [fileName, markdown];
}));

const markdownByLocale: Record<ContentLocale, Record<string, string>> = {
  cn: markdownCn,
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
