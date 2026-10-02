import { expect, test } from "@playwright/test";

const copy = {
  es: {
    title: "Centro de participación familiar",
    description: "Información comprensible para familias y acudientes sobre el acompañamiento educativo de los estudiantes.",
    support: "Apoyo Alto",
    learning: "¿Cómo aprende mejor?",
    unavailable: "Su cuenta no tiene autorización para consultar estudiantes.",
    loadError: "No fue posible cargar la información para familias.",
    empty: "No hay estudiantes disponibles para mostrar.",
  },
  en: {
    title: "Family engagement center",
    description: "Clear information for families and caregivers about students' educational support process.",
    support: "Support High",
    learning: "How does this student learn best?",
    unavailable: "Your account is not authorized to view students.",
    loadError: "Family information could not be loaded.",
    empty: "No students are available to display.",
  },
} as const;

for (const locale of ["es", "en"] as const) {
  test(`family data and service rejection stay in ${locale}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("ilp.locale", value), locale);
    await page.route("**/auth/refresh", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ accessToken: "SYNTHETIC-LOCALE-FAMILY", email: "review@example.invalid", mfaRequired: false }),
    }));
    await page.route("**/api/v1/students", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{
        id: "SYNTHETIC-001", fullName: "Synthetic Student", grade: "10",
        learningProfile: "PENDING", supportLevel: "HIGH",
        pedagogicalRecommendations: [], inclusiveStrategies: [],
      }]),
    }));

    await page.goto("/family");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 3, name: copy[locale].title })).toBeVisible();
    await expect(page.getByText(copy[locale].description)).toBeVisible();
    await expect(page.getByText("Synthetic Student")).toBeVisible();
    await expect(page.getByText(copy[locale].support)).toBeVisible();
    await expect(page.getByText(copy[locale].learning)).toBeVisible();
    await expect(page.getByText(locale === "es" ? "Support High" : "Apoyo Alto")).toHaveCount(0);

    await page.unroute("**/api/v1/students");
    await page.route("**/api/v1/students", (route) => route.fulfill({
      status: 403, contentType: "application/json", body: '{"error":"synthetic-forbidden"}',
    }));
    await page.reload();
    await expect(page.getByText(copy[locale].unavailable)).toBeVisible();
    await expect(page.getByText(copy[locale].loadError)).toBeVisible();
    await expect(page.getByText("Synthetic Student")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  });

  test(`empty family list stays in ${locale}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("ilp.locale", value), locale);
    await page.route("**/auth/refresh", (route) => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ accessToken: "SYNTHETIC-LOCALE-FAMILY", email: "review@example.invalid", mfaRequired: false }),
    }));
    await page.route("**/api/v1/students", (route) => route.fulfill({
      status: 200, contentType: "application/json", body: "[]",
    }));
    await page.goto("/family");
    await expect(page.getByText(copy[locale].empty)).toBeVisible();
  });
}
