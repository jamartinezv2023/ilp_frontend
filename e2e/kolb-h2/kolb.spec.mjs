import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const patterns = [[4, 3, 2, 1], [1, 4, 3, 2], [3, 1, 4, 2]];
const ranks = Array.from({ length: 48 }, (_, index) => patterns[Math.floor(index / 4) % 3][index % 4]);
const labels = {
  es: { prepare: 'Preparar dataset sintético', csv: 'Descargar CSV', manifest: 'Descargar manifiesto', error: 'No se pudo validar el dataset. No se descargó ningún archivo.' },
  en: { prepare: 'Prepare synthetic dataset', csv: 'Download CSV', manifest: 'Download manifest', error: 'Dataset validation failed. No file was downloaded.' },
};
const es = 'Las respuestas fueron rechazadas. Use los valores 1, 2, 3 y 4 una sola vez en cada grupo. No se guardó este intento.';
const en = 'The responses were rejected. Use ranks 1, 2, 3 and 4 exactly once in each group. This attempt was not saved.';
async function complete(page) {
  // The first combobox is the native language selector; the remaining 48 are MUI ranks.
  await expect(page.getByRole('combobox')).toHaveCount(49);
  for (let index = 0; index < 48; index++) {
    await page.getByRole('combobox').nth(index + 1).click();
    await page.getByRole('option', { name: String(ranks[index]), exact: true }).click();
  }
}
for (const locale of ['es', 'en']) {
  test(`real H2 rejection and correction in ${locale}`, async ({ page, request }) => {
    await page.goto('/e2e/kolb-h2/index.html');
    await page.getByLabel('Language').selectOption(locale);
    let downloads = 0;
    page.on('download', () => downloads++);
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
    await expect(page.getByRole('button', { name: labels[locale].csv, exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Enviar respuestas reales Kolb', exact: true })).toBeEnabled();
    await page.getByLabel('Language').selectOption(locale === 'es' ? 'en' : 'es');
    await expect(page.getByRole('alert').filter({ hasText: locale === 'es' ? en : es })).toHaveText(locale === 'es' ? en : es);
    expect(posts).toBe(1);
    await page.unroute('**/api/v1/assessments/kolb');
    const accepted = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/v1/assessments/kolb'));
    await page.getByRole('button', { name: 'Enviar respuestas reales Kolb', exact: true }).click();
    const savedResponse = await accepted;
    expect(savedResponse.status()).toBe(200);
    const saved = await savedResponse.json();
    await expect(page.getByRole('alert').filter({ hasText: 'Registro confirmado en historial:' })).toBeVisible();
    const after = await (await request.get('/test/summary')).json();
    expect(after.kolb).toBe(before.kolb + 1);
    expect(after.responses).toBe(before.responses);
    expect(after.results).toBe(before.results);
    expect(after.contexts).toBe(before.contexts);
    await page.getByLabel('Language').selectOption(locale);
    const ui = labels[locale];
    expect(downloads).toBe(0);
    await expect(page.getByRole('button', { name: ui.csv, exact: true })).toBeDisabled();
    // A real builder validation failure must not create a downloadable snapshot.
    await page.route('**/test/kolb-dataset/*', route => route.continue({ url: route.request().url() + '?fault=rank' }));
    const invalidExport = page.waitForResponse(r => r.url().includes('/test/kolb-dataset/'));
    await page.getByRole('button', { name: ui.prepare, exact: true }).click();
    expect((await invalidExport).status()).toBe(422);
    await expect(page.getByRole('alert').filter({ hasText: ui.error })).toBeVisible();
    await expect(page.getByRole('button', { name: ui.csv, exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: ui.manifest, exact: true })).toBeDisabled();
    expect(downloads).toBe(0);
    expect(await (await request.get('/test/summary')).json()).toEqual(after);
    await page.unroute('**/test/kolb-dataset/*');
    // Transport corruption must also block both downloads in the browser.
    await page.route('**/test/kolb-dataset/*', async route => {
      const upstream = await route.fetch();
      const payload = await upstream.json();
      payload.csv += 'CORRUPTED';
      await route.fulfill({ response: upstream, json: payload });
    });
    const corruptedResponse = page.waitForResponse(r => r.url().includes('/test/kolb-dataset/'));
    await page.getByRole('button', { name: ui.prepare, exact: true }).click();
    await (await corruptedResponse).finished();
    await expect(page.getByRole('alert').filter({ hasText: ui.error })).toBeVisible();
    await expect(page.getByRole('button', { name: ui.csv, exact: true })).toBeDisabled();
    expect(downloads).toBe(0);
    await page.unroute('**/test/kolb-dataset/*');
    await page.getByRole('button', { name: ui.prepare, exact: true }).click();
    await expect(page.getByRole('button', { name: ui.csv, exact: true })).toBeEnabled();
    const csvEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: ui.csv, exact: true }).click();
    const csvDownload = await csvEvent;
    await csvDownload.saveAs(test.info().outputPath('kolb.csv'));
    const manifestEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: ui.manifest, exact: true }).click();
    const manifestDownload = await manifestEvent;
    await manifestDownload.saveAs(test.info().outputPath('kolb.manifest.json'));
    expect(csvDownload.suggestedFilename()).toBe(`${saved.assessmentId}.csv`);
    expect(manifestDownload.suggestedFilename()).toBe(`${saved.assessmentId}.manifest.json`);
    const csvBytes = await readFile(test.info().outputPath('kolb.csv'));
    const manifest = JSON.parse(await readFile(test.info().outputPath('kolb.manifest.json'), 'utf8'));
    expect(createHash('sha256').update(csvBytes).digest('hex')).toBe(manifest.csvSha256);
    expect(manifest.assessmentId).toBe(saved.assessmentId);
    expect(manifest.participantId).toBe(saved.studentId);
    expect(manifest.storedVersion).toBe(saved.instrumentVersion);
    expect(manifest.dataClass).toBe('SYNTHETIC_ONLY');
    const lines = csvBytes.toString('utf8').trimEnd().split('\n');
    expect(lines).toHaveLength(2);
    const headers = lines[0].split(',');
    const values = [...lines[1].matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(match => match[1].replaceAll('""', '"'));
    expect(values).toHaveLength(headers.length);
    const row = Object.fromEntries(headers.map((key, index) => [key, values[index]]));
    expect(row.assessment_id).toBe(saved.assessmentId);
    expect(row.participant_id).toBe(saved.studentId);
    expect(row.stored_version).toBe(saved.instrumentVersion);
    const persistedHistory = await (await request.get('/api/v1/assessments/kolb/students/SYNTHETIC-STUDENT-001')).json();
    const persisted = persistedHistory.find(item => item.assessmentId === saved.assessmentId);
    expect(persisted).toBeDefined();
    for (const [column, field] of [['score_ce', 'scoreCE'], ['score_ro', 'scoreRO'], ['score_ac', 'scoreAC'], ['score_ae', 'scoreAE'], ['learning_style', 'learningStyle']]) {
      expect(row[column]).toBe(String(persisted[field]));
      expect(persisted[field]).toBe(saved[field]);
    }
    for (const [offset, field] of ['scoreCE', 'scoreRO', 'scoreAC', 'scoreAE'].entries()) {
      expect(saved[field]).toBe(ranks.filter((_, index) => index % 4 === offset).reduce((sum, rank) => sum + rank, 0));
    }
    expect(Array.from({ length: 48 }, (_, index) => Number(row[`answer_${String(index + 1).padStart(2, '0')}`]))).toEqual(ranks);
    expect(Number.isFinite(Date.parse(row.created_at))).toBe(true);
    expect(Math.abs(Date.parse(row.created_at) / 1000 - saved.createdAt)).toBeLessThan(0.002);
    const again = await (await request.get(`/test/kolb-dataset/${saved.assessmentId}`)).json();
    expect(again.csv).toBe(csvBytes.toString('utf8'));
    expect(again.manifest.csvSha256).toBe(manifest.csvSha256);
    expect(downloads).toBe(2);
    expect(await (await request.get('/test/summary')).json()).toEqual(after);

  });
}
