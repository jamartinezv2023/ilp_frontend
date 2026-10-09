import { authorizedScientificApi } from '../assessment-engine/services/authorizedScientificApi';
import { createSyntheticDraftStore, type DraftScope, type SyntheticDraft, type SyntheticAnswer } from './syntheticDraftStore';
import { verifiedDraftScope } from './verifiedDraftScope';
const PREFIX = 'ilp.r9.prepared.';
const ITERATIONS = 600000;
type SealedScope = { schema: 1; salt: number[]; iv: number[]; ciphertext: number[] };
type PreparedScope = { scope: DraftScope; administrationId: string };
function storageKey(fixtureKey: string): string {
  if (!/^[a-z0-9]{1,32}$/.test(fixtureKey)) throw new Error('INVALID_PREPARATION_CONTEXT');
  return PREFIX + fixtureKey;
}
function cryptoReady(passphrase: string) {
  if (passphrase.length < 12 || passphrase.length > 128) throw new Error('INVALID_DEVICE_KEY');
  if (!globalThis.crypto?.subtle) throw new Error('LOCAL_CRYPTO_UNAVAILABLE');
}
async function derivedKey(passphrase: string, salt: Uint8Array<ArrayBuffer>) {
  cryptoReady(passphrase);
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
function bytes(value: unknown, length?: number): Uint8Array<ArrayBuffer> {
  if (!Array.isArray(value) || value.length > 1024 || (length !== undefined && value.length !== length)
    || value.length === 0 || value.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
    throw new Error('INVALID_PREPARED_ACCESS');
  }
  return new Uint8Array(value);
}
function checkedScope(value: unknown): PreparedScope {
  const prepared = value as Partial<PreparedScope> | null;
  const scope = prepared?.scope;
  const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
  if (!scope || ![scope.ownerId, scope.tenantId, scope.assignmentId, prepared?.administrationId]
    .every(value => typeof value === 'string' && uuid.test(value))
    || typeof scope.instrumentVersion !== 'string' || !scope.instrumentVersion.trim() || scope.instrumentVersion.length > 100) {
    throw new Error('INVALID_PREPARED_ACCESS');
  }
  return { scope, administrationId: prepared!.administrationId! };
}
/** Local unlocking only; never restores a bearer token or grants server permission. */
export async function prepareDraftAccess(token: string, fixtureKey: string, draft: SyntheticDraft, passphrase: string): Promise<void> {
  const storage = storageKey(fixtureKey);
  cryptoReady(passphrase);
  if (!navigator.onLine || !navigator.locks) throw new Error('ONLINE_PREPARATION_REQUIRED');
  const scope = await verifiedDraftScope(token, draft.scope.assignmentId, draft.scope.instrumentVersion);
  if (JSON.stringify(scope) !== JSON.stringify(draft.scope)) throw new Error('DRAFT_OWNER_MISMATCH');
  const history = await authorizedScientificApi(token).history(scope.assignmentId);
  if (history.some(row => row.administrationId === draft.administrationId)) throw new Error('DRAFT_ALREADY_SUBMITTED');
  const current = await createSyntheticDraftStore().load(scope);
  if (!current || current.administrationId !== draft.administrationId || current.revision !== draft.revision) throw new Error('DRAFT_CONFLICT');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derivedKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(storage) }, key,
    new TextEncoder().encode(JSON.stringify({ scope, administrationId: draft.administrationId })));
  const record: SealedScope = { schema: 1, salt: [...salt], iv: [...iv], ciphertext: [...new Uint8Array(ciphertext)] };
  await navigator.locks.request(storage, () => {
    if (localStorage.getItem(storage) !== null) throw new Error('PREPARED_ACCESS_EXISTS');
    localStorage.setItem(storage, JSON.stringify(record));
  });
}
export async function unlockPreparedDraft(fixtureKey: string, passphrase: string): Promise<SyntheticDraft> {
  const storage = storageKey(fixtureKey);
  cryptoReady(passphrase);
  const text = localStorage.getItem(storage);
  if (!text || text.length > 4096) throw new Error('PREPARED_ACCESS_UNAVAILABLE');
  const record = JSON.parse(text) as Partial<SealedScope>;
  if (record?.schema !== 1) throw new Error('INVALID_PREPARED_ACCESS');
  const salt = bytes(record.salt, 16);
  const iv = bytes(record.iv, 12);
  const ciphertext = bytes(record.ciphertext);
  const key = await derivedKey(passphrase, salt);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(storage) }, key, ciphertext);
  const prepared = checkedScope(JSON.parse(new TextDecoder().decode(plaintext)));
  const draft = await createSyntheticDraftStore().load(prepared.scope);
  if (!draft || draft.administrationId !== prepared.administrationId) throw new Error('PREPARED_DRAFT_UNAVAILABLE');
  return draft;
}

export function forgetPreparedAccess(fixtureKey: string): void {
  localStorage.removeItem(storageKey(fixtureKey));
}

export function saveLocallyUnlockedDraft(fixtureKey: string, draft: SyntheticDraft, answer: SyntheticAnswer): Promise<SyntheticDraft> {
  if (localStorage.getItem(storageKey(fixtureKey)) === null) throw new Error('LOCAL_ACCESS_ENDED');
  return createSyntheticDraftStore().save(draft.scope, draft.revision, answer);
}
