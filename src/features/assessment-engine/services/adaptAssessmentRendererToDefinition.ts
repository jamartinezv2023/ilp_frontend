import type {
  AssessmentRendererModel,
  AssessmentRendererOption,
  AssessmentRendererQuestion,
} from "../../../types/assessmentRenderer";
import type {
  AssessmentDefinition,
  AssessmentOption,
  AssessmentQuestion,
} from "../../../types/assessmentDefinition";

const FALLBACK_CREATED_AT = "1970-01-01T00:00:00.000Z";

const toLegacyOption = (
  option: AssessmentRendererOption
): AssessmentOption => ({
  id: String(option.id),
  label: option.text,
  value: option.code,
  weight: option.weight ?? option.numericValue ?? 0,
  displayOrder: option.orderIndex,
});

const toLegacyQuestion = (
  question: AssessmentRendererQuestion
): AssessmentQuestion => ({
  id: String(question.id),
  questionNumber: question.orderIndex,
  text: question.text,
  dimension: question.dimension,
  helpText: "",
  required: question.required,
  questionType: question.questionType,
  displayOrder: question.orderIndex,
  options: question.options.map(toLegacyOption),
});

export const adaptAssessmentRendererToDefinition = (
  renderer: AssessmentRendererModel
): AssessmentDefinition => {
  if (!renderer.code.trim()) {
    throw new Error("La API de renderizado no devolvió el código del instrumento.");
  }

  if (!renderer.questions.length) {
    throw new Error(
      `El instrumento ${renderer.code} no contiene preguntas renderizables.`
    );
  }

  return {
    id: `RENDERER-${renderer.code}-${renderer.version}`,
    code: renderer.code,
    name: renderer.title,
    description: renderer.description,
    assessmentType: renderer.metadata.instrumentType,
    version: renderer.version,
    active: true,
    estimatedMinutes: renderer.metadata.estimatedMinutes,
    instructions: renderer.instructions,
    createdAt: FALLBACK_CREATED_AT,
    questions: renderer.questions.map(toLegacyQuestion),
  };
};