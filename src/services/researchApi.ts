import axios from "axios";
import type { ApiRecord, ResearchSignal } from "../types/research";

const API_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL ?? "http://localhost:8083";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

const stringifyValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value ?? "No disponible");
};

const normalizeSignal = (
  title: string,
  endpoint: string,
  data: ApiRecord
): ResearchSignal => {
  const entries = Object.entries(data);

  const statusEntry =
    entries.find(([key]) => key.toLowerCase().includes("status")) ??
    entries.find(([key]) => key.toLowerCase().includes("level")) ??
    entries.find(([key]) => key.toLowerCase().includes("readiness"));

  const evidenceEntry =
    entries.find(([key]) => key.toLowerCase().includes("evidence")) ??
    entries.find(([key]) => key.toLowerCase().includes("principles")) ??
    entries.find(([key]) => key.toLowerCase().includes("criteria"));

  return {
    title,
    endpoint,
    status: statusEntry ? stringifyValue(statusEntry[1]) : "VALIDATED",
    summary:
      entries
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${stringifyValue(value)}`)
        .join(" · ") || "Backend endpoint disponible.",
    evidence: Array.isArray(evidenceEntry?.[1])
      ? evidenceEntry?.[1].map(String)
      : entries.slice(0, 5).map(([key, value]) => `${key}: ${stringifyValue(value)}`),
  };
};

export const fetchResearchSignals = async (): Promise<ResearchSignal[]> => {
  const endpoints = [
    {
      title: "Gobernanza de IA educativa",
      endpoint: "/analytics/governance/policy-preview",
    },
    {
      title: "Confiabilidad institucional",
      endpoint: "/analytics/trustworthiness/assessment-preview",
    },
    {
      title: "Equidad y sesgo",
      endpoint: "/analytics/fairness/bias-assessment-preview",
    },
    {
      title: "Gobernanza arquitectónica",
      endpoint: "/analytics/architecture/governance-preview",
    },
    {
      title: "Preparación Kubernetes",
      endpoint: "/analytics/deployment/kubernetes-readiness-preview",
    },
    {
      title: "Ética de investigación",
      endpoint: "/analytics/research/ethics-readiness-preview",
    },
  ];

  const responses = await Promise.all(
    endpoints.map(async (item) => {
      const response = await client.get<ApiRecord>(item.endpoint);
      return normalizeSignal(item.title, item.endpoint, response.data);
    })
  );

  return responses;
};

