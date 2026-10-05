import { expect, test, type Page } from "@playwright/test";
const profiles = [
  {
    id: "SYNTHETIC-HIGH",
    fullName: "ZXQ-001",
    supportLevel: "HIGH",
  },
  {
    id: "SYNTHETIC-LOW",
    fullName: "ZXQ-002",
    supportLevel: "LOW",
  },
];
async function expectUnavailable(page: Page) {
  await expect(page.getByText("—", { exact: true })).toHaveCount(3);
  await expect(page.getByText("50%", { exact: true })).toHaveCount(0);
  await expect(page.getByText("0", { exact: true })).toHaveCount(0);
  await expect(page.getByText("ZXQ-001", { exact: true })).toHaveCount(0);
}
for (const locale of ["es", "en"] as const) {
  test.describe(`Inclusion browser response in ${locale}`, () => {
    const retryName = locale === "es" ? "Reintentar" : "Retry";
    const emptyMessage = locale === "es"
      ? "No hay estudiantes disponibles en la respuesta del servicio."
      : "No students are available in the service response.";
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(
        value => localStorage.setItem("ilp.locale", value),
        locale,
      );
      await page.route("**/auth/refresh", route => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "SYNTHETIC-INCLUSION-BROWSER",
          email: "review@example.invalid",
          mfaRequired: false,
        }),
      }));
      // Block other API requests; only synthetic fixtures are permitted.
      await page.route("**/api/**", route => route.fulfill({
        status: 404,
        contentType: "application/json",
        body: '{"error":"synthetic-unavailable"}',
      }));
    });
    test("malformed response is an error, never an empty list", async ({ page }) => {
      await page.route("**/api/v1/students", route => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([...profiles, null]),
      }));
      await page.goto("/inclusion");
      await expect(page.getByRole("button", { name: retryName })).toBeVisible();
      await expect(page.getByText(emptyMessage, { exact: true })).toHaveCount(0);
      await expectUnavailable(page);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
    test("valid empty response displays absence of students", async ({ page }) => {
      await page.route("**/api/v1/students", route => route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"content":[]}',
      }));
      await page.goto("/inclusion");
      await expect(page.getByText(emptyMessage, { exact: true })).toBeVisible();
      await expect(page.getByText("0", { exact: true })).toHaveCount(2);
      await expect(page.getByText("0%", { exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: retryName })).toHaveCount(0);
    });
    for (const status of [401, 403]) {
      test(`HTTP ${status} keeps indicators unavailable`, async ({ page }) => {
        let requests = 0;
        await page.route("**/api/v1/students", route => {
          requests++;
          return route.fulfill({
            status,
            contentType: "application/json",
            body: '{"error":"synthetic-access-denied"}',
          });
        });
        await page.goto("/inclusion");
        await expect(page.getByRole("button", { name: retryName })).toBeVisible();
        await expectUnavailable(page);
        await expect(page.getByText(emptyMessage, { exact: true })).toHaveCount(0);
        expect(requests).toBe(1);
      });
    }
    test("retry publishes data only after the response is released", async ({ page }) => {
      let requests = 0;
      let release: (() => void) | undefined;
      const heldResponse = new Promise<void>(resolve => {
        release = resolve;
      });
      await page.route("**/api/v1/students", async route => {
        requests++;
        if (requests === 1) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([...profiles, null]),
          });
          return;
        }
        await heldResponse;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(profiles),
        });
      });
      try {
        await page.goto("/inclusion");
        await expect(page.getByRole("button", { name: retryName })).toBeVisible();
        await expectUnavailable(page);
        await page.getByRole("button", { name: retryName }).click();
        await expect.poll(() => requests).toBe(2);
        await expect(page.getByRole("progressbar")).toBeVisible();
        await expect(page.getByText("...", { exact: true })).toHaveCount(3);
        await expect(page.getByText("ZXQ-001", { exact: true })).toHaveCount(0);
        await expect(page.getByText("50%", { exact: true })).toHaveCount(0);
        await expect(page.getByText("0", { exact: true })).toHaveCount(0);
        await expect(page.getByText(emptyMessage, { exact: true })).toHaveCount(0);
        if (!release) throw new Error("Response release was not initialized");
        release();
        await expect(page.getByText("50%", { exact: true })).toBeVisible();
        await expect(page.getByText("ZXQ-001", { exact: true })).toBeVisible();
        await expect(page.getByRole("progressbar")).toHaveCount(0);
        await expect(page.getByRole("button", { name: retryName })).toHaveCount(0);
        expect(requests).toBe(2);
      } finally {
        release?.();
      }
    });
    test("another malformed response keeps the error state", async ({ page }) => {
      let requests = 0;
      await page.route("**/api/v1/students", route => {
        requests++;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: requests === 1 ? "{}" : '{"content":null}',
        });
      });
      await page.goto("/inclusion");
      await page.getByRole("button", { name: retryName }).click();
      await expect.poll(() => requests).toBe(2);
      await expect(page.getByRole("button", { name: retryName })).toBeVisible();
      await expectUnavailable(page);
      await expect(page.getByText(emptyMessage, { exact: true })).toHaveCount(0);
    });
  });
}