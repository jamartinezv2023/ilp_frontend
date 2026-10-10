import { ADAPTIVE_API_BASE_URL, TENANT_ID } from "../../config/apiConfig";
import { authorizedScientificApi, type AuthorizedObservation } from "../assessment-engine/services/authorizedScientificApi";
import { verifiedDraftScope } from "./verifiedDraftScope";
import { createSyntheticDraftStore, type SyntheticDraft } from "./syntheticDraftStore";

export type SyntheticSubmissionFixture = {
  assignmentId: string; participantId: string; researchParticipantUuid: string;
  consentId: string; consentVersion: string; assessmentCode: string; assessmentVersion: string;
  researchSubjectId: string; evidenceId: string;
};
export type SynchronizationResult = { history: AuthorizedObservation[]; csv: string };
const store = createSyntheticDraftStore();
function scopeKey(draft: SyntheticDraft): string {
  return JSON.stringify([draft.scope.ownerId, draft.scope.tenantId,
    draft.scope.assignmentId, draft.scope.instrumentVersion]);
}
function cell(value: string): string {
  return `"${JSON.stringify(value).replaceAll('"', '""')}"`;
}
async function confirm(
  token: string, fixture: SyntheticSubmissionFixture, draft: SyntheticDraft,
): Promise<SynchronizationResult | undefined> {
  const api = authorizedScientificApi(token);
  const history = await api.history(fixture.assignmentId);
  const matches = history.filter(row => row.administrationId === draft.administrationId);
  if (matches.length === 0) return undefined;
  if (matches.length !== 1) throw new Error("AMBIGUOUS_HISTORY");
  const row = matches[0];
  if (row.assessmentCode !== fixture.assessmentCode || row.assessmentVersion !== fixture.assessmentVersion) {
    throw new Error("REGISTERED_INSTRUMENT_MISMATCH");
  }
  const snapshot = await api.snapshot(fixture.assignmentId, row);
  const prefix = [fixture.researchSubjectId, draft.administrationId, fixture.assessmentCode,
    fixture.assessmentVersion, "Q1", `R9-${draft.answer}`].map(cell).join(",") + ",";
  const lines = snapshot.csv.split("\n");
  if (snapshot.manifest.rowCount !== 1 || lines.length !== 3 || lines[2] !== ""
    || !lines[1].startsWith(prefix) || snapshot.manifest.consentEvidenceId !== fixture.evidenceId
    || snapshot.manifest.consentVersion !== fixture.consentVersion) {
    throw new Error("REGISTERED_ANSWER_MISMATCH");
  }
  return { history, csv: snapshot.csv };
}
async function synchronize(
  token: string, fixture: SyntheticSubmissionFixture, draft: SyntheticDraft,
  locale: "es" | "en", signal: AbortSignal,
  loadCurrent: () => Promise<SyntheticDraft | undefined>,
): Promise<SynchronizationResult> {
  signal.throwIfAborted();
  const scope = await verifiedDraftScope(token, fixture.assignmentId, fixture.assessmentVersion);
  if (JSON.stringify(scope) !== JSON.stringify(draft.scope) || !draft.answer) {
    throw new Error("DRAFT_IDENTITY_MISMATCH");
  }
  signal.throwIfAborted();
  // A failed history read blocks POST. An existing attempt is never submitted twice by this client.
  const recovered = await confirm(token, fixture, draft);
  signal.throwIfAborted();
  if (recovered) return recovered;
  const current = await loadCurrent();
  if (current?.revision !== draft.revision || current.administrationId !== draft.administrationId
    || current.answer !== draft.answer) throw new Error("DRAFT_CHANGED");
  signal.throwIfAborted();
  const time = new Date();
  const body = {
    administrationId: draft.administrationId, participantId: fixture.participantId,
    researchParticipantUuid: fixture.researchParticipantUuid,
    assessmentCode: fixture.assessmentCode, assessmentVersion: fixture.assessmentVersion,
    responses: [{ questionCode: "Q1", selectedOptionIds: [`R9-${draft.answer}`],
      rankings: {}, numericValue: null, textValue: null }],
    submittedAt: time.toISOString(), context: {
      source: "R9_ISOLATED", fieldworkPhase: "TEST_ONLY", language: locale,
      translationVersion: "r9-test", consentId: fixture.consentId, consentVersion: fixture.consentVersion,
      startedAt: draft.createdAt,
      durationSeconds: String(Math.max(0, Math.floor((time.getTime() - Date.parse(draft.createdAt)) / 1000))),
      timingSource: "CLIENT_REPORTED",
    },
  };
  let response: Response | undefined;
  try {
    response = await fetch(`${ADAPTIVE_API_BASE_URL}/api/v1/assessment-submissions`, {
      method: "POST", credentials: "omit", cache: "no-store", signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`,
        "X-Tenant-Id": TENANT_ID, "X-Scientific-Grant": fixture.assignmentId },
      body: JSON.stringify(body),
    });
  } catch {
    signal.throwIfAborted();
    // Delivery is uncertain: only a matching authorized snapshot can confirm it.
  }
  signal.throwIfAborted();
  if (response && !response.ok && response.status !== 409 && response.status < 500) {
    throw new Error(`SUBMISSION_HTTP_${response.status}`);
  }
  const confirmed = await confirm(token, fixture, draft);
  signal.throwIfAborted();
  if (!confirmed) throw new Error("DELIVERY_UNCONFIRMED");
  return confirmed;
}
/** Synthetic R9 form only. It neither authenticates offline nor automatically retries POST. */
export async function synchronizeSyntheticDraft(
  token: string, fixture: SyntheticSubmissionFixture, draft: SyntheticDraft,
  locale: "es" | "en", signal: AbortSignal,
  loadCurrent: () => Promise<SyntheticDraft | undefined> = () => store.load(draft.scope),
): Promise<SynchronizationResult> {
  if (!navigator.locks) throw new Error("SYNCHRONIZATION_LOCK_UNAVAILABLE");
  return navigator.locks.request(`ilp-p02-sync:${scopeKey(draft)}`, { mode: "exclusive", signal },
    () => synchronize(token, fixture, draft, locale, signal, loadCurrent));
}
