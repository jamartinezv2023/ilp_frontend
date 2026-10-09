import { expect, it } from 'vitest';
import { requireOriginalInstrumentEvidence, type OriginalInstrumentEvidence } from '../../src/services/originalInstrumentEvidence';
import type { AssessmentRendererMetadata } from '../../src/types/assessmentRenderer';
const evidence: OriginalInstrumentEvidence = { editionId: 'synthetic-edition-only', publisher: 'Synthetic publisher',
  language: 'es', instrumentVersion: 'synthetic-v1', formSha256: 'a'.repeat(64), manualSha256: 'b'.repeat(64),
  scoringVersion: 'synthetic-scoring', scoringManualSha256: 'b'.repeat(64), authorizationReference: 'Synthetic permission record',
  validationReference: 'Synthetic study reference', validationPopulation: 'Synthetic population',
  populationReviewReference: 'Synthetic applicability review', reviewReference: 'Synthetic reviewer record', normApplicability: 'NOT_NORM_REFERENCED' };
function metadata(code = 'KOLB'): AssessmentRendererMetadata {
  return { code, name: 'Synthetic', author: 'Synthetic', version: 'synthetic-v1', sourceEdition: 'synthetic-edition-only',
    language: 'es', instrumentType: 'LEARNING_STYLE', estimatedMinutes: 1, objective: 'Test', copyrightNotice: 'Synthetic only', originalEvidence: { ...evidence } };
}
it.each(['KOLB', 'FELDER_SILVERMAN', 'KUDER', 'ILS', 'FSLSM'])('blocks %s without original edition evidence', code => {
  const value = metadata(code); delete value.originalEvidence;
  expect(() => requireOriginalInstrumentEvidence(value)).toThrow('ORIGINAL_INSTRUMENT_EVIDENCE_REQUIRED');
});
it('accepts only structural completeness without asserting local norms or publisher authenticity', () => {
  const value = metadata(); expect(() => requireOriginalInstrumentEvidence(value)).not.toThrow();
  expect(value.originalEvidence?.normApplicability).toBe('NOT_NORM_REFERENCED');
});
it.each(['editionId', 'language', 'instrumentVersion', 'publisher', 'formSha256', 'manualSha256', 'scoringManualSha256',
  'scoringVersion', 'authorizationReference', 'validationReference', 'validationPopulation', 'populationReviewReference', 'reviewReference', 'normApplicability'])('rejects missing or mismatched %s', field => {
  const value = metadata(); (value.originalEvidence as unknown as Record<string, unknown>)[field] = '';
  expect(() => requireOriginalInstrumentEvidence(value)).toThrow();
});
it('cannot mix a scoring manual from another edition', () => {
  const value = metadata(); value.originalEvidence!.scoringManualSha256 = 'c'.repeat(64);
  expect(() => requireOriginalInstrumentEvidence(value)).toThrow();
});
it('leaves explicitly synthetic instruments outside original-edition publication', () => {
  const value = metadata('SYNTHETIC'); delete value.originalEvidence;
  expect(() => requireOriginalInstrumentEvidence(value)).not.toThrow();
});
