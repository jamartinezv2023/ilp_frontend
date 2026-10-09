import { requireOriginalInstrumentEvidence } from './originalInstrumentEvidence';
import { fetchAssessmentRenderer } from "./assessmentRendererApi";
import type { AssessmentRendererModel } from "../types/assessmentRenderer";
export class InstrumentLocaleUnavailableError extends Error {
  constructor() { super("INSTRUMENT_LOCALE_UNAVAILABLE"); }
}
export const requireCompleteInstrument = (model: AssessmentRendererModel, code: string, language: "es" | "en") => {
  const metadata = model?.metadata;
  if (!metadata || model.code !== code || metadata.code !== code ||
      metadata.language !== language || !metadata.version?.trim() ||
      metadata.version !== model.version || metadata.contentComplete !== true ||
      metadata.publicationStatus !== "APPROVED" || !metadata.sourceEdition?.trim() ||
      !Number.isSafeInteger(metadata.expectedQuestionCount) ||
      (metadata.expectedQuestionCount ?? 0) < 1 ||
      !Array.isArray(model.questions) || model.questions.length !== metadata.expectedQuestionCount ||
      !model.title?.trim() || !model.instructions?.trim() ||
      !model.questions.every(question => question.text?.trim() && Array.isArray(question.options) && question.options.length > 0 &&
        question.options.every(option => option.text?.trim()))) {
    throw new InstrumentLocaleUnavailableError();
  }
  requireOriginalInstrumentEvidence(metadata);
  return model;
};
export const loadLocalizedInstrument = async (code: string, language: "es" | "en") =>
  requireCompleteInstrument(await fetchAssessmentRenderer(code, language), code, language);
