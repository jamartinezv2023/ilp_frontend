export type StudentRecommendation = {
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
