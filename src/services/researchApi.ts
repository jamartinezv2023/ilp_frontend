import axios from "axios";
import type { ApiRecord, ResearchSignal } from "../types/research";

const API_BASE_URL =
  import.meta.env.VITE_ADAPTIVE_API_BASE_URL || "";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

const labelMap: Record<string, string> = {
  governanceLevel: "Nivel de gobernanza",
  ethicalPolicy: "Política ética",
  traceabilityStatus: "Trazabilidad",
  decisionAuditability: "Auditoría de decisiones",
  humanOversight: "Supervisión humana",
  institutionalRiskLevel: "Riesgo institucional",

  trustworthinessLevel: "Nivel de confiabilidad",
  explainabilityCompliance: "Cumplimiento de explicabilidad",
  ethicalGovernanceStatus: "Gobernanza ética",
  humanOversightRequirement: "Supervisión humana",
  riskContainmentLevel: "Contención de riesgos",
  institutionalReliability: "Confiabilidad institucional",

  fairnessStatus: "Estado de equidad",
  biasRiskLevel: "Riesgo de sesgo",
  protectedEducationalPrinciples: "Principios educativos protegidos",
  mitigationStrategy: "Estrategia de mitigación",
  humanReviewRequirement: "Revisión humana",
  ethicalFairnessPolicy: "Política de equidad",

  architectureGovernanceLevel: "Gobernanza arquitectónica",
  architecturalStyle: "Estilo arquitectónico",
  boundedContextStrategy: "Estrategia de contextos",
  layerSeparationStatus: "Separación de capas",
  architectureEnforcementStatus: "Control arquitectónico",
  enterpriseReadiness: "Preparación empresarial",

  kubernetesReadinessStatus: "Preparación Kubernetes",
  deploymentManifestStatus: "Manifiesto de despliegue",
  serviceExposureStatus: "Exposición del servicio",
  livenessProbeStatus: "Prueba de vida",
  readinessProbeStatus: "Prueba de disponibilidad",

  ethicsReadiness: "Preparación ética",
  consentManagement: "Consentimiento informado",
  dataProtectionStatus: "Protección de datos",
  participantRiskLevel: "Riesgo de participantes",
  sensitiveDataHandling: "Manejo de datos sensibles",
  ethicsCommitteeSubmission: "Comité de ética",

  expertValidationStatus: "Validación por expertos",
  pedagogicalExpertiseRequired: "Experticia pedagógica",
  inclusionExpertiseRequired: "Experticia en inclusión",
  aiEthicsExpertiseRequired: "Experticia en ética de IA",
  technologyExpertiseRequired: "Experticia tecnológica",

  instrumentsValidationStatus: "Validación de instrumentos",
  teacherQuestionnaireStatus: "Cuestionario docente",
  expertRubricStatus: "Rúbrica de expertos",
  interviewGuideStatus: "Guía de entrevista",
  observationProtocolStatus: "Protocolo de observación",
  usabilityEvaluationStatus: "Evaluación de usabilidad",
};

const humanizeKey = (key: string): string =>
  labelMap[key] ??
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase());

const stringifyValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value ?? "No disponible").replaceAll("_", " ");
};

const normalizeSignal = (
  title: string,
  endpoint: string,
  category: ResearchSignal["category"],
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
    entries.find(([key]) => key.toLowerCase().includes("criteria")) ??
    entries.find(([key]) => key.toLowerCase().includes("dimensions"));

  return {
    title,
    endpoint,
    category,
    status: statusEntry ? stringifyValue(statusEntry[1]) : "Validado",
    summary:
      entries
        .slice(0, 3)
        .map(([key, value]) => `${humanizeKey(key)}: ${stringifyValue(value)}`)
        .join(" · ") || "Endpoint disponible en backend.",
    evidence: Array.isArray(evidenceEntry?.[1])
      ? evidenceEntry?.[1].map((value) => stringifyValue(value))
      : entries
          .slice(0, 5)
          .map(([key, value]) => `${humanizeKey(key)}: ${stringifyValue(value)}`),
  };
};

export const fetchResearchSignals = async (): Promise<ResearchSignal[]> => {
  const endpoints = [
    {
      title: "Gobernanza de IA educativa",
      endpoint: "/analytics/governance/policy-preview",
      category: "governance" as const,
    },
    {
      title: "Confiabilidad institucional",
      endpoint: "/analytics/trustworthiness/assessment-preview",
      category: "trustworthiness" as const,
    },
    {
      title: "Equidad y sesgo",
      endpoint: "/analytics/fairness/bias-assessment-preview",
      category: "trustworthiness" as const,
    },
    {
      title: "Gobernanza arquitectónica",
      endpoint: "/analytics/architecture/governance-preview",
      category: "architecture" as const,
    },
    {
      title: "Preparación Kubernetes",
      endpoint: "/analytics/deployment/kubernetes-readiness-preview",
      category: "deployment" as const,
    },
    {
      title: "Ética de investigación",
      endpoint: "/analytics/research/ethics-readiness-preview",
      category: "ethics" as const,
    },
    {
      title: "Validación por expertos",
      endpoint: "/analytics/research/expert-validation-preview",
      category: "research" as const,
    },
    {
      title: "Instrumentos de investigación",
      endpoint: "/analytics/research/instruments-validation-preview",
      category: "research" as const,
    },
  ];

  const responses = await Promise.all(
    endpoints.map(async (item) => {
      const response = await client.get<ApiRecord>(item.endpoint);
      return normalizeSignal(item.title, item.endpoint, item.category, response.data);
    })
  );

  return responses;
};


