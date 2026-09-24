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

// Pilot safeguard: these instruments require recorded participant responses.
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
    Array.from({ length: 12 }, (_, index) => answers.slice(index * 4, index * 4 + 4))
      .some((group) => [...group].sort().join(",") !== "1,2,3,4")
  ) {
    throw new Error("Kolb requires twelve complete groups of four distinct ranks.");
  }

  // POST once. If the subsequent GET fails, retain the returned ID: retrying
  // the POST could create a duplicate assessment.
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
        item.createdAt === result.createdAt
    );
    return { result, history, confirmed };
  } catch {
    return { result, history: [], confirmed: false };
  }
};

export const submitKolbAssessment = async (
  _studentId: string
): Promise<KolbAssessmentResponse> => {
  void _studentId;
  throw new Error("Kolb requires participant answers. Use submitKolbAssessmentWithAnswers.");
};

export const submitFelderSilvermanAssessment = async (
  _studentId: string
): Promise<FelderSilvermanAssessmentResponse> => {
  void _studentId;
  throw new Error("Felder-Silverman requires a real response form.");
};

export const submitKuderAssessment = async (
  _studentId: string
): Promise<KuderAssessmentResponse> => {
  void _studentId;
  throw new Error("Kuder requires a real response form.");
};
