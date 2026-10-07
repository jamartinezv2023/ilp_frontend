import { expect, test, type Page, type APIRequestContext } from "@playwright/test";
const tenant = "11111111-1111-4111-8111-111111111111";
const password = "Synthetic-R9-Only!";
async function tokenFor(request: APIRequestContext, user = 1) {
  const response = await request.post("/auth/login", {
    headers: { "X-Tenant-Id": tenant }, data: { email: `synthetic${user}@example.invalid`, password },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.mfaRequired).toBe(false);
  expect(typeof body.accessToken).toBe("string");
  return body.accessToken as string;
}
async function login(page: Page, en: boolean, wrong = false) {
  await page.getByLabel(en ? /^Institutional Email\s*\*?$/ : /^Correo institucional\s*\*?$/).fill("synthetic1@example.invalid");
  await page.getByLabel(en ? /^Password\s*\*?$/ : /^Contraseña\s*\*?$/).fill(wrong ? "Wrong-R9-Password!" : password);
  const result = page.waitForResponse(response => response.url().endsWith("/auth/login") && response.request().method() === "POST");
  await page.locator('button[type="submit"]').click();
  return result;
}
for (const locale of ["es", "en"] as const) {
  test(`real auth boundary ${locale}`, async ({ request }) => {
    const wrong = await request.post("/auth/login", { headers: { "X-Tenant-Id": tenant },
      data: { email: "synthetic1@example.invalid", password: "Wrong-R9-Password!" } });
    expect(wrong.status()).toBe(401);
    const missing = await request.post("/auth/login", { data: { email: "synthetic1@example.invalid", password } });
    expect(missing.status()).toBe(400);
    const token = await tokenFor(request);
    const assignment = "90000000-0000-4000-8000-000000000021";
    const uri = `/api/v1/scientific-applications/${assignment}/history`;
    expect((await request.get(uri, { headers: { "X-Tenant-Id": tenant } })).status()).toBe(401);
    expect((await request.get(uri, { headers: { "X-Tenant-Id": tenant, Authorization: "Bearer invalid-token" } })).status()).toBe(401);
    expect((await request.get(uri, { headers: { "X-Tenant-Id": "22222222-2222-4222-8222-222222222222", Authorization: `Bearer ${token}` } })).status()).toBe(403);
    const other = await tokenFor(request, 2);
    expect((await request.get(uri, { headers: { "X-Tenant-Id": tenant, Authorization: `Bearer ${other}` } })).status()).toBe(403);
  });
  for (const width of [360, 1440]) {
    test(`authorized UI and history ${locale} ${width}`, async ({ page, request }) => {
      const en = locale === "en";
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem("ilp.locale", value), locale);
      const fixtureKey = `${locale}${width}`;
      await page.goto(`/r9.html?fixture=${fixtureKey}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      expect((await login(page, en, true)).status()).toBe(401);
      await expect(page.getByRole("alert")).toBeVisible();
      const loginResponse = await login(page, en);
      expect(loginResponse.status()).toBe(200);
      const { accessToken } = await loginResponse.json();
      const section = page.getByRole("region", { name: en ? "Synthetic assessment" : "Evaluación sintética" });
      await expect(section).toBeVisible();
      await expect(page.getByTestId("assignment")).toHaveText(/^[a-f0-9-]{36}$/);
      const assignment = await page.getByTestId("assignment").innerText();
      expect(assignment).toMatch(/^[a-f0-9-]{36}$/);
      const historyButton = () => page.getByRole("button", { name: en ? "Load history" : "Consultar historial", exact: true });
      await historyButton().click();
      await expect(page.getByTestId("history").getByRole("listitem")).toHaveCount(0);
      await page.getByRole("radio", { name: en ? "Synthetic response B" : "Respuesta sintética B" }).check();
      const sent = page.waitForResponse(response => response.url().endsWith("/api/v1/assessment-submissions") && response.request().method() === "POST");
      await page.getByRole("button", { name: en ? "Submit test response" : "Enviar respuesta de prueba" }).click();
      const response = await sent;
      expect(response.status()).toBe(201);
      const submitted = response.request().postDataJSON();
      const admin = submitted.administrationId;
      await expect(page.getByText(en ? "Response saved and recovered." : "Respuesta guardada y recuperada.", { exact: true })).toBeVisible();
      await expect(page.getByTestId("history").getByRole("listitem")).toHaveCount(1);
      await expect(page.getByTestId("history")).toContainText(admin);
      await expect(page.getByTestId("answers")).toContainText("R9-B");
      const headers = { "X-Tenant-Id": tenant, "X-Scientific-Grant": assignment, Authorization: `Bearer ${accessToken}` };
      expect((await request.post("/api/v1/assessment-submissions", { headers, data: submitted })).status()).toBe(409);
      const other = await tokenFor(request, 2);
      expect((await request.post("/api/v1/assessment-submissions", {
        headers: { ...headers, Authorization: `Bearer ${other}` }, data: { ...submitted, administrationId: `${admin}-denied` },
      })).status()).toBe(403);
      const recovered = await request.get(`/api/v1/scientific-applications/${assignment}/history`, { headers });
      const observations = await recovered.json();
      expect(observations).toHaveLength(1);
      expect(observations[0].administrationId).toBe(admin);
      expect(observations[0].context.completeContext.authorizedUserId).toBe("90000000-0000-4000-8000-000000000001");
      expect(observations[0].context.completeContext.authorizedTenantId).toBe(tenant);
      expect(observations[0].context.language).toBe(locale);
      // Change locale on the same assignment; identifiers and raw answers must remain exact.
      await page.getByLabel(en ? "Test language" : "Idioma de prueba", { exact: true }).selectOption(en ? "es" : "en");
      await expect(page.getByTestId("assignment")).toHaveText(assignment);
      await expect(page.getByTestId("answers")).toContainText("R9-B");
      await expect(page.getByText("Synthetic High", { exact: true })).toBeVisible();
      await page.getByLabel(en ? "Idioma de prueba" : "Test language", { exact: true }).selectOption(locale);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.reload();
      expect((await login(page, en)).status()).toBe(200);
      await expect(section).toBeVisible();
      await historyButton().click();
      await expect(page.getByTestId("history")).toContainText(admin);
      await page.getByRole("button", { name: en ? "Verify answers" : "Verificar respuestas", exact: true }).click();
      await expect(page.getByTestId("answers")).toContainText("R9-B");
      await expect(page.getByTestId("answers")).toContainText(submitted.assessmentVersion);
      // Actual withdrawal through the authorized API must remove all later access.
      const fixtures = await (await request.get("/r9-fixture.json")).json();
      expect((await request.post(`/api/v1/scientific-applications/consents/${fixtures[fixtureKey].evidenceId}/withdraw`, { headers })).status()).toBe(204);
      await historyButton().click();
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.getByTestId("history").getByRole("listitem")).toHaveCount(0);
      await expect(page.getByTestId("answers")).toHaveCount(0);
    });
  }
}
