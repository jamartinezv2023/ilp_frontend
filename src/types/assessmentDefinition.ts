export type AssessmentOption = {
  id: string;
  label: string;
  value: string;
  weight: number;
  displayOrder: number;
};

export type AssessmentQuestion = {
  id: string;
  questionNumber: number;
  text: string;
  dimension: string;
  helpText: string;
  required: boolean;
  questionType: string;
  displayOrder: number;
  options: AssessmentOption[];
};

export type AssessmentDefinition = {
  id: string;
  code: string;
  name: string;
  description: string;
  assessmentType: string;
  version: string;
  active: boolean;
  estimatedMinutes: number;
  instructions: string;
  createdAt: string;
  questions: AssessmentQuestion[];
};
