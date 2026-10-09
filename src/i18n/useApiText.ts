import { useCallback } from "react";
import { useI18n } from "./I18nProvider";
import catalog from "./apiContentCatalog.json";
export type LocalizedContentSource = { localizedContent?: Record<string, BilingualText> };
export type BilingualText = { es: string; en: string };
const entries: Record<string, BilingualText> = catalog;
export const resolveApiText = (value: string, locale: "es" | "en", source?: LocalizedContentSource): string => {
  const content = source?.localizedContent?.[value] ?? entries[value];
  return (typeof content?.[locale] === "string" && content[locale].trim() ? content[locale] : undefined) ?? (locale === "es"
    ? "Contenido sin traducción disponible en español."
    : "Content has no available English translation.");
};
export const useApiText = () => {
  const { locale } = useI18n();
  return useCallback((value: string, source?: LocalizedContentSource) => resolveApiText(value, locale, source), [locale]);
};
