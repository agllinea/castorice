import { useI18n } from "../../i18n";
import type { ScriptEntry } from "../../types/content";

export function ScriptCard({ script, compact = false, onOpen }: { script: ScriptEntry; compact?: boolean; onOpen?: (script: ScriptEntry) => void }) {
  const { t } = useI18n();
  return <article className={`script-card ${compact ? "compact" : ""}`}>
    <button className="script-card-trigger" onClick={() => onOpen?.(script)}>
      <span className="script-index">{script.index}</span>
      <div><small>{script.subtitle}</small><h3>{script.title}</h3><p>{script.excerpt}</p><div className="script-meta"><span>{script.duration}</span><span>{t("scripts.castCount", { count: script.cast.length })}</span></div></div>
      <span className="read-more">{t("scripts.read")} ↗</span>
    </button>
  </article>;
}
