import { Footer } from "../../components/layout/Footer";
import { useI18n } from "../../i18n";
import type { Character } from "../../types/content";

const chapterDefinitions = [
  { id: "origin", index: "01" },
  { id: "journey", index: "02" },
  { id: "memory", index: "03" },
  { id: "observation", index: "04" },
] as const;

export function CharacterArchiveContent({ character, characters, index, onSelect }: { character: Character; characters: Character[]; index: number; onSelect: (character: Character) => void }) {
  const { t } = useI18n();
  const previous = characters[(index - 1 + characters.length) % characters.length];
  const next = characters[(index + 1) % characters.length];
  const params = {
    index: `0${index + 1}`,
    name: character.name,
    epithet: character.epithet,
    path: character.path,
    element: character.element,
    city: character.city,
    accent: character.accent,
    quote: character.quote,
    bio: character.bio,
  };
  const chapters = chapterDefinitions.map(({ id, index: chapterIndex }) => ({
    id,
    index: chapterIndex,
    label: t(`archive.chapters.${id}.label`),
    title: t(`archive.chapters.${id}.title`, params),
    paragraphs: [t(`archive.chapters.${id}.paragraph1`, params), t(`archive.chapters.${id}.paragraph2`, params)],
  }));

  return <section className="character-record" id="character-record" style={{ "--record-accent": character.color } as React.CSSProperties}>
    <header className="record-intro">
      <div><small>{t("archive.expandedRecord")}</small><h2>{t("archive.detailTitle")}</h2></div>
      <p>{t("archive.conceptNotice")}</p>
      <div className="record-facts"><span><small>PATH</small>{character.path}</span><span><small>TYPE</small>{character.element}</span><span><small>ORIGIN</small>{character.city}</span><span><small>{t("archive.keyword")}</small>{character.tags.join(" · ")}</span></div>
    </header>
    <div className="record-reading-layout">
      <aside className="record-toc">
        <small>{t("archive.contents")}</small>
        <ol>{chapters.map((chapter) => <li key={chapter.id}><a href={`#record-${character.id}-${chapter.id}`}><span>{chapter.index}</span>{chapter.label}</a></li>)}</ol>
        <blockquote>“{character.quote}”</blockquote>
      </aside>
      <article className="record-chapters">
        {chapters.map((chapter) => <section key={chapter.id} id={`record-${character.id}-${chapter.id}`}>
          <div className="record-chapter-number">{chapter.index}</div>
          <div><small>{chapter.label} / {character.en}</small><h3>{chapter.title}</h3>{chapter.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>
        </section>)}
      </article>
    </div>
    <nav className="record-pagination" aria-label={t("archive.switchCharacter")}>
      <button onClick={() => onSelect(previous)}><small>← {t("archive.previousRecord")}</small><strong>{previous.name}</strong><span>{previous.en} · {previous.epithet}</span></button>
      <button onClick={() => onSelect(next)}><small>{t("archive.nextRecord")} →</small><strong>{next.name}</strong><span>{next.en} · {next.epithet}</span></button>
    </nav>
    <Footer />
  </section>;
}
