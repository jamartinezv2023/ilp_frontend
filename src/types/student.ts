export type StudentProfile = {
  id: string;
  fullName: string;
  grade: string;
  age: number | null;
  learningProfile: string;
  vocationalInterest: string;
  supportLevel: "LOW" | "MEDIUM" | "HIGH" | "UNSPECIFIED" | string;
  inclusiveStrategies: string[];
  pedagogicalRecommendations: string[];
};
