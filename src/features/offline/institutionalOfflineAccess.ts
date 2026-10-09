import { AUTH_API_BASE_URL, TENANT_ID } from '../../config/apiConfig';
import type { SyntheticDraft } from './syntheticDraftStore';
const PUBLIC_KEY = import.meta.env.VITE_OFFLINE_PUBLIC_KEY?.trim() ?? '';
export const institutionalOfflineConfigured = () => PUBLIC_KEY.length > 0;
function decode(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('INVALID_OFFLINE_CREDENTIAL');
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));
}
/** A pinned separate authority, never the API bearer key. Device clock is not trusted against tampering. */
export async function verifyInstitutionalOfflineAccess(draft: SyntheticDraft, allowExpired = false,
  publicKey = PUBLIC_KEY, nowSeconds = Math.floor(Date.now() / 1000)): Promise<void> {
  if (!publicKey) throw new Error('OFFLINE_AUTHORITY_UNCONFIGURED');
  const credential = draft.offlineCredential;
  if (typeof credential !== 'string' || credential.length > 4096) throw new Error('OFFLINE_CREDENTIAL_REQUIRED');
  const parts = credential.split('.');
  if (parts.length !== 3) throw new Error('INVALID_OFFLINE_CREDENTIAL');
  const header = JSON.parse(new TextDecoder().decode(decode(parts[0]))) as { alg?: string; typ?: string };
  if (header?.alg !== 'RS256' || header.typ !== 'ilp-offline+jwt') throw new Error('INVALID_OFFLINE_CREDENTIAL');
  const key = await crypto.subtle.importKey('spki', Uint8Array.from(atob(publicKey), char => char.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`))) {
    throw new Error('OFFLINE_SIGNATURE_INVALID');
  }
  const claims = JSON.parse(new TextDecoder().decode(decode(parts[1]))) as Record<string, unknown>;
  verifyScope(claims, draft);
  verifyLifetime(claims, allowExpired, nowSeconds);
}
function verifyScope(claims: Record<string, unknown>, draft: SyntheticDraft): void {
  const audienceValid = claims?.aud === 'ilp-local-edit' ||
    (Array.isArray(claims?.aud) && claims.aud.length === 1 && claims.aud[0] === 'ilp-local-edit');
  if (claims?.iss !== 'urn:ilp:offline:v1' || !audienceValid
    || claims.sub !== draft.scope.ownerId || claims.tenantId !== draft.scope.tenantId
    || claims.assignmentId !== draft.scope.assignmentId || claims.instrumentVersion !== draft.scope.instrumentVersion
    || claims.administrationId !== draft.administrationId || claims.deviceId !== draft.offlineDeviceId
    || typeof claims.deviceId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(claims.deviceId)) {
    throw new Error('OFFLINE_IDENTITY_MISMATCH');
  }
}
function verifyLifetime(claims: Record<string, unknown>, allowExpired: boolean, nowSeconds: number): void {
  const { iat, exp } = claims;
  if (typeof iat !== 'number' || typeof exp !== 'number' || !Number.isSafeInteger(iat) || !Number.isSafeInteger(exp)
    || exp <= iat || exp - iat > 600 || nowSeconds < iat || (!allowExpired && nowSeconds >= exp)) {
    throw new Error('OFFLINE_CREDENTIAL_EXPIRED');
  }
}
export async function enrollInstitutionalOfflineAccess(token: string, draft: SyntheticDraft): Promise<SyntheticDraft> {
  if (!institutionalOfflineConfigured()) throw new Error('OFFLINE_AUTHORITY_UNCONFIGURED');
  if (!navigator.onLine || !token.trim()) throw new Error('ONLINE_ENROLLMENT_REQUIRED');
  const deviceId = draft.offlineDeviceId ?? crypto.randomUUID();
  const response = await fetch(`${AUTH_API_BASE_URL}/auth/offline-access`, {
    method: 'POST', credentials: 'omit', cache: 'no-store', headers: {
      'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Tenant-Id': TENANT_ID,
    }, body: JSON.stringify({ assignmentId: draft.scope.assignmentId, instrumentVersion: draft.scope.instrumentVersion,
      administrationId: draft.administrationId, deviceId }),
  });
  if (!response.ok) throw new Error(`OFFLINE_ENROLLMENT_HTTP_${response.status}`);
  const value = await response.json() as { credential?: string };
  const enrolled = { ...draft, offlineDeviceId: deviceId, offlineCredential: value.credential };
  await verifyInstitutionalOfflineAccess(enrolled);
  return enrolled;
}
