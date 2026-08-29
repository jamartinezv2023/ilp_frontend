import axios from "axios";
import type { AssessmentRendererModel } from "../types/assessmentRenderer";
import { normalizeUtf8Text } from "../utils/utf8Text";

const API_BASE_URL =
  import.meta.env.VITE_ADAPTIVE_API_BASE_URL ??
  "https://ilp-adaptive-education-service.onrender.com";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
  },
});

export const fetchAssessmentRenderer = async (
  assessmentCode: string
): Promise<AssessmentRendererModel> => {
  const normalizedCode = assessmentCode.trim();

  if (!normalizedCode) {
    throw new Error("El código del instrumento es obligatorio.");
  }

  const response = await client.get<AssessmentRendererModel>(
    `/api/v1/assessment-renderer/${encodeURIComponent(normalizedCode)}`
  );

  return normalizeUtf8Text(response.data);
};

export const fetchActiveAssessmentRenderers = async (): Promise<
  AssessmentRendererModel[]
> => {
  const response = await client.get<AssessmentRendererModel[]>(
    "/api/v1/assessment-renderer"
  );

  return normalizeUtf8Text(response.data);
};
