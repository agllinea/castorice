export type Character = {
  id: string;
  name: string;
  en: string;
  epithet: string;
  path: string;
  element: string;
  city: string;
  image: string;
  avatar: string;
  accent: string;
  track: string;
  music: string;
  duration: string;
  quote: string;
  bio: string;
  tags: string[];
  color: string;
  art: {
    mode: "cutout" | "poster";
    desktop: { x: string; y: string; scale: number; focus: string };
    mobile: { x: string; y: string; scale: number; focus: string };
    navFocus: string;
  };
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
