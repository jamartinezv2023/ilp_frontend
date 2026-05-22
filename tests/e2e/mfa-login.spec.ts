import { test, expect } from "@playwright/test";

test("enterprise login form flow", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByText(/ILP Login/i)
  ).toBeVisible();

  await page.getByLabel(/Email/i)
    .fill("admin@ilp.com");

  await page.getByLabel(/Password/i)
    .fill("Admin123*");

  await expect(
    page.getByRole("button")
  ).toBeVisible();
});
