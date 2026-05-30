export type ResearchCategory =
  | "all"
  | "governance"
  | "trustworthiness"
  | "ethics"
  | "architecture"
  | "deployment"
  | "research";

export type ResearchSignal = {
  title: string;
  endpoint: string;
  status: string;
  summary: string;
  evidence: string[];
  category: Exclude<ResearchCategory, "all">;
};

export type ApiRecord = Record<string, unknown>;
