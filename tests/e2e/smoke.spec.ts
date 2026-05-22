import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("http://localhost:5173");

  await expect(page.getByText(/ILP Login/i)).toBeVisible();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(page.getByLabel(/Password/i)).toBeVisible();
});
