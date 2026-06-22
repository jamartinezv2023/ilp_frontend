import axios from "axios";
import type { AssessmentDefinition } from "../types/assessmentDefinition";

const API_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL || "";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const fetchAssessmentDefinition = async (
  code: string
): Promise<AssessmentDefinition> => {
  const response = await client.get<AssessmentDefinition>(
    `/api/v1/assessment-definitions/${code}`
  );

  return response.data;
};
