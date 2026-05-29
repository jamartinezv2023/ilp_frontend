export type ResearchSignal = {
  title: string;
  endpoint: string;
  status: string;
  summary: string;
  evidence: string[];
};

export type ApiRecord = Record<string, unknown>;
