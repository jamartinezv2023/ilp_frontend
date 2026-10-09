import { expect, test } from "@playwright/test";
import fixtures from "../fixtures/research-previews.json" with { type: "json" };
const paths = ["/analytics/governance/policy-preview", "/analytics/trustworthiness/assessment-preview",
 "/analytics/fairness/bias-assessment-preview", "/analytics/architecture/governance-preview",
 "/analytics/deployment/kubernetes-readiness-preview", "/analytics/research/ethics-readiness-preview",
 "/analytics/research/expert-validation-preview", "/analytics/research/instruments-validation-preview"];
for (const locale of ["es", "en"] as const) for (const width of [360, 768, 1440]) {
 test(`research layout ${locale} ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(value => localStorage.setItem("ilp.locale", value), locale);
  await page.route("**/auth/refresh", route => route.fulfill({ json: { accessToken: "SYNTHETIC", email: "review@example.invalid", mfaRequired: false } }));
  let reads = 0;
  await page.route("**/analytics/**", route => {
   reads++;
   const index = paths.indexOf(new URL(route.request().url()).pathname);
   return route.fulfill({ status: index < 0 ? 404 : 200, json: index < 0 ? {} : fixtures[index] });
  });
  await page.goto("/research");
  const main = page.locator("main");
  const governanceSummary = (language: "es" | "en") => main.getByRole("button", {
    name: language === "es" ? /^Gobernanza de IA educativa/ : /^Educational AI governance/,
  });
  await expect(main).toBeVisible();
  await expect.poll(() => reads).toBe(8);
  await expect(main.getByText(locale === "es" ? "Gobernanza" : "Governance", { exact: true })).toBeVisible();
  await expect(governanceSummary(locale).getByText(locale === "es" ? /Nivel de gobernanza: Institucional/ : /Governance level: Institutional/)).toBeVisible();
  for (const target of [locale === "es" ? "en" : "es", locale] as const) {
   await page.locator("header").getByRole("combobox").click();
   await page.getByRole("option").nth(target === "es" ? 0 : 1).click();
   await expect(page.locator("html")).toHaveAttribute("lang", target);
   await expect(governanceSummary(target).getByText(target === "es" ? /Nivel de gobernanza: Institucional/ : /Governance level: Institutional/)).toBeVisible();
   await expect(main.getByText(/sin traducción|no declared translation/)).toHaveCount(0);
   await expect(main.getByText(target === "es" ? "Respuestas del servidor" : "Backend responses", { exact: true })).toBeVisible();
   if (target === "es") await expect.poll(() => main.evaluate(element => {
    const copy = element.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("[data-technical-value]").forEach(value => value.remove());
    return copy.textContent?.match(/\b(?:backend|fallback|readiness|Endpoints)\b/g) ?? [];
   }), { message: "Spanish interface labels must be localized; API paths remain unchanged" }).toEqual([]);
   expect(reads).toBe(8);
  }
  await governanceSummary(locale).click();
  await expect(main.getByText(locale === "es" ? "Política ética: IA educativa no clínica" : "Ethical policy: Non-clinical educational AI", { exact: true })).toBeVisible();
  for (const scroll of [0, 400, 0]) {
   await main.evaluate((element, top) => { element.scrollTop = top; }, scroll);
   expect(await page.evaluate(() => {
    const header = document.querySelector("header")!.getBoundingClientRect();
    const content = document.querySelector("main")!.getBoundingClientRect();
    return content.top >= header.bottom && document.documentElement.scrollWidth <= innerWidth;
   })).toBe(true);
  }
 });
 test(`adaptive header ${locale} ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(value => localStorage.setItem("ilp.locale", value), locale);
  await page.route("**/auth/refresh", route => route.fulfill({ json: { accessToken: "SYNTHETIC", email: "review@example.invalid", mfaRequired: false } }));
  await page.route("**/api/v1/students", route => route.fulfill({ json: [] }));
  await page.goto("/adaptive");
  const heading = page.getByRole("heading", { name: locale === "es" ? "Centro de inteligencia adaptativa" : "Adaptive Intelligence Center", exact: true });
  await expect(heading).toBeVisible();
  await expect.poll(async () => {
   const top = (await heading.boundingBox())!.y;
   const header = (await page.locator("header").boundingBox())!;
   return top >= header.y + header.height;
  }).toBe(true);
  await expect(page.getByText(locale === "es" ? /Vista previa sin guardar/ : /Unsaved preview/)).toBeVisible();
 });
}
