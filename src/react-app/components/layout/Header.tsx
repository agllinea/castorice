import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import type { Character } from "../../types/content";

function ThemeButton({ theme, toggle }: { theme: string; toggle: () => void }) {
  const { t } = useI18n();
  const isDark = theme === "dark";
  const currentTheme = isDark ? t("common.darkTheme") : t("common.lightTheme");
  return <button className={`theme-button ${isDark ? "is-dark" : "is-light"}`} onClick={toggle} aria-label={`${t("common.toggleTheme")} · ${currentTheme}`} title={currentTheme}>
    <span className="theme-icon-stack" aria-hidden="true"><i className="theme-icon-sun">☼</i><i className="theme-icon-moon">☾</i></span>
  </button>;
}

function MusicButton({ muted, toggle, character }: { muted: boolean; toggle: () => void; character: Character }) {
  const { t } = useI18n();
  return <button
    className={`music-toggle ${muted ? "is-muted" : "is-playing"}`}
    onClick={toggle}
    aria-label={muted ? t("common.enableMusicTrack", { track: character.track }) : t("common.muteMusicTrack", { track: character.track })}
    aria-pressed={!muted}
    title={muted ? t("common.enableMusic") : t("common.nowPlaying", { track: character.track })}
    style={{ "--music-accent": character.color } as React.CSSProperties}
  >
    <span className="music-album" aria-hidden="true">
      <span className="music-disc"><i>✦</i></span>
      <span className="music-note">♪</span>
      <span className="music-slash" />
    </span>
  </button>;
}

export function Header({ theme, toggleTheme, muted, toggleMuted, character }: { theme: string; toggleTheme: () => void; muted: boolean; toggleMuted: () => void; character: Character }) {
  const { t } = useI18n();
  return <header className="site-header">
    <Link className="brand" to="/" aria-label={t("common.homeAria")}><span className="brand-mark">◇</span><span><strong>{t("common.brand")}</strong><small>{t("common.brandSubtitle")}</small></span></Link>
    <div className="header-actions"><ThemeButton theme={theme} toggle={toggleTheme} /><MusicButton muted={muted} toggle={toggleMuted} character={character} /></div>
  </header>;
}
