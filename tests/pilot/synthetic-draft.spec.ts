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
