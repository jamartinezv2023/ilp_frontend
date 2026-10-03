import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
test('production boundary: persisted answers, bilingual downloads and withdrawal', async ({ page, request }) => {
  const session = await (await request.get('/test/session')).json();
  const headers = { Authorization: `Bearer ${session.token}`, 'X-Tenant-Id': session.tenant, 'X-Scientific-Grant': session.assignment };
  const submitted = await request.post('/api/v1/assessment-submissions', { headers, data: session.submission });
  expect(submitted.status()).toBe(201);
  for (const locale of ['es', 'en']) {
    await page.addInitScript(value => localStorage.setItem('ilp.locale', value), locale);
    await page.goto('/e2e/productive-authorization/index.html');
    await page.getByLabel(locale === 'es' ? 'Identificador de asignación institucional' : 'Institutional assignment ID').fill(session.assignment);
    await page.getByRole('button', { name: locale === 'es' ? 'Consultar historial' : 'Load history' }).click();
    await page.getByRole('button', { name: locale === 'es' ? 'Verificar dataset' : 'Verify dataset' }).click();
    const csvEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV', exact: true }).click();
    const csv = await readFile(await (await csvEvent).path());
    const manifestEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: locale === 'es' ? 'Manifiesto' : 'Manifest', exact: true }).click();
    const manifest = JSON.parse(await readFile(await (await manifestEvent).path(), 'utf8'));
    expect(manifest.sha256).toBe(createHash('sha256').update(csv).digest('hex'));
    expect(manifest.administrationId).toBe(session.submission.administrationId);
    expect(manifest.instrumentVersion).toBe(session.submission.assessmentVersion);
    expect(manifest.assignmentId).toBe(session.assignment);
    expect(manifest.rowCount).toBe(1);
  }
  await page.route('**/snapshot', async route => {
    const response = await route.fetch(); const data = await response.json(); data.csv += 'CORRUPTED';
    await route.fulfill({ response, json: data });
  });
  await page.getByRole('button', { name: 'Verify dataset' }).click();
  await expect(page.getByRole('status')).toContainText('verification failed');
  await expect(page.getByRole('button', { name: 'CSV', exact: true })).toHaveCount(0);
  page.on('dialog', dialog => dialog.accept());
  await page.getByLabel('Acceptance evidence ID').fill(session.evidence);
  await page.getByRole('button', { name: 'Withdraw consent', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Consent withdrawn');
  expect((await request.get(`/api/v1/scientific-applications/${session.assignment}/history`, { headers })).status()).toBe(403);
  expect((await request.post('/api/v1/assessment-submissions', { headers, data: session.submission })).status()).toBe(403);
  expect((await request.get('/api/v1/datasets/educational-ml/training-snapshot', { headers })).status()).toBe(403);
});
