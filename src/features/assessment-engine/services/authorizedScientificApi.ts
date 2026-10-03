import { ADAPTIVE_API_BASE_URL, TENANT_ID } from "../../../config/apiConfig";

export type AuthorizedObservation = {
  administrationId: string; assessmentCode: string; assessmentVersion: string;
  submittedAt: string; scores: { dimensionCode: string; numericValue: number }[];
};
export type AuthorizedSnapshot = {
  csv: string;
  manifest: { assignmentId: string; institutionId: string; administrationId: string;
    researchSubjectId: string; instrumentCode: string; instrumentVersion: string;
    consentEvidenceId: string; consentDocumentSha256: string; consentVersion: string;
    scores: { dimensionCode: string; numericValue: number }[];
    sha256: string; bytes: number; rowCount: number; schemaVersion: string };
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function requireUuid(value: string) {
  if (!uuid.test(value)) throw new Error("INVALID_IDENTIFIER");
  return value.toLowerCase();
}
export function authorizedScientificApi(token: string) {
  async function request<T>(path: string, method = "GET"): Promise<T> {
    const response = await fetch(`${ADAPTIVE_API_BASE_URL}/api/v1/scientific-applications/${path}`, {
      method, credentials: "omit", cache: "no-store", headers: {
        Authorization: `Bearer ${token}`, "X-Tenant-Id": TENANT_ID,
      },
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
  return {
    history: (assignment: string) => request<AuthorizedObservation[]>(`${requireUuid(assignment)}/history`),
    snapshot: async (assignment: string, observation: AuthorizedObservation) => {
      const snapshot = await request<AuthorizedSnapshot>(`${requireUuid(assignment)}/administrations/${encodeURIComponent(observation.administrationId)}/snapshot`);
      const bytes = new TextEncoder().encode(snapshot.csv);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const actual = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
      const manifest = snapshot.manifest;
      if (actual !== manifest.sha256 || bytes.length !== manifest.bytes
        || manifest.schemaVersion !== "ILP_AUTHORIZED_ANSWERS_CSV_V1"
        || manifest.assignmentId !== assignment.toLowerCase() || manifest.institutionId !== TENANT_ID.toLowerCase()
        || manifest.administrationId !== observation.administrationId
        || manifest.instrumentCode !== observation.assessmentCode
        || manifest.instrumentVersion !== observation.assessmentVersion
        || JSON.stringify(manifest.scores) !== JSON.stringify(observation.scores)) throw new Error("SNAPSHOT_INTEGRITY_FAILED");
      return snapshot;
    },
    withdraw: (evidenceId: string) => request<void>(`consents/${requireUuid(evidenceId)}/withdraw`, "POST"),
  };
}
