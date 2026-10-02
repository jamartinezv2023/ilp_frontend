import { expect, test } from "@playwright/test";

test("el acceso cambia completamente entre castellano e inglés", async ({ page }) => {
  await page.route("**/auth/refresh", (route) => route.fulfill({
    status: 401,
    contentType: "application/json",
    body: '{"error":"unauthorized"}',
  }));
  await page.goto("/");
  const selector = page.getByRole("combobox").first();
  await expect(selector).toBeVisible();

  await selector.click();
  await page.getByRole("option", { name: "Castellano" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { name: "Plataforma de Aprendizaje Inclusivo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acceso a la plataforma de investigación" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Acceder a la plataforma" })).toBeVisible();
  await expect(page.getByText("Research Platform Access")).toHaveCount(0);
  await expect(page.getByText("Secure authentication for researchers, educators and institutional stakeholders.")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Correo institucional" }).fill("invalido");
  await page.getByLabel("Contraseña").fill("corta");
  await page.getByRole("button", { name: "Acceder a la plataforma" }).click();
  await expect(page.getByText("Ingrese un correo electrónico válido.")).toBeVisible();
  await expect(page.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeVisible();

  await selector.click();
  await page.getByRole("option", { name: "Inglés" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Inclusive Learning Platform" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Research Platform Access" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Access Platform" })).toBeVisible();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("The password must contain at least 8 characters.")).toBeVisible();
  await expect(page.getByText("Ingrese un correo electrónico válido.")).toHaveCount(0);
  await expect(page.getByText("Plataforma de investigación doctoral orientada al apoyo de decisiones educativas mediante inteligencia artificial explicable, ética e inclusiva.")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Research Platform Access" })).toBeVisible();
});
