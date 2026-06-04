import axios from "axios";
import type {
  FelderSilvermanAssessmentResponse,
  KolbAssessmentResponse,
  KuderAssessmentResponse,
} from "../types/assessment";

const API_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL ?? "http://localhost:8083";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

export const submitKolbAssessment = async (
  studentId: string
): Promise<KolbAssessmentResponse> => {
  const answers = Array.from({ length: 12 }).flatMap(() => [4, 4, 1, 1]);

  const response = await client.post<KolbAssessmentResponse>(
    "/api/v1/assessments/kolb",
    { studentId, answers }
  );

  return response.data;
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
