import { expect, test } from "@playwright/test";

test("un intento ficticio sigue pendiente tras recarga offline y nunca contacta al backend", async ({ page, context }) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/|onrender\.com|neon\.tech/i.test(request.url())) apiRequests.push(request.url());
  });
  await page.goto("/offline-lab/index.html");
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.ready;
    const cache = await caches.open("ilp-synthetic-offline-lab-v1");
    const entries = await Promise.all(["index.html", "style.css", "app.mjs", "store.mjs"]
      .map((path) => cache.match(new URL("./" + path, location.href))));
    return Boolean(registration.active && entries.every(Boolean));
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.getByRole("button", { name: "Crear intento ficticio pendiente" }).click();
  await expect(page.locator("#history li")).toHaveCount(1);
  const before = await page.locator("#history li").innerText();
  expect(before).toMatch(/[0-9a-f-]{36}.*PHYSICS-SYNTHETIC-REVIEW.*PENDIENTE LOCAL/);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#history li")).toHaveText(before);
  await expect(page.locator("#status")).toContainText("Ninguno ha sido enviado ni confirmado");
  expect(apiRequests).toEqual([]);
});

test("borrar elimina los intentos locales incluso tras recargar", async ({ page }) => {
  await page.goto("/offline-lab/index.html");
  await page.getByRole("button", { name: "Crear intento ficticio pendiente" }).click();
  await expect(page.locator("#history li")).toHaveCount(1);
  await page.getByRole("button", { name: "Borrar intentos de este navegador" }).click();
  await expect(page.locator("#history li")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#history li")).toHaveCount(0);
  await expect(page.locator("#status")).toContainText("0 intento(s)");
});

test("la demostración académica conserva su historial sólo en memoria", async ({ page }) => {
  await page.goto("/review/index.html");
  await expect(page.locator("#history li")).toHaveText("Todavía no hay intentos en esta sesión.");
  await page.goto("/offline-lab/index.html");
  await page.getByRole("button", { name: "Crear intento ficticio pendiente" }).click();
  await page.goto("/review/index.html");
  await expect(page.locator("#history li")).toHaveText("Todavía no hay intentos en esta sesión.");
});
