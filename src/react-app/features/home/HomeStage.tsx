import { useEffect, useRef, useState } from "react";
import { Footer } from "../../components/layout/Footer";
import { useI18n } from "../../i18n";
import type { Character, ScriptEntry } from "../../types/content";
import { CharacterArchiveContent } from "../characters/CharacterArchiveContent";
import { ScriptCard } from "../scripts/ScriptCard";
import { ScriptFocusReader } from "../scripts/ScriptFocusReader";

export function HomeStage({ characters, scripts, onPlay }: { characters: Character[]; scripts: ScriptEntry[]; onPlay: (character: Character) => void }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(characters[0]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [expandedScript, setExpandedScript] = useState<ScriptEntry | null>(null);
  const [scriptClosing, setScriptClosing] = useState(false);
  const [scriptReturning, setScriptReturning] = useState(false);
  const scriptReturnPosition = useRef(0);
  const selectedIndex = characters.findIndex((character) => character.id === selected.id);
  const nameLetters = Array.from(selected.name);

  const selectCharacter = (character: Character) => {
    setSelected(character);
    onPlay(character);
  };
  const selectFromRecord = (character: Character) => {
    selectCharacter(character);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openDetail = () => {
    onPlay(selected);
    setDetailOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeDetail = () => {
    setDetailOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openScript = (script: ScriptEntry) => {
    if (!expandedScript) scriptReturnPosition.current = window.scrollY;
    setScriptReturning(false);
    setScriptClosing(false);
    setExpandedScript(script);
  };
  const closeScript = () => {
    if (scriptClosing) return;
    setScriptClosing(true);
    window.setTimeout(() => {
      setExpandedScript(null);
      setScriptClosing(false);
      setScriptReturning(true);
      requestAnimationFrame(() => window.scrollTo({ top: scriptReturnPosition.current, behavior: "instant" }));
    }, 480);
  };

  useEffect(() => {
    if (!detailOpen && !expandedScript) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (expandedScript) closeScript();
      else closeDetail();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [detailOpen, expandedScript?.id, scriptClosing]);

  if (expandedScript) return <ScriptFocusReader key={expandedScript.id} script={expandedScript} scripts={scripts} closing={scriptClosing} onClose={closeScript} onSelect={openScript} />;
  return <main className={`stage-view ${detailOpen ? "is-detail-open" : ""} ${scriptReturning ? "is-script-returning" : ""}`}>
    <section className="stage-hero" style={{ "--stage-accent": selected.color } as React.CSSProperties}>
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
      <div className="butterfly-field" aria-hidden="true"><span>◇</span><span>◇</span><span>◇</span><span>◇</span><span>◇</span></div>
      <div className="hero-copy">
        <div className="eyebrow"><span /> {t("home.archiveEyebrow", { index: `0${selectedIndex + 1}` })}</div>
        <p className="hero-kicker">{selected.quote}</p>
        <h1 className={`outlined-name${nameLetters.length > 2 ? " long-name" : ""}`}>{nameLetters.map((letter, index) => {
          const verticalOffset = index === 0 ? 0 : (index % 2 === 0 ? -1 : 1) * Math.min(0.025 + index * 0.008, 0.055);
          return <span
            key={`${selected.id}-${index}`}
            data-letter={letter}
            style={{
              "--name-y": `${verticalOffset}em`,
              "--name-delay": `${index * 42}ms`,
            } as React.CSSProperties}
          >{letter}</span>;
        })}</h1>
        <p className="hero-en">{selected.en} <i>—</i> {selected.epithet}</p>
        <p className="hero-description">{selected.bio}</p>
        <div className="hero-actions" aria-hidden={detailOpen}><button className="primary-action" onClick={openDetail} tabIndex={detailOpen ? -1 : 0}>{t("home.enterArchive")} <span>↗</span></button><a className="text-action" href="#scripts" tabIndex={detailOpen ? -1 : 0}>{t("home.readScripts")} <span>↓</span></a></div>
        <button className="record-close" onClick={closeDetail} tabIndex={detailOpen ? 0 : -1} aria-hidden={!detailOpen}><span>←</span> {t("archive.close")} <small>ESC</small></button>
      </div>
      <div className="hero-visual"><div className="halo" /><img key={selected.id} src={selected.image} alt={t("home.portraitAlt", { name: selected.name })} /><div className="vertical-type">{selected.city} · {selected.path} · {selected.element}</div></div>
      <nav className="stage-character-nav" aria-label={t("home.switchCoverAria")} aria-hidden={detailOpen} data-label={t("home.selectCount")}>
        <ol>{characters.map((character, index) => <li key={character.id}><button className={selected.id === character.id ? "active" : ""} onClick={() => selectCharacter(character)} aria-pressed={selected.id === character.id} tabIndex={detailOpen ? -1 : 0}><span>0{index + 1}</span><strong>{character.name}</strong><small>{character.en}</small></button></li>)}</ol>
      </nav>
      <div className="hero-counter"><span>0{selectedIndex + 1}</span><i /><small>08</small></div>
      <div className="scroll-cue">{t("home.scrollCue")} <span>↓</span></div>
    </section>

    {detailOpen ? <CharacterArchiveContent character={selected} characters={characters} index={selectedIndex} onSelect={selectFromRecord} /> : <div className="stage-default-content">
      <section className="scripts-section" id="scripts">
        <div className="section-heading"><div><small>{t("home.scriptsChapter")}</small><h2>{t("home.scriptsTitle")}</h2></div><p>{t("home.scriptsDescription")}</p></div>
        <div className="scripts-grid">{scripts.map((script) => <ScriptCard key={script.id} script={script} onOpen={openScript} />)}</div>
      </section>
      <Footer />
    </div>}
  </main>;
}
