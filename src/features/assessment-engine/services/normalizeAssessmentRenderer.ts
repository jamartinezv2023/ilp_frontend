import type {
  AssessmentRendererModel,
  AssessmentRendererOption,
  AssessmentRendererQuestion,
} from "../../../types/assessmentRenderer";

const byOrder = (
  left: { orderIndex: number },
  right: { orderIndex: number }
): number => left.orderIndex - right.orderIndex;

const normalizeOption = (
  option: AssessmentRendererOption
): AssessmentRendererOption => ({
  ...option,
  id: String(option.id),
  code: String(option.code),
  text: option.text ?? "",
  dimension: option.dimension ?? "GENERAL",
  numericValue: option.numericValue ?? null,
  weight: option.weight ?? null,
  orderIndex: Number(option.orderIndex),
});

const normalizeQuestion = (
  question: AssessmentRendererQuestion
): AssessmentRendererQuestion => ({
  ...question,
  id: String(question.id),
  code: String(question.code),
  text: question.text ?? "",
  dimension: question.dimension ?? "GENERAL",
  questionType: String(question.questionType).toUpperCase(),
  required: Boolean(question.required),
  orderIndex: Number(question.orderIndex),
  options: [...(question.options ?? [])]
    .map(normalizeOption)
    .sort(byOrder),
});

export const normalizeAssessmentRenderer = (
  renderer: AssessmentRendererModel
): AssessmentRendererModel => ({
  ...renderer,
  code: String(renderer.code),
  version: String(renderer.version),
  title: renderer.title ?? renderer.metadata?.name ?? renderer.code,
  description: renderer.description ?? "",
  instructions: renderer.instructions ?? "",
  questions: [...(renderer.questions ?? [])]
    .map(normalizeQuestion)
    .sort(byOrder),
});