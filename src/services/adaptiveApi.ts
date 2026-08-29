import axios from "axios";
import type { AdaptiveLearningPlan } from "../types/adaptive";

import { ADAPTIVE_API_BASE_URL } from "../config/apiConfig";

const client = axios.create({
  baseURL: ADAPTIVE_API_BASE_URL,
  timeout: 8000,
});

export const generateAdaptivePlan = async (
  studentId: string
): Promise<AdaptiveLearningPlan> => {
  const response = await client.get<AdaptiveLearningPlan>(
    `/api/v1/adaptive/students/${studentId}`
  );

  return response.data;
};

export const fetchAdaptivePlanHistory = async (
  studentId: string
): Promise<AdaptiveLearningPlan[]> => {
  const response = await client.get<AdaptiveLearningPlan[]>(
    `/api/v1/adaptive/students/${studentId}/history`
  );

  return response.data;
};

