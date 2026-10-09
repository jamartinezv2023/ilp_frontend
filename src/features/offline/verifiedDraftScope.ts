import { AUTH_API_BASE_URL, TENANT_ID } from "../../config/apiConfig";
import type { DraftScope } from "./syntheticDraftStore";

const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
type SessionIdentity = { userId: string; tenantId: string };

/** Online identity only. The submission server must still verify grants and consent. */
export async function verifiedDraftScope(
  token: string,
  assignmentId: string,
  instrumentVersion: string,
): Promise<DraftScope> {
  if (!token.trim() || !uuid.test(assignmentId) || !instrumentVersion.trim()) {
    throw new Error("INVALID_DRAFT_CONTEXT");
  }
  const response = await fetch(`${AUTH_API_BASE_URL}/auth/session-identity`, {
    method: "GET", credentials: "omit", cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "X-Tenant-Id": TENANT_ID },
  });
  if (!response.ok) throw new Error(`IDENTITY_HTTP_${response.status}`);
  const identity: unknown = await response.json();
  const value = identity as Partial<SessionIdentity> | null;
  if (typeof value?.userId !== "string" || !uuid.test(value.userId)
    || typeof value.tenantId !== "string" || !uuid.test(value.tenantId)
    || value.tenantId.toLowerCase() !== TENANT_ID.toLowerCase()) {
    throw new Error("INVALID_SESSION_IDENTITY");
  }
  return { ownerId: value.userId.toLowerCase(), tenantId: value.tenantId.toLowerCase(),
    assignmentId: assignmentId.toLowerCase(), instrumentVersion };
}
