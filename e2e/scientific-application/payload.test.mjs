import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../../src/features/assessment-engine/services/scientificApplication.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { buildScientificSubmission } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const session = { administrationId: 'SYNTHETIC-ADMIN-001', participantId: 'SYNTHETIC-STUDENT-001', researchParticipantUuid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', researchSubjectId: '11111111-1111-1111-1111-111111111111', assessmentCode: 'KOLB_V1', assessmentVersion: '0.0.1-test', translationVersion: 'synthetic-labels-v1', consentId: 'SYNTHETIC-CONSENT-001', consentVersion: 'test-consent-v1', questions: Array.from({ length: 12 }, (_, index) => ({ code: `Q${index + 1}`, options: ['CE', 'RO', 'AC', 'AE'].map(dimension => ({ id: `Q${index + 1}-${dimension}`, dimension })) })) };
const ranks = Object.fromEntries(session.questions.flatMap(question => question.options.map((option, index) => [option.id, 4 - index])));
test('captures stable identity and 48 ranks with explicit client timing provenance', () => {
  for (const language of ['es', 'en']) {
    const result = buildScientificSubmission(session, ranks, language, new Date('2026-10-02T10:00:00.500Z'), new Date('2026-10-02T10:00:10.400Z'));
    assert.equal(result.administrationId, session.administrationId);
    assert.equal(result.context.durationSeconds, '9'); assert.equal(result.context.language, language);
    assert.equal(result.context.timingSource, 'CLIENT_REPORTED');
    assert.equal(result.context.translationVersion, 'synthetic-labels-v1');
    assert.equal(result.responses.length, 12);
    assert.equal(result.responses.flatMap(item => Object.keys(item.rankings)).length, 48);
  }
});
test('blocks incomplete/repeated ranks and reversed or invalid clock measurements', () => {
  const start = new Date('2026-10-02T10:00:00Z');
  for (const bad of [{}, { ...ranks, 'Q1-CE': 3 }, { ...ranks, 'Q1-CE': 1.5 }]) assert.throws(() => buildScientificSubmission(session, bad, 'es', start, start), /ASSESSMENT_SUBMISSION_INVALID/);
  for (const end of [new Date('invalid'), new Date('2026-10-02T09:59:59Z')]) assert.throws(() => buildScientificSubmission(session, ranks, 'en', start, end), /ASSESSMENT_TIMING_INVALID/);
});
