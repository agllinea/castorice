import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../../i18n";
import type { ScriptEntry } from "../../types/content";
import { MarkdownContent } from "./markdown";

export function ScriptPage({ scripts }: { scripts: ScriptEntry[] }) {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const script = scripts.find((item) => item.id === id) ?? scripts[0];
  const nextScript = scripts[(scripts.findIndex((item) => item.id === script.id) + 1) % scripts.length];
  useEffect(() => window.scrollTo({ top: 0 }), [script.id]);
  return <main className="reader-view">
    <div className="reader-progress" />
    <aside className="reader-aside"><button onClick={() => navigate(-1)}>← {t("scripts.backToArchive")}</button><div><small>{t("scripts.episode")}</small><strong>{script.index}</strong></div><div className="reader-toc"><span>{t("scripts.currentCast")}</span>{script.cast.map((name) => <em key={name}>{name}</em>)}</div><span className="reader-mark">◇</span></aside>
    <article className="reader-article"><header><div className="eyebrow">{t("scripts.narrativeLog", { index: script.index })}</div><h1>{script.title}</h1><p>{script.subtitle}</p><div><span>{script.duration}</span><span>{script.cast.join(" · ")}</span><span>{t("scripts.markdownHtml")}</span></div></header><MarkdownContent markdown={script.markdown} /><Link className="reader-next" to={`/scripts/${nextScript.id}`}><small>{t("scripts.continueReading")}</small><strong>{nextScript.title}</strong><span>→</span></Link></article>
  </main>;
}
