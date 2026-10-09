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
