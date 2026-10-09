import type { LocalizedContentSource } from "../i18n/useApiText";
export type AdaptiveLearningPlan = LocalizedContentSource & {
  planId: string | null;
  studentId: string;
  fullName: string;
  learningProfile: string;
  learningPreferences: string[];
  vocationalInterest: string;
  supportLevel: string;
  riskLevel: string;
  recommendedMethodology: string;
  recommendedResources: string[];
  adaptivePathway: string[];
  teacherActions: string[];
  inclusionActions: string[];
  familyActions: string[];
  createdAt: string | null;
};

