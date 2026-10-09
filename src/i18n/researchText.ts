import catalog from "./researchCatalog.json";
import type { ApiRecord } from "../types/research";
type Locale = "es" | "en";
type Text = { es: string; en: string };
const fields: Record<string, Text> = catalog.fields;
const terms: Record<string, Text> = catalog.terms;
export const researchTerm = (value: string, locale: Locale): string =>
  terms[value]?.[locale] ?? (locale === "es" ? "Contenido sin traducción declarada" : "Content has no declared translation");
export const researchValue = (value: unknown, locale: Locale): string => {
  if (Array.isArray(value)) return value.map(item => researchValue(item, locale)).join(", ");
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return locale === "es" ? (value ? "Sí" : "No") : (value ? "Yes" : "No");
  if (typeof value === "string") return researchTerm(value, locale);
  return locale === "es" ? "No disponible" : "Unavailable";
};
export const researchDetails = (payload: ApiRecord, locale: Locale): string[] =>
  Object.entries(payload).filter(([key]) => Object.hasOwn(fields, key)).map(([key, value]) =>
    `${fields[key][locale]}: ${researchValue(value, locale)}`);
