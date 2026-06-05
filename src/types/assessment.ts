export type InstrumentQuestion = {
  id: string;
  instrument: string;
  dimension: string;
  questionOrder: number;
  text: string;
  options: string[];
  instrumentVersion: string;
};

export type KolbAssessmentResponse = {
  assessmentId: string;
  studentId: string;
  scoreCE: number;
  scoreRO: number;
  scoreAC: number;
  scoreAE: number;
  learningStyle: string;
  instrumentVersion: string;
  createdAt: string;
};

export type FelderSilvermanAssessmentResponse = {
  assessmentId: string;
  studentId: string;
  activeReflectiveScore: number;
  sensingIntuitiveScore: number;
  visualVerbalScore: number;
  sequentialGlobalScore: number;
  dominantProfile: string;
  learningPreferences: string[];
  instrumentVersion: string;
  createdAt: string;
};

export type KuderAssessmentResponse = {
  assessmentId: string;
  studentId: string;
  dominantVocationalArea: string;
  topVocationalAreas: string[];
  scientificScore: number;
  artisticScore: number;
  socialScore: number;
  mechanicalScore: number;
  administrativeScore: number;
  instrumentVersion: string;
  createdAt: string;
};
