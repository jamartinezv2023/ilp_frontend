import type { AssessmentRendererMetadata } from '../types/assessmentRenderer';
export type OriginalInstrumentEvidence = {
  editionId: string; publisher: string; language: 'es' | 'en'; instrumentVersion: string;
  formSha256: string; manualSha256: string; scoringVersion: string; scoringManualSha256: string;
  authorizationReference: string; validationReference: string; validationPopulation: string;
  populationReviewReference: string; reviewReference: string;
  normApplicability: 'NOT_NORM_REFERENCED' | 'SOURCE_POPULATION_ONLY' | 'LOCAL_VALIDATED';
};
const digest = /^[a-f0-9]{64}$/i;
/** Structural publication evidence; it does not authenticate a publisher or establish psychometric validity. */
export function requireOriginalInstrumentEvidence(metadata: AssessmentRendererMetadata): void {
  if (!/(KOLB|FELDER|KUDER|^ILS$|FSLSM)/i.test(metadata.code)) return;
  const evidence = metadata.originalEvidence;
  if (!evidence || evidence.editionId !== metadata.sourceEdition || evidence.language !== metadata.language
    || evidence.instrumentVersion !== metadata.version
    || ![evidence.publisher, evidence.scoringVersion, evidence.authorizationReference, evidence.validationReference,
      evidence.validationPopulation, evidence.populationReviewReference, evidence.reviewReference].every(value => typeof value === 'string' && value.trim())
    || ![evidence.formSha256, evidence.manualSha256, evidence.scoringManualSha256].every(value => typeof value === 'string' && digest.test(value))
    || evidence.scoringManualSha256 !== evidence.manualSha256
    || !['NOT_NORM_REFERENCED', 'SOURCE_POPULATION_ONLY', 'LOCAL_VALIDATED'].includes(evidence.normApplicability)) {
    throw new Error('ORIGINAL_INSTRUMENT_EVIDENCE_REQUIRED');
  }
}
