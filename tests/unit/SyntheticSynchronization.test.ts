import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { synchronizeSyntheticDraft, type SyntheticSubmissionFixture } from "../../src/features/offline/synchronizeSyntheticDraft";
import type { SyntheticDraft } from "../../src/features/offline/syntheticDraftStore";
const mocks = vi.hoisted(() => ({ identity: vi.fn(), history: vi.fn(), snapshot: vi.fn(), load: vi.fn() }));
vi.mock("../../src/features/offline/verifiedDraftScope", () => ({ verifiedDraftScope: mocks.identity }));
vi.mock("../../src/features/offline/syntheticDraftStore", () => ({ createSyntheticDraftStore: () => ({ load: mocks.load }) }));
vi.mock("../../src/features/assessment-engine/services/authorizedScientificApi", () => ({
  authorizedScientificApi: () => ({ history: mocks.history, snapshot: mocks.snapshot }),
}));
const fixture: SyntheticSubmissionFixture = {
  assignmentId: "10000000-0000-4000-8000-000000000001", participantId: "SYNTHETIC",
  researchParticipantUuid: "20000000-0000-4000-8000-000000000001", consentId: "consent",
  consentVersion: "test-only", assessmentCode: "SYNTHETIC", assessmentVersion: "test-v1",
  researchSubjectId: "30000000-0000-4000-8000-000000000001", evidenceId: "evidence",
};
const draft: SyntheticDraft = { schema: 1, kind: "SYNTHETIC_P02", answer: "B", revision: 1,
  administrationId: "40000000-0000-4000-8000-000000000001", createdAt: "2026-10-09T01:00:00Z",
  updatedAt: "2026-10-09T01:00:00Z", scope: { ownerId: "50000000-0000-4000-8000-000000000001",
    tenantId: "11111111-1111-4111-8111-111111111111", assignmentId: fixture.assignmentId,
    instrumentVersion: fixture.assessmentVersion } };
const observation = { administrationId: draft.administrationId, assessmentCode: fixture.assessmentCode,
  assessmentVersion: fixture.assessmentVersion, submittedAt: draft.createdAt, scores: [] };
const csvCell = (value: string) => `"${JSON.stringify(value).replaceAll('"', '""')}"`;
const csv = "headers\n" + [fixture.researchSubjectId, draft.administrationId, fixture.assessmentCode,
  fixture.assessmentVersion, "Q1", "R9-B"].map(csvCell).join(",") + ',"","",0\n';
