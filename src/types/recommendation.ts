import type { LocalizedContentSource } from "../i18n/useApiText";
export type StudentRecommendation = LocalizedContentSource & {
  studentId: string;
  fullName: string;
  learningProfile: string;
  vocationalInterest: string;
  supportLevel: string;
  teacherRecommendations: string[];
  inclusionRecommendations: string[];
  familyRecommendations: string[];
  nextActions: string[];
};

