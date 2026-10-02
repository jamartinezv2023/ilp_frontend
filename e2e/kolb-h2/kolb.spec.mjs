import { test, expect } from '@playwright/test';
const es = 'Las respuestas fueron rechazadas. Use los valores 1, 2, 3 y 4 una sola vez en cada grupo. No se guardó este intento.';
const en = 'The responses were rejected. Use ranks 1, 2, 3 and 4 exactly once in each group. This attempt was not saved.';
async function complete(page) {
  // The first combobox is the native language selector; the remaining 48 are MUI ranks.
  await expect(page.getByRole('combobox')).toHaveCount(49);
  for (let index = 0; index < 48; index++) {
    await page.getByRole('combobox').nth(index + 1).click();
    await page.getByRole('option', { name: String(4 - index % 4), exact: true }).click();
  }
}
for (const locale of ['es', 'en']) {
  test(`real H2 rejection and correction in ${locale}`, async ({ page, request }) => {
    await page.goto('/e2e/kolb-h2/index.html');
    await page.getByLabel('Language').selectOption(locale);
    await complete(page);
    const before = await (await request.get('/test/summary')).json();
    let posts = 0;
    await page.route('**/api/v1/assessments/kolb', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      posts++;
      const input = route.request().postDataJSON();
      input.answers[1] = input.answers[0];
      await route.continue({ postData: JSON.stringify(input) });
    });
    const response = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/v1/assessments/kolb'));
    await page.getByRole('button', { name: 'Enviar respuestas reales Kolb', exact: true }).click();
    const rejection = await response;
    expect(rejection.status()).toBe(422);
    expect((await rejection.json()).code).toBe('ASSESSMENT_SUBMISSION_INVALID');
    await expect(page.getByRole('alert').filter({ hasText: locale === 'es' ? es : en })).toHaveText(locale === 'es' ? es : en);
    expect(await (await request.get('/test/summary')).json()).toEqual(before);
    expect(posts).toBe(1);
    await expect(page.getByRole('button', { name: 'Enviar respuestas reales Kolb', exact: true })).toBeEnabled();
    await page.getByLabel('Language').selectOption(locale === 'es' ? 'en' : 'es');
    await expect(page.getByRole('alert').filter({ hasText: locale === 'es' ? en : es })).toHaveText(locale === 'es' ? en : es);
    expect(posts).toBe(1);
    await page.unroute('**/api/v1/assessments/kolb');
    const accepted = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/v1/assessments/kolb'));
    await page.getByRole('button', { name: 'Enviar respuestas reales Kolb', exact: true }).click();
    expect((await accepted).status()).toBe(200);
    await expect(page.getByRole('alert').filter({ hasText: 'Registro confirmado en historial:' })).toBeVisible();
    const after = await (await request.get('/test/summary')).json();
    expect(after.kolb).toBe(before.kolb + 1);
    expect(after.responses).toBe(before.responses);
    expect(after.results).toBe(before.results);
    expect(after.contexts).toBe(before.contexts);
  });
}
