import axios from "axios";
import type { AdaptiveLearningPlan } from "../types/adaptive";

const API_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL || "";

const client = axios.create({
  baseURL: API_BASE_URL,
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
