export type AssessmentInstrumentType =
  | "LEARNING_STYLE"
  | "VOCATIONAL_INTEREST"
  | "PERSONALITY"
  | "COGNITIVE"
  | "SOCIOEMOTIONAL"
  | "ACADEMIC"
  | "INSTITUTIONAL"
  | "RESEARCH"
  | "CUSTOM"
  | string;

export type AssessmentRendererMetadata = {
  code: string;
  name: string;
  author: string;
  version: string;
  instrumentType: AssessmentInstrumentType;
  language: string;
  estimatedMinutes: number;
  objective: string;
  copyrightNotice: string;
};

export type AssessmentRendererOption = {
  id: string;
  code: string;
  text: string;
  dimension: string;
  numericValue: number | null;
  weight: number | null;
  orderIndex: number;
};

export type AssessmentRendererQuestion = {
  id: string;
  code: string;
  text: string;
  dimension: string;
  questionType: string;
  required: boolean;
  orderIndex: number;
  options: AssessmentRendererOption[];
};

export type AssessmentRendererModel = {
  code: string;
  version: string;
  title: string;
  description: string;
  instructions: string;
  metadata: AssessmentRendererMetadata;
  questions: AssessmentRendererQuestion[];
};

export type AssessmentRendererError = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
};