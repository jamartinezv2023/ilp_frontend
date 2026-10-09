import { expect, test } from "@playwright/test";
const student = { id: "S1", fullName: "Synthetic High", supportLevel: "HIGH", grade: "7" };
const plan = { planId: null, createdAt: null, studentId: "S1", fullName: "Synthetic High",
 learningProfile: "DIVERGENT", vocationalInterest: "SCIENTIFIC", supportLevel: "HIGH",
 riskLevel: "HIGH", recommendedMethodology: "PROJECT_BASED_LEARNING", learningPreferences: [],
 recommendedResources: [], adaptivePathway: [], teacherActions: [], inclusionActions: [], familyActions: [] };

for (const locale of ["es", "en"] as const) {
 test(`read-only preview and recovery ${locale}`, async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem("ilp.locale", value), locale);
  // Synthetic session for this isolated UI test; no real login is performed.
  await page.route("**/auth/refresh", route => route.fulfill({
    status: 200,
    json: { accessToken: "SYNTHETIC-PREVIEW-SESSION", email: "review@example.invalid", mfaRequired: false },
  }));
  let writes = 0;
  page.on("request", request => { if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) && request.url().includes("/api/v1/adaptive/")) writes++; });
  await page.route("**/api/**", route => route.fulfill({ status: 404, json: {} }));
  await page.route("**/api/v1/students", route => route.fulfill({ json: [student] }));
  let count = 0;
  let release: () => void = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/v1/adaptive/students/S1", async route => {
   count++;
   if (count === 2) await pending;
   if (count === 3) { await route.fulfill({ status: 403, json: {} }); return; }
   await route.fulfill({ json: plan });
  });
  await page.goto("/adaptive");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading", {
    name: locale === "es" ? "Centro de inteligencia adaptativa" : "Adaptive Intelligence Center",
    exact: true,
  })).toBeVisible();
  const refresh = page.getByRole("button", { name: locale === "es" ? "Actualizar vista previa" : "Refresh preview" });
  await expect(refresh).toBeVisible();
  await refresh.click();
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(refresh).toHaveCount(0);
  await expect(page.getByText(/Riesgo adaptativo:|Adaptive risk:/)).toHaveCount(0);
  release();
  await expect(refresh).toBeVisible();
  await refresh.click();
  const retry = page.getByRole("button", { name: locale === "es" ? "Reintentar consulta" : "Retry preview" });
  await expect(retry).toBeVisible();
  await expect(refresh).toHaveCount(0);
  await retry.click();
  await expect(refresh).toBeVisible();
  await expect(page.getByRole("heading", { name: "Synthetic High", exact: true })).toBeVisible();
  expect(count).toBe(4);
  expect(writes).toBe(0);
 });
}
