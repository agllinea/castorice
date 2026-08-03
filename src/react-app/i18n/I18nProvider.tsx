import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import cn from "./locales/cn.json";

export const supportedLocales = ["cn"] as const;
export type Locale = (typeof supportedLocales)[number];
export type TranslationParams = Record<string, string | number>;

type Dictionary = Record<string, unknown>;
type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
};

const dictionaries: Record<Locale, Dictionary> = { cn };
const documentLanguages: Record<Locale, string> = { cn: "zh-CN" };
const I18nContext = createContext<I18nContextValue | null>(null);

function resolveTranslation(dictionary: Dictionary, key: string) {
  return key.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Dictionary)[segment];
  }, dictionary);
}

function interpolate(message: string, params: TranslationParams) {
  return message.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? `{{${key}}}`));
}

export function I18nProvider({ children, initialLocale = "cn" }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem("castorice-locale") as Locale | null;
    return stored && supportedLocales.includes(stored) ? stored : initialLocale;
  });

  useEffect(() => {
    localStorage.setItem("castorice-locale", locale);
    document.documentElement.lang = documentLanguages[locale];
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key, params = {}) => {
      const translation = resolveTranslation(dictionaries[locale], key);
      if (typeof translation !== "string") {
        if (import.meta.env.DEV) console.warn(`[i18n] Missing translation: ${locale}.${key}`);
        return key;
      }
      return interpolate(translation, params);
    },
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
