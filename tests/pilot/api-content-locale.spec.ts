import { expect, test } from '@playwright/test';
for (const initial of ['es', 'en'] as const) {
  test(`API content preserves identity and recovers in ${initial}`, async ({ page }) => {
    await page.addInitScript(locale => localStorage.setItem('ilp.locale', locale), initial);
    await page.route('**/auth/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'SYNTHETIC', email: 'review@example.invalid', mfaRequired: false }) }));
    await page.route('**/api/**', r => r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
    let requests = 0;
    let release: () => void = () => {};
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/v1/students', async r => {
      requests++;
      if (requests === 1) { await r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }); return; }
      await pending;
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'UNCHANGED-ID', fullName: 'Synthetic High', learningProfile: 'CUSTOM-PROFILE', supportLevel: 'HIGH', inclusiveStrategies: [], localizedContent: { 'CUSTOM-PROFILE': { es: 'Perfil del API', en: 'API profile' } } }]) });
    });
    await page.goto('/inclusion');
    await page.getByRole('button', { name: initial === 'es' ? 'Reintentar' : 'Retry' }).click();
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(page.getByText('Synthetic High', { exact: true })).toHaveCount(0);
    release();
    await expect(page.getByRole('heading', { name: 'Synthetic High', exact: true })).toBeVisible();
    for (const locale of [initial, initial === 'es' ? 'en' : 'es', initial] as const) {
      if (locale !== await page.locator('html').getAttribute('lang')) {
        await page.locator('header').getByRole('combobox').click();
        await page.getByRole('option').nth(locale === 'es' ? 0 : 1).click();
      }
      await expect(page.getByText(locale === 'es' ? 'Perfil del API' : 'API profile', { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Synthetic High', exact: true })).toBeVisible();
      expect(requests).toBe(2);
    }
  });
}
