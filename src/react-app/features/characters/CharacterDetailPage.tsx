import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Footer } from "../../components/layout/Footer";
import { useI18n } from "../../i18n";
import type { Character } from "../../types/content";

export function CharacterDetailPage({ characters, onPlay }: { characters: Character[]; onPlay: (character: Character) => void }) {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const character = characters.find((item) => item.id === id) ?? characters[0];
  const index = characters.findIndex((item) => item.id === character.id);
  useEffect(() => { onPlay(character); window.scrollTo({ top: 0 }); }, [character.id]);
  const nextCharacter = characters[(index + 1) % characters.length];
  return <main className="detail-view" style={{ "--detail-accent": character.color } as React.CSSProperties}>
    <section className="detail-hero">
      <button className="detail-back" onClick={() => navigate(-1)}>← {t("archive.back")}</button>
      <div className="detail-number">0{index + 1}</div><div className="detail-grid-line one" /><div className="detail-grid-line two" />
      <div className="detail-copy"><div className="eyebrow">{t("archive.eyebrow", { index: `0${index + 1}` })}</div><h1>{character.name}</h1><p className="detail-en">{character.en}</p><h2>{character.epithet}</h2><blockquote>“{character.quote}”</blockquote><div className="detail-tags">{character.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
      <div className="detail-portrait"><div className="detail-halo" /><img src={character.image} alt={t("archive.fullPortraitAlt", { name: character.name })} /><span className="detail-vertical">{character.city} / {character.accent}</span></div>
      <div className="detail-facts"><span><small>{t("archive.path")}</small>{character.path}</span><span><small>{t("archive.type")}</small>{character.element}</span><span><small>{t("archive.origin")}</small>{character.city}</span></div>
    </section>
    <section className="detail-story"><div><small>{t("archive.note")}</small><h2>{t("archive.storyTitle")}</h2></div><div><p>{character.bio}</p><p>{t("archive.storyPlaceholder")}</p></div></section>
    <section className="roster-strip"><div className="strip-heading"><small>{t("archive.switchRecord")}</small><h2>{t("archive.switchCharacter")}</h2></div><div className="strip-list">{characters.map((item, itemIndex) => <Link key={item.id} to={`/characters/${item.id}`} className={item.id === character.id ? "active" : ""} onClick={() => onPlay(item)}><span>0{itemIndex + 1}</span><img src={item.image} alt="" /><strong>{item.name}</strong></Link>)}</div></section>
    <Link className="next-record" to={`/characters/${nextCharacter.id}`} onClick={() => onPlay(nextCharacter)}><small>{t("archive.nextRecord")}</small><span>{nextCharacter.name}</span><i>→</i></Link>
    <Footer />
  </main>;
}
