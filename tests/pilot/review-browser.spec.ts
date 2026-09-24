import { expect, test } from "@playwright/test";

const reviewPath = "/review/index.html";

test("la actividad funciona tras recargar sin conexión y no contacta al backend", async ({ page, context }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/v1\/|onrender\.com|neon\.tech/i.test(request.url())) requests.push(request.url());
  });

  await page.goto(reviewPath);
  await expect(page.getByRole("heading", { name: /Aprendizaje inclusivo/ })).toBeVisible();
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active && navigator.serviceWorker.controller);
  });

  // Esperar todos los recursos necesarios antes de desconectar la red.
  await page.waitForFunction(async () => {
    const cache = await caches.open("ilp-review-v1");
    const paths = ["index.html", "app.mjs", "model.mjs", "style.css"];
    const entries = await Promise.all(paths.map((path) =>
      cache.match(new URL("./" + path, location.href))
    ));
    return entries.every(Boolean);
  });

  // La primera navegación puede recibir el control tras cargar el grafo de módulos.
  // Una recarga en línea asegura que el grafo ya pase por el service worker.
  await page.reload();
  await expect(page.locator("#network")).toContainText("En línea");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#network")).toContainText("Sin conexión");
  for (const name of ["Se duplica", "Hacia adelante", "Cero"]) {
    await page.getByRole("radio", { name, exact: true }).check();
  }
  await page.getByRole("button", { name: "Evaluar esta sesión" }).click();
  await expect(page.locator("#result")).toContainText("Resultado: 3 de 3");
  await expect(page.locator("#history li")).toHaveCount(1);
  expect(requests).toEqual([]);
});

test("reiniciar borra el historial y recargar no recupera respuestas", async ({ page }) => {
  await page.goto(reviewPath);
  for (const name of ["Se duplica", "Hacia adelante", "Cero"]) {
    await page.getByRole("radio", { name, exact: true }).check();
  }
  await page.getByRole("button", { name: "Evaluar esta sesión" }).click();
  await expect(page.locator("#history li")).toContainText(["Intento 1: 3 de 3"]);
  await page.getByRole("button", { name: "Reiniciar sesión" }).click();
  await expect(page.locator("#history li")).toHaveText("Todavía no hay intentos en esta sesión.");
  await expect(page.getByRole("radio", { name: "Se duplica" })).not.toBeChecked();
  await page.reload();
  await expect(page.locator("#history li")).toHaveText("Todavía no hay intentos en esta sesión.");
  await expect(page.getByRole("radio", { name: "Se duplica" })).not.toBeChecked();
});

test("el teclado recorre opciones, evalúa y reinicia", async ({ page }) => {
  await page.goto(reviewPath);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);

  for (const name of ["Se duplica", "Hacia adelante", "Cero"]) {
    const radio = page.getByRole("radio", { name, exact: true });
    for (let i = 0; i < 8 && !(await radio.evaluate((node) => node === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(radio).toBeFocused();
    await page.keyboard.press("Space");
    await expect(radio).toBeChecked();
  }
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Evaluar esta sesión" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#history li")).toContainText("Intento 1: 3 de 3");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Reiniciar sesión" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#history li")).toHaveText("Todavía no hay intentos en esta sesión.");
});
