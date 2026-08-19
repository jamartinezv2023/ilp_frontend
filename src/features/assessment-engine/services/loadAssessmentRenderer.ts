import { fetchAssessmentRenderer } from "../../../services/assessmentRendererApi";
import type { AssessmentRendererModel } from "../../../types/assessmentRenderer";
import { normalizeAssessmentRenderer } from "./normalizeAssessmentRenderer";

export const loadAssessmentRenderer = async (
  assessmentCode: string
): Promise<AssessmentRendererModel> => {
  const renderer = await fetchAssessmentRenderer(assessmentCode);
  return normalizeAssessmentRenderer(renderer);
};