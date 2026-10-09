import { authorizedScientificApi } from '../assessment-engine/services/authorizedScientificApi';
import { createSyntheticDraftStore, type DraftScope, type SyntheticDraft, type SyntheticAnswer } from './syntheticDraftStore';
import { verifiedDraftScope } from './verifiedDraftScope';
const PREFIX = 'ilp.r9.prepared.';
const ITERATIONS = 600000;
type SealedScope = { schema: 2; salt: number[]; iv: number[]; ciphertext: number[] };
type PreparedScope = { scope: DraftScope; administrationId: string };
const capabilities = new WeakMap<SyntheticDraft, { key: CryptoKey; salt: number[]; storage: string }>();
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
function checkedCompleteDraft(value: unknown): SyntheticDraft {
  checkedScope(value);
  const draft = value as SyntheticDraft;
  if (draft.schema !== 1 || draft.kind !== 'SYNTHETIC_P02'
    || !Number.isSafeInteger(draft.revision) || draft.revision < 1
    || !['', 'A', 'B'].includes(draft.answer)
    || !Number.isFinite(Date.parse(draft.createdAt)) || !Number.isFinite(Date.parse(draft.updatedAt))) {
    throw new Error('INVALID_PREPARED_ACCESS');
  }
  return draft;
}
function scopeStorage(scope: DraftScope): string {
  return JSON.stringify([scope.ownerId, scope.tenantId, scope.assignmentId, scope.instrumentVersion]);
}
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ilp-p02-synthetic-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onerror = () => reject(new Error('STORAGE_UNAVAILABLE'));
    let blocked = false;
    request.onblocked = () => { blocked = true; reject(new Error('STORAGE_BLOCKED')); };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (blocked) db.close(); else resolve(db);
    };
  });
}
async function readRecord(storage: string): Promise<SealedScope | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const request = tx.objectStore('drafts').get(storage);
      tx.oncomplete = () => resolve(request.result as SealedScope | undefined);
      tx.onabort = () => reject(new Error('STORAGE_UNAVAILABLE'));
    });
  } finally { db.close(); }
}
async function seal(storage: string, draft: SyntheticDraft, key: CryptoKey, salt: number[]): Promise<SealedScope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv,
    additionalData: new TextEncoder().encode(storage) }, key, new TextEncoder().encode(JSON.stringify(draft)));
  return { schema: 2, salt, iv: [...iv], ciphertext: [...new Uint8Array(ciphertext)] };
}
async function decrypt(storage: string, record: SealedScope, key: CryptoKey): Promise<SyntheticDraft> {
  if (record?.schema !== 2) throw new Error('INVALID_PREPARED_ACCESS');
  bytes(record.salt, 16);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(record.iv, 12),
    additionalData: new TextEncoder().encode(storage) }, key, bytes(record.ciphertext));
  return checkedCompleteDraft(JSON.parse(new TextDecoder().decode(plaintext)));
}
function migrateRecord(store: IDBObjectStore, storage: string, incoming: SealedScope,
  draft: SyntheticDraft, fail: (error: unknown) => void): void {
  const request = store.get(scopeStorage(draft.scope));
  request.onsuccess = () => {
    try {
      if (JSON.stringify(request.result) !== JSON.stringify(draft)) throw new Error('DRAFT_CONFLICT');
      // Ciphertext creation and plaintext removal commit together, or neither does.
      store.put(incoming, storage);
      store.delete(scopeStorage(draft.scope));
    } catch (error) { fail(error); }
  };
}
async function replaceRecord(storage: string, incoming: SealedScope, previous: SealedScope | undefined,
  migrating?: SyntheticDraft): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite', { durability: 'strict' });
      const store = tx.objectStore('drafts');
      let failure: Error | undefined;
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(failure ?? new Error('STORAGE_WRITE_FAILED'));
      const fail = (error: unknown) => {
        failure = error instanceof Error ? error : new Error('STORAGE_WRITE_FAILED', { cause: error });
        tx.abort();
      };
      const request = store.get(storage);
      request.onsuccess = () => {
        try {
          if (JSON.stringify(request.result) !== JSON.stringify(previous)) {
            throw new Error(previous ? 'DRAFT_CONFLICT' : 'PREPARED_ACCESS_EXISTS');
          }
          if (migrating) migrateRecord(store, storage, incoming, migrating, fail);
          else store.put(incoming, storage);
        } catch (error) { fail(error); }
      };
    });
  } finally { db.close(); }
}
export async function hasPreparedDraft(fixtureKey: string): Promise<boolean> {
  return (await readRecord(storageKey(fixtureKey))) !== undefined;
}
/** Only synthetic drafts prepared with a device key are migrated. No bearer token is stored. */
export async function prepareDraftAccess(token: string, fixtureKey: string, draft: SyntheticDraft, passphrase: string): Promise<void> {
  const storage = storageKey(fixtureKey);
  cryptoReady(passphrase);
  checkedCompleteDraft(draft);
  if (!navigator.onLine || !navigator.locks) throw new Error('ONLINE_PREPARATION_REQUIRED');
  if (await hasPreparedDraft(fixtureKey)) throw new Error('PREPARED_ACCESS_EXISTS');
  const scope = await verifiedDraftScope(token, draft.scope.assignmentId, draft.scope.instrumentVersion);
  if (JSON.stringify(scope) !== JSON.stringify(draft.scope)) throw new Error('DRAFT_OWNER_MISMATCH');
  const history = await authorizedScientificApi(token).history(scope.assignmentId);
  if (history.some(row => row.administrationId === draft.administrationId)) throw new Error('DRAFT_ALREADY_SUBMITTED');
  const current = await createSyntheticDraftStore().load(scope);
  if (current?.administrationId !== draft.administrationId || current.revision !== draft.revision) throw new Error('DRAFT_CONFLICT');
  const salt = [...crypto.getRandomValues(new Uint8Array(16))];
  const key = await derivedKey(passphrase, new Uint8Array(salt));
  const record = await seal(storage, draft, key, salt);
  await replaceRecord(storage, record, undefined, draft);
  capabilities.set(draft, { key, salt, storage });
  // Old P02-E scope-only bindings are redundant after the atomic migration.
  try { localStorage.removeItem(storage); }
  catch { /* The obsolete binding contains no answers and cannot reopen the deleted source. */ }
}
export async function unlockPreparedDraft(fixtureKey: string, passphrase: string): Promise<SyntheticDraft> {
  const storage = storageKey(fixtureKey);
  cryptoReady(passphrase);
  const record = await readRecord(storage);
  if (!record) throw new Error('PREPARED_ACCESS_UNAVAILABLE');
  if (record.schema !== 2) throw new Error('INVALID_PREPARED_ACCESS');
  const key = await derivedKey(passphrase, bytes(record.salt, 16));
  const draft = await decrypt(storage, record, key);
  capabilities.set(draft, { key, salt: record.salt, storage });
  return draft;
}
export function lockPreparedDraft(draft: SyntheticDraft | undefined): void {
  if (draft) capabilities.delete(draft);
}
export async function loadUnlockedDraft(fixtureKey: string, draft: SyntheticDraft): Promise<SyntheticDraft> {
  const capability = capabilities.get(draft);
  const storage = storageKey(fixtureKey);
  if (capability?.storage !== storage) throw new Error('LOCAL_ACCESS_ENDED');
  const record = await readRecord(storage);
  if (!record) throw new Error('PREPARED_ACCESS_UNAVAILABLE');
  const current = await decrypt(storage, record, capability.key);
  if (JSON.stringify(current.scope) !== JSON.stringify(draft.scope)
    || current.administrationId !== draft.administrationId) throw new Error('DRAFT_OWNER_MISMATCH');
  return current;
}
export async function saveLocallyUnlockedDraft(fixtureKey: string, draft: SyntheticDraft, answer: SyntheticAnswer): Promise<SyntheticDraft> {
  if (!['', 'A', 'B'].includes(answer)) throw new Error('INVALID_DRAFT_INPUT');
  const storage = storageKey(fixtureKey);
  const capability = capabilities.get(draft);
  if (capability?.storage !== storage) throw new Error('LOCAL_ACCESS_ENDED');
  const previous = await readRecord(storage);
  if (!previous) throw new Error('PREPARED_ACCESS_UNAVAILABLE');
  const current = await decrypt(storage, previous, capability.key);
  if (JSON.stringify(current) !== JSON.stringify(draft)) throw new Error('DRAFT_CONFLICT');
  const next: SyntheticDraft = { ...current, revision: current.revision + 1, answer, updatedAt: new Date().toISOString() };
  const sealed = await seal(storage, next, capability.key, capability.salt);
  await replaceRecord(storage, sealed, previous);
  capabilities.set(next, capability);
  capabilities.delete(draft);
  return next;
}
