import axios from "axios";
import { fetchAssessmentDefinition } from "../../../services/assessmentDefinitionApi";
import type { AssessmentDefinition } from "../../../types/assessmentDefinition";
import { adaptAssessmentRendererToDefinition } from "./adaptAssessmentRendererToDefinition";
import { loadAssessmentRenderer } from "./loadAssessmentRenderer";

export type AssessmentDefinitionSource =
  | "GENERIC_RENDERER"
  | "LEGACY_FALLBACK";

export type CompatibleAssessmentDefinition = {
  definition: AssessmentDefinition;
  source: AssessmentDefinitionSource;
};

const shouldUseLegacyFallback = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return [404, 405, 501, 502, 503, 504].includes(
    error.response.status
  );
};

export const loadCompatibleAssessmentDefinition = async (
  assessmentCode: string
): Promise<CompatibleAssessmentDefinition> => {
  try {
    const renderer = await loadAssessmentRenderer(assessmentCode);

    return {
      definition: adaptAssessmentRendererToDefinition(renderer),
      source: "GENERIC_RENDERER",
    };
  } catch (error) {
    if (!shouldUseLegacyFallback(error)) {
      throw error;
    }

    const legacyDefinition =
      await fetchAssessmentDefinition(assessmentCode);

    return {
      definition: legacyDefinition,
      source: "LEGACY_FALLBACK",
    };
  }
};