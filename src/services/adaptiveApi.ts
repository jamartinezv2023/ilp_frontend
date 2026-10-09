import axios from "axios";
import type { AdaptiveLearningPlan } from "../types/adaptive";

import { ADAPTIVE_API_BASE_URL } from "../config/apiConfig";

const client = axios.create({
  baseURL: ADAPTIVE_API_BASE_URL,
  timeout: 8000,
});

/** GET returns an unsaved preview; it never records a plan. */
export const generateAdaptivePlan = async (
  studentId: string
): Promise<AdaptiveLearningPlan> => {
  const response = await client.get<AdaptiveLearningPlan>(
    `/api/v1/adaptive/students/${studentId}`
  );

  return parseAdaptivePlan(response.data);
};

export const fetchAdaptivePlanHistory = async (
  studentId: string
): Promise<AdaptiveLearningPlan[]> => {
  const response = await client.get<AdaptiveLearningPlan[]>(
    `/api/v1/adaptive/students/${studentId}/history`
  );

  if (!Array.isArray(response.data)) throw new Error("Invalid adaptive history");
  return response.data.map(parseAdaptivePlan);
};


const planStringFields = ["studentId", "fullName", "learningProfile", "vocationalInterest",
  "supportLevel", "riskLevel", "recommendedMethodology"] as const;
const planListFields = ["learningPreferences", "recommendedResources", "adaptivePathway",
  "teacherActions", "inclusionActions", "familyActions"] as const;
export const parseAdaptivePlan = (value: unknown): AdaptiveLearningPlan => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid adaptive plan");
  }
  const record = value as Record<string, unknown>;
  const stringsValid = planStringFields.every(key => typeof record[key] === "string" && record[key].trim().length > 0);
  const listsValid = planListFields.every(key => Array.isArray(record[key]) && record[key].every(item => typeof item === "string" && item.trim().length > 0));
  const identityValid = ["planId", "createdAt"].every(key => record[key] === null || (typeof record[key] === "string" && record[key].trim().length > 0));
  if (!stringsValid || !listsValid || !identityValid) throw new Error("Invalid adaptive plan");
  return value as AdaptiveLearningPlan;
};
