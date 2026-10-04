import { describe, it, expect } from 'vitest';
import { buildScientificSubmission, type ScientificSession } from '../../src/features/assessment-engine/services/scientificApplication';
const session: ScientificSession = { administrationId: 'admin', participantId: 'participant', researchParticipantUuid: 'uuid',
  assessmentCode: 'SYNTHETIC', assessmentVersion: 'TEST', researchSubjectId: 'subject', translationVersion: 'TEST_ES',
  consentId: 'consent', consentVersion: 'TEST_ONLY', questions: [{ code: 'q1', options: ['a','b','c','d'].map(id => ({ id, dimension: id })) }] };
const start = new Date('2026-10-04T00:00:00Z');
describe('scientific payload', () => {
  it.each(['es', 'en'] as const)('preserves identity, consent, ordered ranks and client timing in %s', language => {
    const payload = buildScientificSubmission(session, { a:4,b:3,c:2,d:1 }, language, start, new Date(start.getTime()+1999));
    expect(payload).toMatchObject({ administrationId: 'admin', researchParticipantUuid: 'uuid', assessmentVersion: 'TEST',
      responses: [{ questionCode: 'q1', rankings: { a:4,b:3,c:2,d:1 }, selectedOptionIds: [], numericValue: null, textValue: null }],
      context: { language, consentId:'consent', consentVersion:'TEST_ONLY', timingSource:'CLIENT_REPORTED', durationSeconds:'1', fieldworkPhase:'TEST_ONLY' } });
  });
  it.each([{ a:1,b:1,c:2,d:3 }, { a:4,b:3,c:2 }, { a:4,b:3,c:2,d:0 }])('rejects invalid rankings', ranks => {
    expect(() => buildScientificSubmission(session, ranks as Record<string,number>, 'es', start, start)).toThrow('ASSESSMENT_SUBMISSION_INVALID');
  });
  it('rejects wrong option count and invalid or negative elapsed time', () => {
    expect(() => buildScientificSubmission({ ...session, questions:[{ code:'q', options:[] }] }, {}, 'es', start, start)).toThrow('ASSESSMENT_SUBMISSION_INVALID');
    for (const finish of [new Date(NaN), new Date(start.getTime()-1)]) {
      expect(() => buildScientificSubmission(session, {}, 'es', start, finish)).toThrow('ASSESSMENT_TIMING_INVALID');
    }
  });
});
