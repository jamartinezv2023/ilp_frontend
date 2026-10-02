import axios from "axios";
import type {
  FelderSilvermanAssessmentResponse,
  InstrumentQuestion,
  KolbAssessmentResponse,
  KuderAssessmentResponse,
} from "../types/assessment";
import type { AssessmentDefinition } from "../types/assessmentDefinition";
import { repairUtf8Mojibake } from "../utils/utf8Text";

const API_BASE_URL =
  import.meta.env.VITE_ADAPTIVE_API_BASE_URL ?? "https://ilp-adaptive-education-service.onrender.com";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

const normalizeKolbHistory = (
  payload: KolbAssessmentResponse[] | KolbAssessmentResponse | null
): KolbAssessmentResponse[] => {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : [payload];
};

export const fetchKolbQuestions = async (): Promise<InstrumentQuestion[]> => {
  const response = await client.get<AssessmentDefinition>(
    "/api/v1/assessment-definitions/KOLB_V1"
  );

  const questions = Array.isArray(response.data.questions)
    ? response.data.questions
    : [];

  return questions.map((question) => ({
    id: String(question.id),
    questionOrder: Number(question.questionNumber ?? question.displayOrder ?? 0),
    text: repairUtf8Mojibake(String(question.text ?? "")),
    dimension: repairUtf8Mojibake(
      String(question.dimension ?? "CE_RO_AC_AE")
    ),
    instrument: "KOLB",
    instrumentVersion: "KOLB_V1",
    options: Array.isArray(question.options)
      ? [...question.options]
          .sort(
            (a, b) =>
              Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0)
          )
          .map((option) =>
            repairUtf8Mojibake(String(option.label ?? option.value ?? ""))
          )
          .filter(Boolean)
      : [],
  }));
};

export const submitKolbAssessmentWithAnswers = async (
  studentId: string,
  answers: number[]
): Promise<KolbAssessmentResponse> => {
  const response = await client.post<KolbAssessmentResponse>(
    "/api/v1/assessments/kolb",
    { studentId, answers }
  );

  return response.data;
};

export const fetchKolbAssessmentHistory = async (
  studentId: string
): Promise<KolbAssessmentResponse[]> => {
  const response = await client.get<
    KolbAssessmentResponse[] | KolbAssessmentResponse | null
  >(`/api/v1/assessments/kolb/students/${studentId}`);

  return normalizeKolbHistory(response.data);
};

export const submitKolbAssessment = async (
  studentId: string
): Promise<KolbAssessmentResponse> => {
  const answers = Array.from({ length: 12 }).flatMap(() => [4, 3, 2, 1]);
  return submitKolbAssessmentWithAnswers(studentId, answers);
};

export const submitFelderSilvermanAssessment = async (
  studentId: string
): Promise<FelderSilvermanAssessmentResponse> => {
  const answers = Array.from({ length: 44 }).map(() => "A");

  const response = await client.post<FelderSilvermanAssessmentResponse>(
    "/api/v1/assessments/felder-silverman",
    { studentId, answers }
  );

  return response.data;
};

export const submitKuderAssessment = async (
  studentId: string
): Promise<KuderAssessmentResponse> => {
  const answers = [
    ...Array.from({ length: 15 }).map(() => "SCIENTIFIC"),
    ...Array.from({ length: 5 }).map(() => "SOCIAL"),
    ...Array.from({ length: 5 }).map(() => "ARTISTIC"),
    ...Array.from({ length: 3 }).map(() => "ADMINISTRATIVE"),
    ...Array.from({ length: 2 }).map(() => "MECHANICAL"),
  ];

  const response = await client.post<KuderAssessmentResponse>(
    "/api/v1/assessments/kuder",
    { studentId, answers }
  );

  return response.data;
};

export const kolbTimestampMatches = (
  left: unknown,
  right: unknown
): boolean =>
  left === right ||
  (
    typeof left === "number" &&
    typeof right === "number" &&
    Number.isFinite(left) &&
    Number.isFinite(right) &&
    Math.abs(left - right) <= 0.000001
  );
export type ConfirmedKolbSubmission = {
  result: KolbAssessmentResponse;
  history: KolbAssessmentResponse[];
  confirmed: boolean;
};
export const submitKolbAssessmentWithConfirmation = async (
  studentId: string,
  answers: number[]
): Promise<ConfirmedKolbSubmission> => {
  if (
    answers.length !== 48 ||
    Array.from({ length: 12 }, (_, index) =>
      answers.slice(index * 4, index * 4 + 4)
    ).some((group) => [...group].sort().join(",") !== "1,2,3,4")
  ) {
    throw new Error("Kolb requiere doce grupos completos con cuatro rangos distintos.");
  }
  // Enviar una sola vez; repetir POST tras un GET fallido puede duplicar registros.
  const result = await submitKolbAssessmentWithAnswers(studentId, answers);
  if (
    !result.assessmentId ||
    result.studentId !== studentId ||
    !result.instrumentVersion ||
    !result.createdAt
  ) {
    return { result, history: [], confirmed: false };
  }
  try {
    const history = await fetchKolbAssessmentHistory(studentId);
    const confirmed = history.some(
      (item) =>
        item.assessmentId === result.assessmentId &&
        item.studentId === studentId &&
        item.instrumentVersion === result.instrumentVersion &&
        kolbTimestampMatches(item.createdAt, result.createdAt)
    );
    return { result, history, confirmed };
  } catch {
    return { result, history: [], confirmed: false };
  }
};

export const isAssessmentSubmissionInvalid = (error: unknown): boolean =>
  axios.isAxiosError(error) &&
  error.response?.status === 422 &&
  error.response?.data?.code === "ASSESSMENT_SUBMISSION_INVALID";
