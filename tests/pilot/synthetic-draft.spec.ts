import { expect, test } from '@playwright/test';
for (const locale of ['es', 'en'] as const) {
  for (const width of [360, 768, 1440]) {
    test(`synthetic durable draft ${locale} ${width}`, async ({ page, context }) => {
      await page.setViewportSize({ width, height: 800 });
      await context.addInitScript(value => localStorage.setItem('ilp.locale', value), locale);
      let submissions = 0;
      context.on('request', request => { if (request.method() === 'POST') submissions++; });
      await page.goto('/p02.html');
      const save = page.getByRole('button', { name: locale === 'es' ? 'Guardar en este dispositivo' : 'Save on this device' });
      await expect(save).toBeEnabled();
      await page.getByRole('radio').nth(1).check();
      await save.click();
      await expect(page.getByText(locale === 'es' ? 'Guardado en este dispositivo. No enviado.' : 'Saved on this device. Not submitted.')).toBeVisible();
      const attempt = await page.getByTestId('attempt').innerText();
      expect(attempt).toMatch(/^[\da-f-]{36}$/);
      await page.reload();
      await expect(page.getByRole('radio').nth(1)).toBeChecked();
      await expect(page.getByTestId('attempt')).toHaveText(attempt);
      await page.getByRole('combobox').selectOption(locale === 'es' ? 'en' : 'es');
      await expect(page.getByTestId('attempt')).toHaveText(attempt);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const other = await context.newPage();
      await other.goto('/p02.html?owner=B');
      await expect(other.getByRole('button').first()).toBeEnabled();
      await expect(other.getByTestId('attempt')).toBeEmpty();
      await other.goto('/p02.html');
      await expect(other.getByTestId('attempt')).toHaveText(attempt);
      await expect(other.getByRole('radio').nth(1)).toBeChecked();
      expect(submissions).toBe(0);
    });
  }
  test(`unavailable storage is explicit ${locale}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('ilp.locale', value);
      Object.defineProperty(window, 'indexedDB', { value: undefined });
    }, locale);
    await page.goto('/p02.html');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button').first()).toBeDisabled();
    await expect(page.getByTestId('attempt')).toBeEmpty();
  });
}
for (const locale of ['es', 'en'] as const) {
  test(`recovers after online browser restart ${locale}`, async () => {
    const { chromium } = await import('@playwright/test');
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const profile = await mkdtemp(join(tmpdir(), 'ilp-p02-'));
    let context = await chromium.launchPersistentContext(profile, { headless: true });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5188/p02.html');
      await page.getByRole('combobox').selectOption(locale);
      await expect(page.getByRole('button').first()).toBeEnabled();
      await page.getByRole('radio').first().check();
      await page.getByRole('button').first().click();
      await expect(page.getByText(locale === 'es' ? 'Guardado en este dispositivo. No enviado.' : 'Saved on this device. Not submitted.')).toBeVisible();
      const attempt = await page.getByTestId('attempt').innerText();
      await context.close();
      context = await chromium.launchPersistentContext(profile, { headless: true });
      const reopened = await context.newPage();
      await reopened.goto('http://127.0.0.1:5188/p02.html');
      await expect(reopened.locator('html')).toHaveAttribute('lang', locale);
      await expect(reopened.getByTestId('attempt')).toHaveText(attempt);
      await expect(reopened.getByRole('radio').first()).toBeChecked();
    } finally {
      await context.close();
      await rm(profile, { recursive: true, force: true });
    }
  });
}
for (const locale of ['es', 'en'] as const) {
  test(`reopens after offline browser restart ${locale}`, async () => {
    const { chromium } = await import('@playwright/test');
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const profile = await mkdtemp(join(tmpdir(), 'ilp-p02-offline-'));
    let context = await chromium.launchPersistentContext(profile, { headless: true });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5188/p02.html');
      await page.getByRole('combobox').selectOption(locale);
      await expect(page.getByTestId('offline-preparation')).toHaveText(locale === 'es' ? 'Laboratorio preparado para reabrir sin conexión en este navegador.' : 'Laboratory ready to reopen offline in this browser.');
      await page.getByRole('radio').nth(1).check();
      await page.getByRole('button').first().click();
      await expect(page.getByText(locale === 'es' ? 'Guardado en este dispositivo. No enviado.' : 'Saved on this device. Not submitted.')).toBeVisible();
      const attempt = await page.getByTestId('attempt').innerText();
      await context.close();
      context = await chromium.launchPersistentContext(profile, { headless: true, offline: true });
      const offline = await context.newPage();
      await offline.goto('http://127.0.0.1:5188/p02.html');
      await expect(offline.locator('html')).toHaveAttribute('lang', locale);
      await expect(offline.getByTestId('attempt')).toHaveText(attempt);
      await expect(offline.getByRole('radio').nth(1)).toBeChecked();
      await expect(offline.getByTestId('offline-preparation')).toHaveText(locale === 'es' ? 'Laboratorio preparado para reabrir sin conexión en este navegador.' : 'Laboratory ready to reopen offline in this browser.');
      await offline.getByRole('radio').first().check();
      await offline.getByRole('button').first().click();
      await expect(offline.getByText(locale === 'es' ? 'Guardado en este dispositivo. No enviado.' : 'Saved on this device. Not submitted.')).toBeVisible();
      await offline.reload();
      await expect(offline.getByRole('radio').first()).toBeChecked();
      await expect(offline.getByTestId('attempt')).toHaveText(attempt);
      await offline.goto('http://127.0.0.1:5188/p02.html?owner=B');
      await expect(offline.getByRole('button').first()).toBeEnabled();
      await expect(offline.getByTestId('attempt')).toBeEmpty();
      await expect(offline.evaluate(() => fetch('/api/private-probe'))).rejects.toThrow();
      await expect(offline.evaluate(() => fetch('/p02.html', { method: 'POST' }))).rejects.toThrow();
      await expect(offline.evaluate(() => fetch('/'))).rejects.toThrow();
    } finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
  });
}
test('first visit offline is not advertised as prepared', async ({ page, context }) => {
  await context.setOffline(true);
  await expect(page.goto('/p02.html')).rejects.toThrow();
});
test('deleted cache is not advertised as ready', async ({ page }) => {
  await page.goto('/p02.html');
  await expect(page.getByTestId('offline-preparation')).toContainText('preparado');
  await page.evaluate(async () => { for (const name of await caches.keys()) await caches.delete(name); });
  await page.reload();
  await expect(page.getByTestId('offline-preparation')).toContainText('No se pudo preparar');
});
test('a waiting update activates after browser close and retains unrelated caches', async () => {
  const { chromium } = await import('@playwright/test');
  const { mkdtemp, rm, readFile, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const profile = await mkdtemp(join(tmpdir(), 'ilp-p02-update-'));
  const workerPath = 'dist-p02/p02-worker.js';
  const htmlPath = 'dist-p02/p02.html';
  const originalWorker = await readFile(workerPath, 'utf8');
  const originalHtml = await readFile(htmlPath, 'utf8');
  let context = await chromium.launchPersistentContext(profile, { headless: true });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5188/p02.html');
    await expect(page.getByTestId('offline-preparation')).toContainText('preparado');
    await page.evaluate(async () => { const cache = await caches.open('unrelated-cache'); await cache.put('/unrelated', new Response('retain')); });
    await writeFile(workerPath, originalWorker.replace(/const CACHE = "([^"]+)";/, 'const CACHE = "$1-update";'));
    await writeFile(htmlPath, originalHtml.replace('<head>', '<head><meta name="p02-release" content="updated">'));
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration?.update(); });
    await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(true);
    await expect(page.locator('meta[name="p02-release"]')).toHaveCount(0);
    await context.close();
    context = await chromium.launchPersistentContext(profile, { headless: true, offline: true });
    const reopened = await context.newPage();
    await reopened.goto('http://127.0.0.1:5188/p02.html');
    await expect(reopened.locator('meta[name="p02-release"]')).toHaveAttribute('content', 'updated');
    expect(await reopened.evaluate(() => caches.has('unrelated-cache'))).toBe(true);
    expect(await reopened.evaluate(async () => (await caches.keys()).filter(name => name.startsWith('ilp-p02-lab-')).length)).toBe(1);
  } finally {
    await context.close();
    await writeFile(workerPath, originalWorker);
    await writeFile(htmlPath, originalHtml);
    await rm(profile, { recursive: true, force: true });
  }
});
