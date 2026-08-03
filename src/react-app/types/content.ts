export type Character = {
  id: string;
  name: string;
  en: string;
  epithet: string;
  path: string;
  element: string;
  city: string;
  image: string;
  accent: string;
  track: string;
  duration: string;
  quote: string;
  bio: string;
  tags: string[];
  color: string;
};

export type ScriptMetadata = {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  duration: string;
  cast: string[];
  excerpt: string;
  markdownFile: string;
};

export type ScriptEntry = Omit<ScriptMetadata, "markdownFile"> & {
  markdown: string;
};
