export type RankedQuestion = { code: string; options: { id: string; dimension: string }[] };
export type ScientificSession = {
  administrationId: string;
  participantId: string;
  researchParticipantUuid: string;
  assessmentCode: string;
  assessmentVersion: string;
  researchSubjectId: string;
  translationVersion: string;
  consentId: string;
  consentVersion: string;
  questions: RankedQuestion[];
};
export const buildScientificSubmission = (
  session: ScientificSession,
  ranks: Record<string, number>,
  language: "es" | "en",
  startedAt: Date,
  submittedAt: Date,
) => {
  const elapsed = submittedAt.getTime() - startedAt.getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) throw new Error("ASSESSMENT_TIMING_INVALID");
  const responses = session.questions.map(question => {
    const values = question.options.map(option => ranks[option.id]);
    if (values.length !== 4 || ![1, 2, 3, 4].every(rank => values.includes(rank))) {
      throw new Error("ASSESSMENT_SUBMISSION_INVALID");
    }
    return { questionCode: question.code, selectedOptionIds: [],
      rankings: Object.fromEntries(question.options.map(option => [option.id, ranks[option.id]])),
      numericValue: null, textValue: null };
  });
  return {
    administrationId: session.administrationId, participantId: session.participantId,
    researchParticipantUuid: session.researchParticipantUuid,
    assessmentCode: session.assessmentCode, assessmentVersion: session.assessmentVersion,
    responses, submittedAt: submittedAt.toISOString(),
    context: { source: "SYNTHETIC_SCIENTIFIC_APPLICATION", fieldworkPhase: "TEST_ONLY",
      language, translationVersion: session.translationVersion,
      consentId: session.consentId, consentVersion: session.consentVersion,
      startedAt: startedAt.toISOString(), durationSeconds: String(Math.floor(elapsed / 1000)),
      timingSource: "CLIENT_REPORTED", applicationVersion: "scientific-lab-v1" },
  };
};
