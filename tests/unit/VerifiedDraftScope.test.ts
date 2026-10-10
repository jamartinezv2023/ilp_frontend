import { afterEach, describe, expect, it, vi } from "vitest";
import { verifiedDraftScope } from "../../src/features/offline/verifiedDraftScope";
import { AUTH_API_BASE_URL, TENANT_ID } from "../../src/config/apiConfig";
const owner = "90000000-0000-4000-8000-000000000001";
const assignment = "10000000-0000-4000-8000-000000000001";
afterEach(() => vi.unstubAllGlobals());
function reply(value: unknown, status = 200) {
  const transport = vi.fn().mockResolvedValue({ ok: status === 200, status, json: async () => value });
  vi.stubGlobal("fetch", transport);
  return transport;
}
describe("online verified draft identity", () => {
  it("takes the owner from the server and requests a noncached identity", async () => {
    const transport = reply({ userId: owner, tenantId: TENANT_ID });
    expect(await verifiedDraftScope("test-token", assignment, "synthetic-v1")).toEqual({
      ownerId: owner, tenantId: TENANT_ID, assignmentId: assignment, instrumentVersion: "synthetic-v1",
    });
    expect(transport).toHaveBeenCalledWith(`${AUTH_API_BASE_URL}/auth/session-identity`, {
      method: "GET", credentials: "omit", cache: "no-store",
      headers: { Authorization: "Bearer test-token", "X-Tenant-Id": TENANT_ID },
    });
  });
  it.each([401, 403, 500])("blocks an HTTP %s identity response", async status => {
    reply({ userId: owner, tenantId: TENANT_ID }, status);
    await expect(verifiedDraftScope("test-token", assignment, "synthetic-v1")).rejects.toThrow(`IDENTITY_HTTP_${status}`);
  });
  it.each([null, {}, { userId: "email@example.invalid", tenantId: TENANT_ID },
    { userId: owner, tenantId: "20000000-0000-4000-8000-000000000001" },
    { userId: owner, tenantId: 1 }])("blocks malformed or different-tenant metadata %j", async value => {
    reply(value);
    await expect(verifiedDraftScope("test-token", assignment, "synthetic-v1")).rejects.toThrow("INVALID_SESSION_IDENTITY");
  });
  it("does not substitute a local identity when offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(verifiedDraftScope("test-token", assignment, "synthetic-v1")).rejects.toThrow("offline");
  });
  it.each([["", assignment, "v1"], ["token", "wrong", "v1"], ["token", assignment, " "]])(
    "rejects invalid context before HTTP", async (token, grant, version) => {
      const transport = reply({});
      await expect(verifiedDraftScope(token, grant, version)).rejects.toThrow("INVALID_DRAFT_CONTEXT");
      expect(transport).not.toHaveBeenCalled();
    });
});
