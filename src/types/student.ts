export type StudentProfile = {
  id: string;
  fullName: string;
  grade: string;
  age: number;
  learningProfile: string;
  vocationalInterest: string;
  supportLevel: "LOW" | "MEDIUM" | "HIGH" | string;
  inclusiveStrategies: string[];
  pedagogicalRecommendations: string[];
};
