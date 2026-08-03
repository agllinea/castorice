import { useLayoutEffect } from "react";
import { Footer } from "../../components/layout/Footer";
import { useI18n } from "../../i18n";
import type { ScriptEntry } from "../../types/content";
import { getScriptHeadings, MarkdownContent, scriptHeadingId } from "./markdown";

export function ScriptFocusReader({ script, scripts, closing, onClose, onSelect }: { script: ScriptEntry; scripts: ScriptEntry[]; closing: boolean; onClose: () => void; onSelect: (script: ScriptEntry) => void }) {
  const { t } = useI18n();
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [script.id]);
  const index = scripts.findIndex((item) => item.id === script.id);
  const previous = scripts[(index - 1 + scripts.length) % scripts.length];
  const next = scripts[(index + 1) % scripts.length];
  const headings = getScriptHeadings(script.markdown);
  const toc = <ol>{headings.map((heading, headingIndex) => <li key={`${heading}-${headingIndex}`}><a href={`#${scriptHeadingId(heading)}`}><span>0{headingIndex + 1}</span>{heading}</a></li>)}</ol>;
  return <main className={`script-focus-view ${closing ? "is-closing" : ""}`}>
    <aside className="script-focus-toc"><small>{t("scripts.contents")}</small>{toc}<div><span>{t("scripts.cast")}</span>{script.cast.map((name) => <em key={name}>{name}</em>)}</div></aside>
    <header className="script-focus-title">
      <button className="script-focus-close" onClick={onClose}>← {t("scripts.backToList")} <small>ESC</small></button>
      <div className="eyebrow"><span /> {t("scripts.narrativeLog", { index: script.index })}</div>
      <div className="script-focus-heading"><span>{script.index}</span><div><small>{script.subtitle}</small><h1>{script.title}</h1></div></div>
      <p>{script.excerpt}</p>
      <div className="script-focus-meta"><span>{script.duration}</span><span>{script.cast.join(" · ")}</span><span>{t("scripts.markdownHtml")}</span></div>
      <nav className="script-mobile-toc" aria-label={t("scripts.contents")}><small>{t("scripts.contents")}</small>{toc}</nav>
    </header>
    <section className="script-focus-content">
      <MarkdownContent markdown={script.markdown} withHeadingIds />
      <nav className="script-record-pagination" aria-label={t("scripts.contents")}>
        <button onClick={() => onSelect(previous)}><small>← {t("scripts.previous")}</small><strong>{previous.title}</strong><span>{previous.index} · {previous.duration}</span></button>
        <button onClick={() => onSelect(next)}><small>{t("scripts.next")} →</small><strong>{next.title}</strong><span>{next.index} · {next.duration}</span></button>
      </nav>
    </section>
    <div className="script-focus-footer"><Footer /></div>
  </main>;
}
