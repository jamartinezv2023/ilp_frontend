import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'node:util';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { verifyInstitutionalOfflineAccess, enrollInstitutionalOfflineAccess, institutionalOfflineConfigured } from '../../src/features/offline/institutionalOfflineAccess';
import type { SyntheticDraft } from '../../src/features/offline/syntheticDraftStore';
let pair: CryptoKeyPair; let publicKey: string;
const draft: SyntheticDraft = { schema: 1, kind: 'SYNTHETIC_P02', answer: 'A', revision: 1,
  administrationId: '90000000-0000-4000-8000-000000000099', offlineDeviceId: '90000000-0000-4000-8000-000000000098',
  scope: { ownerId: '90000000-0000-4000-8000-000000000001', tenantId: '11111111-1111-4111-8111-111111111111',
    assignmentId: '90000000-0000-4000-8000-000000000021', instrumentVersion: 'r9-v1' }, createdAt: '2026-10-09T00:00:00Z', updatedAt: '2026-10-09T00:00:00Z' };
beforeAll(async () => {
  pair = await webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
  publicKey = Buffer.from(await webcrypto.subtle.exportKey('spki', pair.publicKey)).toString('base64');
});
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('TextEncoder', TextEncoder); vi.stubGlobal('TextDecoder', TextDecoder); });
async function signed(changes: Record<string, unknown> = {}, headerChanges: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'ilp-offline+jwt', ...headerChanges })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: 'urn:ilp:offline:v1', aud: ['ilp-local-edit'], sub: draft.scope.ownerId,
    tenantId: draft.scope.tenantId, assignmentId: draft.scope.assignmentId, instrumentVersion: draft.scope.instrumentVersion,
    administrationId: draft.administrationId, deviceId: draft.offlineDeviceId, iat: 1000, exp: 1600, ...changes })).toString('base64url');
  const signature = await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(`${header}.${payload}`));
  return { ...draft, offlineCredential: `${header}.${payload}.${Buffer.from(signature).toString('base64url')}` };
}
it('accepts a scoped credential from the pinned authority, without network or an API bearer', async () => {
  await expect(verifyInstitutionalOfflineAccess(await signed(), false, publicKey, 1001)).resolves.toBeUndefined();
  expect(fetch).not.toHaveBeenCalled();
});
it('accepts the standard single audience representation', async () => {
  await expect(verifyInstitutionalOfflineAccess(await signed({ aud: 'ilp-local-edit' }), false, publicKey, 1001)).resolves.toBeUndefined();
});
it.each(['sub', 'tenantId', 'assignmentId', 'instrumentVersion', 'administrationId', 'deviceId', 'iss', 'aud'])('rejects a signed wrong %s binding', async field => {
  await expect(verifyInstitutionalOfflineAccess(await signed({ [field]: 'wrong' }), false, publicKey, 1001)).rejects.toThrow('OFFLINE_IDENTITY_MISMATCH');
});
it.each([{ alg: 'none' }, { alg: 'HS256' }, { typ: 'JWT' }])('rejects header confusion %j', async header => {
  await expect(verifyInstitutionalOfflineAccess(await signed({}, header), false, publicKey, 1001)).rejects.toThrow('INVALID_OFFLINE_CREDENTIAL');
});
it.each([999, 1600, 2000])('blocks a not-yet-valid or expired credential at %s', async now => {
  await expect(verifyInstitutionalOfflineAccess(await signed(), false, publicKey, now)).rejects.toThrow('OFFLINE_CREDENTIAL_EXPIRED');
});
it.each([{ exp: 1601 }, { exp: 999 }, { iat: '1000' }, { exp: 1500.5 }])('rejects invalid lifetimes %j', async claims => {
  await expect(verifyInstitutionalOfflineAccess(await signed(claims), false, publicKey, 1001)).rejects.toThrow('OFFLINE_CREDENTIAL_EXPIRED');
});
it('accepts expired signatures only for explicit online recovery, still bound to identity', async () => {
  await expect(verifyInstitutionalOfflineAccess(await signed(), true, publicKey, 2000)).resolves.toBeUndefined();
  await expect(verifyInstitutionalOfflineAccess(await signed({ sub: 'other' }), true, publicKey, 2000)).rejects.toThrow();
});
it('rejects tampering and preserves the caller draft', async () => {
  const original = await signed(); const parts = original.offlineCredential.split('.');
  const bytes = Buffer.from(parts[2], 'base64url'); bytes[0] ^= 1; parts[2] = bytes.toString('base64url');
  await expect(verifyInstitutionalOfflineAccess({ ...original, offlineCredential: parts.join('.') }, false, publicKey, 1001)).rejects.toThrow('OFFLINE_SIGNATURE_INVALID');
  expect(original.answer).toBe('A'); expect(original.revision).toBe(1);
});
it('fails closed without the pinned authority or signed credential', async () => {
  await expect(verifyInstitutionalOfflineAccess(draft, false, '', 1001)).rejects.toThrow('OFFLINE_AUTHORITY_UNCONFIGURED');
  await expect(verifyInstitutionalOfflineAccess(draft, false, publicKey, 1001)).rejects.toThrow('OFFLINE_CREDENTIAL_REQUIRED');
});
it('rejects oversized and malformed credentials', async () => {
  await expect(verifyInstitutionalOfflineAccess({ ...draft, offlineCredential: 'a'.repeat(4097) }, false, publicKey, 1001)).rejects.toThrow();
  await expect(verifyInstitutionalOfflineAccess({ ...draft, offlineCredential: 'not-a-token' }, false, publicKey, 1001)).rejects.toThrow();
});

it('unit configuration disables server enrollment before any transport call', async () => {
  expect(institutionalOfflineConfigured()).toBe(false);
  await expect(enrollInstitutionalOfflineAccess('synthetic-only', draft)).rejects.toThrow('OFFLINE_AUTHORITY_UNCONFIGURED');
  expect(fetch).not.toHaveBeenCalled();
});