const snapshot = { csv, manifest: { rowCount: 1, consentEvidenceId: fixture.evidenceId, consentVersion: fixture.consentVersion } };
let transport: ReturnType<typeof vi.fn>;
const synchronize = (signal = new AbortController().signal) => synchronizeSyntheticDraft("test-token", fixture, draft, "es", signal);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.identity.mockResolvedValue(draft.scope);
  mocks.load.mockResolvedValue(draft);
  mocks.history.mockResolvedValue([]);
  mocks.snapshot.mockResolvedValue(snapshot);
  transport = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
  vi.stubGlobal("fetch", transport);
  vi.stubGlobal("navigator", { locks: { request: vi.fn(async (_name, _options, action) => action()) } });
});
afterEach(() => vi.unstubAllGlobals());
describe("synthetic authorized synchronization", () => {
  it("confirms an existing attempt without POST or changing its ID", async () => {
    mocks.history.mockResolvedValue([observation]);
    expect(await synchronize()).toEqual({ history: [observation], csv });
    expect(transport).not.toHaveBeenCalled();
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it("submits one stored attempt and requires a recovered snapshot", async () => {
    mocks.history.mockResolvedValueOnce([]).mockResolvedValueOnce([observation]);
    expect((await synchronize()).csv).toBe(csv);
    expect(transport).toHaveBeenCalledTimes(1);
    const options = transport.mock.calls[0][1];
    expect(options).toMatchObject({ method: "POST", cache: "no-store", credentials: "omit" });
    expect(JSON.parse(options.body)).toMatchObject({ administrationId: draft.administrationId,
      responses: [{ questionCode: "Q1", selectedOptionIds: ["R9-B"] }], context: { language: "es", fieldworkPhase: "TEST_ONLY" } });
  });
  it("recovers an accepted POST whose acknowledgement was lost, with no automatic repeat", async () => {
    transport.mockRejectedValue(new Error("connection lost"));
    mocks.history.mockResolvedValueOnce([]).mockResolvedValueOnce([observation]);
    expect((await synchronize()).csv).toBe(csv);
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([409, 500])("reconciles HTTP %s using the original attempt", async status => {
    transport.mockResolvedValue(new Response("{}", { status }));
    mocks.history.mockResolvedValueOnce([]).mockResolvedValueOnce([observation]);
    expect((await synchronize()).csv).toBe(csv);
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403, 400, 422])("keeps a rejected HTTP %s unconfirmed", async status => {
    transport.mockResolvedValue(new Response("{}", { status }));
    await expect(synchronize()).rejects.toThrow(`SUBMISSION_HTTP_${status}`);
    expect(mocks.snapshot).not.toHaveBeenCalled();
    expect(mocks.history).toHaveBeenCalledTimes(1);
  });
  it("blocks POST if the authorized history cannot be read", async () => {
    mocks.history.mockRejectedValue(new Error("HTTP_403"));
    await expect(synchronize()).rejects.toThrow("HTTP_403");
    expect(transport).not.toHaveBeenCalled();
  });
  it("blocks identity substitution", async () => {
    mocks.identity.mockResolvedValue({ ...draft.scope, ownerId: "different-account" });
    await expect(synchronize()).rejects.toThrow("DRAFT_IDENTITY_MISMATCH");
    expect(mocks.history).not.toHaveBeenCalled();
    expect(transport).not.toHaveBeenCalled();
  });
  it("keeps a changed local revision out of the POST", async () => {
    mocks.load.mockResolvedValue({ ...draft, revision: 2 });
    await expect(synchronize()).rejects.toThrow("DRAFT_CHANGED");
    expect(transport).not.toHaveBeenCalled();
  });
  it("does not confirm a POST without the same attempt in history", async () => {
    await expect(synchronize()).rejects.toThrow("DELIVERY_UNCONFIRMED");
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("rejects a different registered answer instead of overwriting it", async () => {
    mocks.history.mockResolvedValue([observation]);
    mocks.snapshot.mockResolvedValue({ ...snapshot, csv: csv.replace("R9-B", "R9-A") });
    await expect(synchronize()).rejects.toThrow("REGISTERED_ANSWER_MISMATCH");
    expect(transport).not.toHaveBeenCalled();
  });
  it("requires the registered instrument edition to match", async () => {
    mocks.history.mockResolvedValue([{ ...observation, assessmentVersion: "different-v2" }]);
    await expect(synchronize()).rejects.toThrow("REGISTERED_INSTRUMENT_MISMATCH");
    expect(transport).not.toHaveBeenCalled();
  });
  it("rejects ambiguous duplicate history entries", async () => {
    mocks.history.mockResolvedValue([observation, observation]);
    await expect(synchronize()).rejects.toThrow("AMBIGUOUS_HISTORY");
    expect(transport).not.toHaveBeenCalled();
  });
  it("requires a cross-tab synchronization lock", async () => {
    vi.stubGlobal("navigator", {});
    await expect(synchronize()).rejects.toThrow("SYNCHRONIZATION_LOCK_UNAVAILABLE");
    expect(mocks.identity).not.toHaveBeenCalled();
  });
  it("does not start a canceled session", async () => {
    const controller = new AbortController(); controller.abort();
    await expect(synchronize(controller.signal)).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
  it("does not send after a session is canceled during history recovery", async () => {
    const controller = new AbortController();
    mocks.history.mockImplementation(async () => { controller.abort(); return []; });
    await expect(synchronize(controller.signal)).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
});
