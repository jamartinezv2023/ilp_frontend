import { test, expect } from "@playwright/test";

test("research platform login page renders its accessible authentication contract", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Inclusive Learning Platform",
    })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "Research Platform Access",
    })
  ).toBeVisible();

  await expect(
    page.getByLabel("Institutional Email")
  ).toBeVisible();

  await expect(
    page.getByLabel("Password")
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "Access Platform",
    })
  ).toBeVisible();
});
