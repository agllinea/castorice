import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Footer } from "../../components/layout/Footer";
import { useI18n } from "../../i18n";
import type { Character, ScriptEntry } from "../../types/content";
import { CharacterArchiveContent } from "../characters/CharacterArchiveContent";
import { ScriptCard } from "../scripts/ScriptCard";
import { ScriptFocusReader } from "../scripts/ScriptFocusReader";

export function HomeStage({ characters, scripts, onPlay }: { characters: Character[]; scripts: ScriptEntry[]; onPlay: (character: Character) => void }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const routeCharacterId = location.pathname.match(/^\/characters\/([^/]+)\/?$/)?.[1];
  const routeScriptId = location.pathname.match(/^\/scripts\/([^/]+)\/?$/)?.[1];
  const routeCharacter = characters.find((character) => character.id === routeCharacterId);
  const routeScript = scripts.find((script) => script.id === routeScriptId);
  const [selected, setSelected] = useState(routeCharacter ?? characters[0]);
  const [detailOpen, setDetailOpen] = useState(Boolean(routeCharacter));
  const [expandedScript, setExpandedScript] = useState<ScriptEntry | null>(routeScript ?? null);
  const [scriptClosing, setScriptClosing] = useState(false);
  const [scriptReturning, setScriptReturning] = useState(false);
  const scriptReturnPosition = useRef(Number((location.state as { returnPosition?: number } | null)?.returnPosition ?? 0));
  const scriptCloseTimer = useRef<number | null>(null);
  const selectedIndex = characters.findIndex((character) => character.id === selected.id);
  const nameLetters = Array.from(selected.name);

  const selectCharacter = (character: Character) => {
    setSelected(character);
    onPlay(character);
  };
  const selectFromRecord = (character: Character) => {
    selectCharacter(character);
    navigate(`/characters/${character.id}`, { replace: true, state: location.state });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openDetail = () => {
    onPlay(selected);
    setDetailOpen(true);
    navigate(`/characters/${selected.id}`, { state: { stageOverlay: true } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeDetail = () => {
    setDetailOpen(false);
    if ((location.state as { stageOverlay?: boolean } | null)?.stageOverlay) navigate(-1);
    else navigate("/", { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openScript = (script: ScriptEntry) => {
    if (!expandedScript) scriptReturnPosition.current = window.scrollY;
    setScriptReturning(false);
    setScriptClosing(false);
    setExpandedScript(script);
    navigate(`/scripts/${script.id}`, {
      replace: Boolean(expandedScript),
      state: {
        stageOverlay: true,
        returnPosition: scriptReturnPosition.current,
      },
    });
  };
  const closeScript = () => {
    if (scriptClosing) return;
    setScriptClosing(true);
    scriptCloseTimer.current = window.setTimeout(() => {
      setExpandedScript(null);
      setScriptClosing(false);
      setScriptReturning(true);
      if ((location.state as { stageOverlay?: boolean } | null)?.stageOverlay) navigate(-1);
      else navigate("/", { replace: true });
      requestAnimationFrame(() => window.scrollTo({ top: scriptReturnPosition.current, behavior: "instant" }));
    }, 480);
  };

  useEffect(() => {
    if (routeCharacter) {
      setSelected(routeCharacter);
      setDetailOpen(true);
      onPlay(routeCharacter);
    } else if (detailOpen) {
      setDetailOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (routeScript) {
      if (expandedScript?.id !== routeScript.id) {
        setScriptReturning(false);
        setScriptClosing(false);
        setExpandedScript(routeScript);
      }
      return;
    }

    if (!expandedScript || scriptClosing) return;
    setScriptClosing(true);
    scriptCloseTimer.current = window.setTimeout(() => {
      setExpandedScript(null);
      setScriptClosing(false);
      setScriptReturning(true);
      requestAnimationFrame(() => window.scrollTo({ top: scriptReturnPosition.current, behavior: "instant" }));
    }, 480);
  }, [location.pathname]);

  useEffect(() => () => {
    if (scriptCloseTimer.current !== null) window.clearTimeout(scriptCloseTimer.current);
  }, []);

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
    <section
      className={`stage-hero ${selected.id}`}
      data-art-mode={selected.art.mode}
      style={{
        "--stage-accent": selected.color,
        "--portrait-x": selected.art.desktop.x,
        "--portrait-y": selected.art.desktop.y,
        "--portrait-scale": selected.art.desktop.scale,
        "--portrait-focus": selected.art.desktop.focus,
        "--portrait-mobile-x": selected.art.mobile.x,
        "--portrait-mobile-y": selected.art.mobile.y,
        "--portrait-mobile-scale": selected.art.mobile.scale,
        "--portrait-mobile-focus": selected.art.mobile.focus,
      } as React.CSSProperties}
    >
      <div key={`scene-${selected.id}`} className="character-backdrop" aria-hidden="true"><img src={selected.image} alt="" /></div>
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
      <div className="butterfly-field" aria-hidden="true"><span>◇</span><span>◇</span><span>◇</span><span>◇</span><span>◇</span></div>
      <div className="hero-copy">
        {/* <div className="eyebrow"><span /> {t("home.archiveEyebrow", { index: `0${selectedIndex + 1}` })}</div> */}
        <p className="hero-kicker" dangerouslySetInnerHTML={{ __html: selected.quote }}></p>
        <h1 className={`outlined-name${nameLetters.length > 2 ? " long-name" : ""}`} data-name-length={nameLetters.length}>{nameLetters.map((letter, index) => {
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
        <p className="hero-en"><span>{selected.en}</span><span>{selected.epithet}</span> </p>
        {/* <div className="hero-specs" aria-label="角色属性"><span><small>PATH</small>{selected.path}</span><span><small>TYPE</small>{selected.element}</span><span><small>ORIGIN</small>{selected.city}</span></div> */}
        <div className="hero-spacer"></div>
         <p className="hero-description hero-description1" dangerouslySetInnerHTML={{ __html: selected.bio}}></p>

        <div className="hero-actions" aria-hidden={detailOpen}><button className="primary-action" onClick={openDetail} tabIndex={detailOpen ? -1 : 0}>{t("home.enterArchive")} <span>↗</span></button></div>
        <button className="record-close" onClick={closeDetail} tabIndex={detailOpen ? 0 : -1} aria-hidden={!detailOpen}><span>←</span> {t("archive.close")} <small>ESC</small></button>
       <p className="hero-description hero-description2" dangerouslySetInnerHTML={{ __html: selected.bio}}></p>
      </div>
      <div className="hero-visual"><div className="halo" /><div key={selected.id} className="portrait-layer"><img src={selected.image} alt={t("home.portraitAlt", { name: selected.name })} /></div><div className="vertical-type">{selected.city} · {selected.path} · {selected.element}</div></div>
      <nav className="stage-character-nav" aria-label={t("home.switchCoverAria")} aria-hidden={detailOpen} data-label={t("home.selectCount", { count: `0${characters.length}` })}>
        <ol>{characters.map((character, index) => <li key={character.id}><button className={selected.id === character.id ? "active" : ""} onClick={() => selectCharacter(character)} aria-pressed={selected.id === character.id} tabIndex={detailOpen ? -1 : 0}><span className="nav-index">0{index + 1}</span><span className="nav-portrait"><img src={character.avatar} alt="" /></span><span className="nav-copy"><strong>{character.name}</strong><small>{character.en}</small></span></button></li>)}</ol>
      </nav>
      <div className="hero-counter"><span>0{selectedIndex + 1}</span><i /><small>0{characters.length}</small></div>
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
