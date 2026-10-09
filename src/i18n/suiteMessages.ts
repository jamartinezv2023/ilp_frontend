import catalog from "./suiteCatalog.json";

type Translation = Readonly<{ es: string; en: string }>;
const aliases: Readonly<Record<string, number>> = catalog.aliases;
/** Shared translations indexed by explicit interface aliases, never personal data. */
export const suiteMessages: Readonly<Record<string, Translation>> = Object.fromEntries(
  Object.entries(aliases).map(([source, index]) => [source, catalog.translations[index]]),
);
