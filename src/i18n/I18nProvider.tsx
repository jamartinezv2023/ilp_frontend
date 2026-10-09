import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { legacyTextPairs, messages, type Locale, type MessageKey } from "./messages";

const STORAGE_KEY = "ilp.locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  translateBackendValue: (value: string | null | undefined) => string;
  translateLegacyText: (value: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const normalizeLocale = (value: string | null): Locale =>
  value?.toLowerCase().startsWith("en") ? "en" : "es";

const legacyLookup = new Map<string, { es: string; en: string }>();
for (const [english, spanish] of legacyTextPairs) {
  const englishKey = english.trim().replace(/\s+/g, " ");
  const spanishKey = spanish.trim().replace(/\s+/g, " ");
  legacyLookup.set(englishKey, { es: spanish, en: english });
  legacyLookup.set(spanishKey, { es: spanish, en: english });
}

const legacyReplacements = {
  es: legacyTextPairs
    .map(([english, spanish]) => ({ source: english, target: spanish }))
    .sort((left, right) => right.source.length - left.source.length),
  en: legacyTextPairs
    .map(([english, spanish]) => ({ source: spanish, target: english }))
    .sort((left, right) => right.source.length - left.source.length),
};

const backendKeys: Record<string, MessageKey> = {
  HIGH: "status.high",
  MEDIUM: "status.medium",
  MODERATE: "status.medium",
  LOW: "status.low",
  PENDING: "status.pending",
  COMPLETE: "status.complete",
  COMPLETED: "status.complete",
  NOT_AVAILABLE: "status.notAvailable",
  UNAVAILABLE: "status.unavailable",
};

export const I18nProvider = ({ children }: PropsWithChildren) => {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "es";
    return normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
  });

  const handleLocaleChange = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
    document.title = messages[locale]["shell.platform"];
  }, [locale]);

  const t = useCallback((key: MessageKey) => messages[locale][key], [locale]);

  const translateLegacyText = useCallback(
    (value: string) => {
      const leading = value.slice(0, value.length - value.trimStart().length);
      const trailing = value.slice(value.trimEnd().length);
      const core = value.trim().replace(/\s+/g, " ");
      const translation = legacyLookup.get(core);
      if (translation) return `${leading}${translation[locale]}${trailing}`;

      let translated = core;
      for (const replacement of legacyReplacements[locale]) {
        if (replacement.source && translated.includes(replacement.source)) {
          translated = translated.replaceAll(replacement.source, replacement.target);
        }
      }
      return translated === core ? value : `${leading}${translated}${trailing}`;
    },
    [locale],
  );

  const translateBackendValue = useCallback(
    (value: string | null | undefined) => {
      if (!value) return "";
      const key = backendKeys[value.trim().toUpperCase().replaceAll(" ", "_")];
      return key ? messages[locale][key] : translateLegacyText(value.replaceAll("_", " "));
    },
    [locale, translateLegacyText],
  );

  const context = useMemo(
    () => ({ locale, setLocale: handleLocaleChange, t, translateBackendValue, translateLegacyText }),
    [locale, handleLocaleChange, t, translateBackendValue, translateLegacyText],
  );

  return <I18nContext.Provider value={context}>{children}</I18nContext.Provider>;
};

// The hook intentionally shares this module with its provider to keep the
// locale contract atomic and avoid circular dependencies.
// eslint-disable-next-line react-refresh/only-export-components
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
};
