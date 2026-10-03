import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const subject = '11111111-1111-1111-1111-111111111111';
for (const locale of ['es', 'en']) {
  test(`canonical application, consent, retry, history and downloads in ${locale}`, async ({ page, request }, info) => {
    const words = locale === 'es' ? {
      start: 'Iniciar aplicación', consent: 'Confirmo el consentimiento de prueba', submit: 'Enviar aplicación',
      invalid: 'Rankings inválidos. Use 1, 2, 3 y 4 una vez por grupo. No se guardó el intento.', denied: 'Aplicación no autorizada o consentimiento inactivo. No se guardó el intento.', timing: 'Tiempo de aplicación incoherente. No se guardó el intento.',
      confirmed: 'Aplicación confirmada en historial', prepare: 'Verificar dataset', csv: 'Descargar CSV',
      manifest: 'Descargar manifiesto', dictionary: 'Descargar diccionario', failed: 'No se pudo confirmar la aplicación. Conserve sus respuestas.',
      blocked: 'No se pudo validar el dataset. Descargas bloqueadas.',
    } : {
      start: 'Start application', consent: 'I confirm the test consent', submit: 'Submit application',
      invalid: 'Invalid ranks. Use 1, 2, 3 and 4 once per group. This attempt was not saved.', denied: 'Application unauthorized or consent inactive. This attempt was not saved.', timing: 'Inconsistent application timing. This attempt was not saved.',
      confirmed: 'Application confirmed in history', prepare: 'Verify dataset', csv: 'Download CSV',
      manifest: 'Download manifest', dictionary: 'Download dictionary', failed: 'Application could not be confirmed. Keep your answers.',
      blocked: 'Dataset validation failed. Downloads blocked.',
    };
    const before = await (await request.get('/test/summary')).json();
    await page.goto('/e2e/authorized-application/index.html');
    await page.getByRole('combobox', { name: 'Language' }).selectOption(locale);
    const sessionResponse = page.waitForResponse(response => response.url().endsWith('/test/session'));
    await page.getByRole('button', { name: words.start, exact: true }).click();
    const session = await (await sessionResponse).json();
    const headers = { Authorization: `Bearer ${session.accessToken}`, 'X-Tenant-Id': session.tenantId, 'X-Scientific-Grant': session.grantId };
    const api = {
      get: url => request.get(url, { headers }),
      post: (url, options) => request.post(url, { ...options, headers }),
    };
    const protectedUrl = `/api/v1/participants/${subject}/assessment-scientific-history`;
    expect((await request.get(protectedUrl)).status()).toBe(401);
    for (const [key, status] of [['wrongUserToken', 403], ['wrongTenantToken', 403], ['wrongAudienceToken', 401], ['expiredToken', 401]]) {
      expect((await request.get(protectedUrl, { headers: { ...headers, Authorization: `Bearer ${session[key]}` } })).status()).toBe(status);
    }
    const pieces = session.accessToken.split('.');
    pieces[2] = (pieces[2][0] === 'A' ? 'B' : 'A') + pieces[2].slice(1);
    expect((await request.get(protectedUrl, { headers: { ...headers, Authorization: `Bearer ${pieces.join('.')}` } })).status()).toBe(401);
    expect((await request.get(protectedUrl, { headers: { ...headers, 'X-Tenant-Id': '55555555-5555-5555-5555-555555555555' } })).status()).toBe(403);
    expect((await api.get('/api/v1/participants/55555555-5555-5555-5555-555555555555/assessment-scientific-history')).status()).toBe(403);
    expect((await api.get('/api/v1/assessment-responses/OTHER-ADMINISTRATION')).status()).toBe(403);
    expect((await api.get('/api/v1/assessment-responses')).status()).toBe(404);
    expect(await (await request.get('/test/summary')).json()).toEqual(before);
    const values = [4, 3, 2, 1];
    for (let group = 1; group <= 12; group++) {
      for (const [index, dimension] of ['CE', 'RO', 'AC', 'AE'].entries()) {
        await page.getByRole('combobox', { name: `SYNTHETIC-KOLB-Q${group}-${dimension}`, exact: true }).selectOption(String(values[index]));
      }
    }
    await expect(page.getByRole('button', { name: words.submit, exact: true })).toBeDisabled();
    await page.getByRole('checkbox', { name: words.consent, exact: true }).check();
    await request.get('/test/consent?active=false');
    await page.getByRole('button', { name: words.submit, exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(words.denied);
    expect(await (await request.get('/test/summary')).json()).toEqual(before);
    await request.get('/test/consent?active=true');
    // A malformed client timestamp must be rejected by HTTP before persistence.
    await page.route('**/api/v1/assessment-submissions', async route => {
      const payload = route.request().postDataJSON(); payload.context.durationSeconds = '-1';
      await route.continue({ postData: JSON.stringify(payload) });
    });
    await page.getByRole('button', { name: words.submit, exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(words.timing);
    expect(await (await request.get('/test/summary')).json()).toEqual(before);
    await page.unroute('**/api/v1/assessment-submissions');
    // Repeated ranking is rejected by the real generic validator and scoring path.
    await page.route('**/api/v1/assessment-submissions', async route => {
      const payload = route.request().postDataJSON(); const ids = Object.keys(payload.responses[0].rankings);
      payload.responses[0].rankings[ids[1]] = payload.responses[0].rankings[ids[0]];
      await route.continue({ postData: JSON.stringify(payload) });
    });
    await page.getByRole('button', { name: words.submit, exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(words.invalid);
    expect(await (await request.get('/test/summary')).json()).toEqual(before);
    await page.unroute('**/api/v1/assessment-submissions');
    for (const field of ['participantId', 'researchParticipantUuid', 'consentId', 'consentVersion', 'assessmentVersion']) {
      await page.route('**/api/v1/assessment-submissions', async route => {
        const payload = route.request().postDataJSON();
        if (field === 'consentId' || field === 'consentVersion') payload.context[field] = 'FORGED';
        else payload[field] = field === 'researchParticipantUuid' ? '55555555-5555-5555-5555-555555555555' : 'FORGED';
        await route.continue({ postData: JSON.stringify(payload) });
      });
      await page.getByRole('button', { name: words.submit, exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText(words.denied);
      expect(await (await request.get('/test/summary')).json()).toEqual(before);
      await page.unroute('**/api/v1/assessment-submissions');
    }
    let sent;
    let accepted;
    await page.route('**/api/v1/assessment-submissions', async route => {
      sent = route.request().postDataJSON();
      sent.context.authorizedTenantId = 'FORGED';
      sent.context.authorizationGrantId = 'FORGED';
      sent.context.authorizationSource = 'CLIENT';
      const result = await route.fetch({ postData: JSON.stringify(sent) }); accepted = await result.json();
      if (locale === 'en') await route.abort('failed'); else await route.fulfill({ response: result });
    });
    await page.getByRole('button', { name: words.submit, exact: true }).click();
    if (locale === 'en') {
      await expect(page.getByRole('alert')).toHaveText(words.failed);
      await page.unroute('**/api/v1/assessment-submissions');
      await page.getByRole('button', { name: words.submit, exact: true }).click();
    }
    await expect(page.getByRole('status')).toHaveText(words.confirmed);
    await page.unroute('**/api/v1/assessment-submissions');
    expect(accepted.persistedAnswerCount).toBe(48);
    expect(accepted.scores).toMatchObject({ CE: 48, RO: 36, AC: 24, AE: 12 });
    expect((await api.post('/api/v1/assessment-submissions', { data: sent })).status()).toBe(409);
    const after = await (await request.get('/test/summary')).json();
    for (const key of ['responses', 'results', 'contexts']) expect(after[key]).toBe(before[key] + 1);
    const history = await (await api.get(`/api/v1/participants/${subject}/assessment-scientific-history`)).json();
    const observed = history.observations.find(item => item.administrationId === sent.administrationId);
    expect(observed.participantId).toBe(subject);
    expect(observed.assessmentVersion).toBe(sent.assessmentVersion);
    expect(observed.context.language).toBe(locale);
    expect(observed.context.completeContext.translationVersion).toBe('synthetic-labels-v1');
    expect(observed.context.consentId).toBe(session.consentId);
    expect(observed.context.completeContext.authorizedTenantId).toBe(session.tenantId);
    expect(observed.context.completeContext.authorizationGrantId).toBe(session.grantId);
    expect(observed.context.completeContext.authorizationSource).toBe('SERVER_ASSIGNMENT');
    expect(observed.context.durationSeconds).toBe(Number(sent.context.durationSeconds));
    const epoch = value => typeof value === 'number' ? value * 1000 : Date.parse(value);
    expect(Math.abs(epoch(observed.context.startedAt) - Date.parse(sent.context.startedAt))).toBeLessThan(2);
    expect(Math.abs(epoch(observed.submittedAt) - Date.parse(sent.submittedAt))).toBeLessThan(2);
    const raw = await (await api.get(`/api/v1/assessment-responses/${sent.administrationId}`)).json();
    expect(raw.answers).toHaveLength(48);
    for (const question of sent.responses) for (const [optionId, rank] of Object.entries(question.rankings)) {
      const answer = raw.answers.find(item => item.questionId === question.questionCode && item.optionId === optionId);
      expect(answer).toMatchObject({ value: String(rank), score: rank });
    }
    // Neither altered CSV nor altered dictionary can enable any download.
    for (const field of ['csv', 'dictionary']) {
      await page.route('**/test/snapshot/**', async route => {
        const result = await route.fetch(); const data = await result.json(); data[field] += 'CORRUPTED';
        await route.fulfill({ response: result, json: data });
      });
      await page.getByRole('button', { name: words.prepare, exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText(words.blocked);
      for (const label of [words.csv, words.manifest, words.dictionary]) await expect(page.getByRole('button', { name: label, exact: true })).toBeDisabled();
      await page.unroute('**/test/snapshot/**');
    }
    await page.getByRole('button', { name: words.prepare, exact: true }).click();
    await expect(page.getByRole('button', { name: words.csv, exact: true })).toBeEnabled();
    const downloaded = {};
    for (const [kind, label] of [['csv', words.csv], ['manifest', words.manifest], ['dictionary', words.dictionary]]) {
      const wait = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click();
      const download = await wait; const path = info.outputPath(download.suggestedFilename()); await download.saveAs(path);
      downloaded[kind] = await readFile(path);
    }
    const manifest = JSON.parse(downloaded.manifest.toString('utf8'));
    const dictionary = JSON.parse(downloaded.dictionary.toString('utf8'));
    expect(hash(downloaded.csv)).toBe(manifest.csvSha256);
    expect(hash(downloaded.dictionary)).toBe(manifest.dictionarySha256);
    expect(dictionary.timingSource).toBe('CLIENT_REPORTED');
    expect(dictionary.instrumentValidation).toBe('NOT_VALIDATED');
    expect(dictionary.variables.map(item => item.name)).toEqual(manifest.columns);
    const lines = downloaded.csv.toString('utf8').trimEnd().split('\n');
    expect(lines).toHaveLength(49);
    const parse = line => JSON.parse(`[${line}]`); // Fixture rows contain quoted JSON-safe scalars.
    for (const line of lines.slice(1)) {
      const row = Object.fromEntries(manifest.columns.map((column, index) => [column, parse(line)[index]]));
      const answer = raw.answers.find(item => item.id === row.answer_id);
      expect(row.research_subject_id).toBe(subject);
      expect(row.administration_id).toBe(sent.administrationId);
      expect(row.instrument_version).toBe(accepted.assessmentVersion);
      expect(row.scoring_algorithm_version).toBe(accepted.scoringAlgorithmVersion);
      expect(row.question_id).toBe(answer.questionId); expect(row.option_id).toBe(answer.optionId);
      expect(Number(row.rank)).toBe(answer.score);
      expect(Number(row.dimension_score)).toBe(accepted.scores[answer.dimension]);
    }
    expect(downloaded.csv.toString('utf8')).not.toContain('SYNTHETIC-STUDENT-001');
    const again = await (await api.get(`/test/snapshot/${sent.administrationId}`)).json();
    expect(again.csv).toBe(downloaded.csv.toString('utf8'));
    expect(await (await request.get('/test/summary')).json()).toEqual(after);
  });
}
