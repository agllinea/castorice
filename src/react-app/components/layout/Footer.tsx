import { useI18n } from "../../i18n";

export function Footer() {
  const { t } = useI18n();
  return <footer><div className="footer-mark">◇</div><div><strong>{t("common.brand")}</strong><span>{t("footer.subtitle")}</span></div><p>{t("footer.copyright")}<br />{t("footer.notice")}</p><a href="#top">{t("footer.backToTop")} ↑</a></footer>;
}
