import { describe, expect, it } from "vitest";
import fixtures from "../fixtures/research-previews.json";
import { researchDetails, researchTerm } from "../../src/i18n/researchText";
describe.each(["es", "en"] as const)("declared research content %s", locale => {
 it.each(fixtures.map((payload, index) => [index, payload] as const))("covers API preview %s and preserves raw data", (_index, payload) => {
  const before = JSON.stringify(payload);
  const details = researchDetails(payload, locale);
  expect(details).toHaveLength(Object.keys(payload).length);
  expect(details.join(" ")).not.toMatch(/sin traducción|no declared translation|undefined/);
  expect(JSON.stringify(payload)).toBe(before);
 });
});
it("localizes categories and does not guess unknown codes", () => {
 expect(researchTerm("Governance", "es")).toBe("Gobernanza");
 expect(researchTerm("Governance", "en")).toBe("Governance");
 expect(researchTerm("UNKNOWN", "es")).toBe("Contenido sin traducción declarada");
});

it.each(['es', 'en'] as const)('formats primitive evidence and rejects undeclared content in %s', locale => {
 const details = researchDetails({ governanceLevel: [true, false, 0, null, { personal: 'Never translate this' }, 'UNKNOWN'] }, locale);
 expect(details).toHaveLength(1);
 expect(details[0]).toContain(locale === 'es' ? 'Sí, No, 0, No disponible, No disponible, Contenido sin traducción declarada' : 'Yes, No, 0, Unavailable, Unavailable, Content has no declared translation');
 expect(details[0]).not.toContain('Never translate this');
});
