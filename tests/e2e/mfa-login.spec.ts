import { test, expect } from "@playwright/test";

test("valid local MVP credentials grant access to the institutional workspace", async ({ page }) => {
  await page.goto("/");

  const email =
    page.getByLabel("Institutional Email");

  const password =
    page.getByLabel("Password");

  await expect(email).toBeVisible();
  await expect(password).toBeVisible();

  await email.fill("admin@demo.com");
  await password.fill("Admin123*");

  await page
    .getByRole("button", {
      name: "Access Platform",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Research Platform Access",
    })
  ).not.toBeVisible();

  await expect(page).toHaveURL(
    /\/institutional\/?$/
  );
});
