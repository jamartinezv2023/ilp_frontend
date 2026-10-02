import { expect, test } from "@playwright/test";

const expected = {
  es: {
    teacherError: "No fue posible cargar los estudiantes. Verifique la conexión con el servicio.",
    assessment: "Centro para aplicar instrumentos educativos, calcular perfiles de aprendizaje, preferencias de procesamiento e intereses vocacionales.",
    administration: "Administración de usuarios, roles, permisos y configuración institucional.",
    headings: ["Gestión de usuarios", "Gestión de roles", "Gestión de permisos"],
  },
  en: {
    teacherError: "Students could not be loaded. Check the service connection.",
    assessment: "A center for administering educational instruments and exploring learning profiles, processing preferences and vocational interests.",
    administration: "Manage users, roles, permissions and institutional settings.",
    headings: ["User management", "Role management", "Permission management"],
  },
} as const;

for (const locale of ["es", "en"] as const) {
  test(`core content and errors stay in ${locale}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("ilp.locale", value), locale);
    await page.route("**/auth/refresh", (route) => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ accessToken: "SYNTHETIC-LOCALE-CORE", email: "review@example.invalid", mfaRequired: false }),
    }));
    await page.route("**/api/**", (route) => route.fulfill({
      status: 404, contentType: "application/json", body: '{"error":"synthetic-unavailable"}',
    }));

    await page.goto("/teacher");
    await expect(page.getByText(expected[locale].teacherError)).toBeVisible();
    await page.goto("/assessments");
    await expect(page.getByText(expected[locale].assessment)).toBeVisible();
    await page.goto("/administration");
    await expect(page.getByText(expected[locale].administration)).toBeVisible();
    for (const [index, path] of ["/users", "/roles", "/permissions"].entries()) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 3, name: expected[locale].headings[index] })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    }
  });
}
