import { webcrypto } from 'node:crypto';
import { TextDecoder, TextEncoder } from 'node:util';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { beforeEach, expect, it, vi } from 'vitest';
import { createSyntheticDraftStore, type DraftScope } from '../../src/features/offline/syntheticDraftStore';
import { prepareDraftAccess, unlockPreparedDraft, lockPreparedDraft, hasPreparedDraft,
  loadUnlockedDraft, saveLocallyUnlockedDraft } from '../../src/features/offline/preparedDraftAccess';
import { verifiedDraftScope } from '../../src/features/offline/verifiedDraftScope';
vi.mock('../../src/features/offline/verifiedDraftScope', () => ({ verifiedDraftScope: vi.fn() }));
const mocks = vi.hoisted(() => ({ history: vi.fn() }));
vi.mock('../../src/features/assessment-engine/services/authorizedScientificApi', () => ({ authorizedScientificApi: () => ({ history: mocks.history }) }));
const scope: DraftScope = { ownerId: '90000000-0000-4000-8000-000000000001', tenantId: '11111111-1111-4111-8111-111111111111',
  assignmentId: '90000000-0000-4000-8000-000000000021', instrumentVersion: 'r9-v1' };
const passphrase = 'Synthetic-device-key-only!';
const storage = 'ilp.r9.prepared.p02es360';
beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('TextEncoder', TextEncoder); vi.stubGlobal('TextDecoder', TextDecoder);
  vi.stubGlobal('navigator', { onLine: true, locks: { request: vi.fn(async (_name, action) => action()) } });
  vi.mocked(verifiedDraftScope).mockResolvedValue(scope); mocks.history.mockReset().mockResolvedValue([]);
});
async function raw(key = storage, write?: unknown) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('ilp-p02-synthetic-drafts', 1);
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction('drafts', write === undefined ? 'readonly' : 'readwrite');
      const store = tx.objectStore('drafts');
      if (write !== undefined) store.put(write, key);
      const request = store.get(key);
      tx.oncomplete = () => resolve(request.result); tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
async function prepared() {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  await prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase); return draft;
}
it('atomically replaces the entire plaintext draft with ciphertext after online identity and authorization', async () => {
  const draft = await prepared();
  expect(verifiedDraftScope).toHaveBeenCalledWith('synthetic-token', scope.assignmentId, scope.instrumentVersion);
  expect(mocks.history).toHaveBeenCalledWith(scope.assignmentId);
  expect(await createSyntheticDraftStore().load(scope)).toBeUndefined();
  const text = JSON.stringify(await raw());
  for (const secret of [passphrase, 'synthetic-token', draft.administrationId, scope.ownerId, '"answer"', scope.instrumentVersion]) {
    expect(text).not.toContain(secret);
  }
  expect(localStorage.getItem(storage)).toBeNull();
  expect(await hasPreparedDraft('p02es360')).toBe(true);
  expect(await unlockPreparedDraft('p02es360', passphrase)).toEqual(draft);
});
it('edits offline with fresh IVs, stable attempt identity and no plaintext reconstruction', async () => {
  const initial = await prepared(); const sealed = await raw(); vi.stubGlobal('navigator', { onLine: false });
  const current = await unlockPreparedDraft('p02es360', passphrase);
  const edited = await saveLocallyUnlockedDraft('p02es360', current, 'B');
  expect(await raw()).not.toEqual(sealed);
  expect(await unlockPreparedDraft('p02es360', passphrase)).toEqual(edited);
  expect(edited.administrationId).toBe(initial.administrationId); expect(edited.revision).toBe(initial.revision + 1);
  expect(await createSyntheticDraftStore().load(scope)).toBeUndefined();
  expect(mocks.history).toHaveBeenCalledTimes(1);
});
it('a wrong key cannot destroy ciphertext or restore a plaintext fallback', async () => {
  const draft = await prepared(); const sealed = await raw();
  await expect(unlockPreparedDraft('p02es360', 'Wrong-device-key-only!')).rejects.toThrow();
  expect(await raw()).toEqual(sealed); expect(await createSyntheticDraftStore().load(scope)).toBeUndefined();
  expect(await unlockPreparedDraft('p02es360', passphrase)).toEqual(draft);
});
it('tampering is rejected before revealing an answer', async () => {
  await prepared(); const record = await raw() as { ciphertext: number[] };
  record.ciphertext[0] ^= 1; await raw(storage, record);
  await expect(unlockPreparedDraft('p02es360', passphrase)).rejects.toThrow();
});
it('copying ciphertext to a different fixture fails authenticated-context verification', async () => {
  await prepared(); await raw('ilp.r9.prepared.p02en360', await raw());
  await expect(unlockPreparedDraft('p02en360', passphrase)).rejects.toThrow();
});
it('does not silently replace an existing encrypted draft or its key', async () => {
  const draft = await prepared(); const sealed = await raw();
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, 'Replacement-device-key!')).rejects.toThrow('PREPARED_ACCESS_EXISTS');
  expect(await raw()).toEqual(sealed);
});
it('rejects a stale editor without overwriting the newer revision', async () => {
  await prepared(); const first = await unlockPreparedDraft('p02es360', passphrase);
  const stale = await unlockPreparedDraft('p02es360', passphrase);
  const edited = await saveLocallyUnlockedDraft('p02es360', first, 'B');
  await expect(saveLocallyUnlockedDraft('p02es360', stale, 'A')).rejects.toThrow('DRAFT_CONFLICT');
  expect(await loadUnlockedDraft('p02es360', edited)).toEqual(edited);
});
it('concurrent encrypted edits commit one revision and reject the competing writer', async () => {
  await prepared(); const first = await unlockPreparedDraft('p02es360', passphrase);
  const second = await unlockPreparedDraft('p02es360', passphrase);
  const results = await Promise.allSettled([saveLocallyUnlockedDraft('p02es360', first, 'B'), saveLocallyUnlockedDraft('p02es360', second, 'A')]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
  expect((await unlockPreparedDraft('p02es360', passphrase)).revision).toBe(2);
});
it('locking invalidates the in-memory capability while preserving recovery with the key', async () => {
  const draft = await prepared(); lockPreparedDraft(draft);
  await expect(saveLocallyUnlockedDraft('p02es360', draft, 'B')).rejects.toThrow('LOCAL_ACCESS_ENDED');
  await expect(loadUnlockedDraft('p02es360', draft)).rejects.toThrow('LOCAL_ACCESS_ENDED');
  expect(await unlockPreparedDraft('p02es360', passphrase)).toEqual(draft);
});
it('a reconstructed object is not an unlocking capability', async () => {
  const draft = await prepared();
  await expect(saveLocallyUnlockedDraft('p02es360', { ...draft }, 'B')).rejects.toThrow('LOCAL_ACCESS_ENDED');
});
it('a failed migration preserves the original draft and leaves no partially migrated record', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  const original = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) {
    if (key === storage) throw new DOMException('Quota exceeded', 'QuotaExceededError');
    return original.call(this, value, key);
  });
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow();
  expect(await createSyntheticDraftStore().load(scope)).toEqual(draft);
  expect(await hasPreparedDraft('p02es360')).toBe(false);
});
it('requires matching current institutional identity before migration', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  vi.mocked(verifiedDraftScope).mockResolvedValue({ ...scope, ownerId: '90000000-0000-4000-8000-000000000002' });
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('DRAFT_OWNER_MISMATCH');
  expect(mocks.history).not.toHaveBeenCalled(); expect(await hasPreparedDraft('p02es360')).toBe(false);
});
it('denied server authorization leaves the plaintext source untouched', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A'); mocks.history.mockRejectedValue(new Error('403'));
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('403');
  expect(await createSyntheticDraftStore().load(scope)).toEqual(draft);
});
it('a concurrent plaintext edit prevents migration of stale answers', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  const newer = await createSyntheticDraftStore().save(scope, draft.revision, 'B');
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('DRAFT_CONFLICT');
  expect(await createSyntheticDraftStore().load(scope)).toEqual(newer);
});
it.each(['short', 'a'.repeat(129)])('rejects an unsuitable device key', async key => {
  await expect(unlockPreparedDraft('p02es360', key)).rejects.toThrow('INVALID_DEVICE_KEY');
});
it('has no fallback without native cryptography', async () => {
  vi.stubGlobal('crypto', {});
  await expect(unlockPreparedDraft('p02es360', passphrase)).rejects.toThrow('LOCAL_CRYPTO_UNAVAILABLE');
});
it('requires online preparation, never offline institutional authentication', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A'); vi.stubGlobal('navigator', { onLine: false });
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('ONLINE_PREPARATION_REQUIRED');
});
it('missing preparation reveals no answer', async () => {
  expect(await hasPreparedDraft('p02es360')).toBe(false);
  await expect(unlockPreparedDraft('p02es360', passphrase)).rejects.toThrow('PREPARED_ACCESS_UNAVAILABLE');
});
it('rejects invalid fixture context', async () => {
  await expect(unlockPreparedDraft('../other', passphrase)).rejects.toThrow('INVALID_PREPARATION_CONTEXT');
});
it.each([
  { schema: 1 }, { schema: 2, salt: [] }, { schema: 2, salt: Array(16).fill(256) },
  { schema: 2, salt: Array(16).fill(0), iv: [] },
  { schema: 2, salt: Array(16).fill(0), iv: Array(12).fill(0), ciphertext: Array(1025).fill(0) },
])('rejects malformed sealed metadata %j', async record => {
  await createSyntheticDraftStore().load(scope); await raw(storage, record);
  await expect(unlockPreparedDraft('p02es360', passphrase)).rejects.toThrow('INVALID_PREPARED_ACCESS');
});
it('refuses to migrate an attempt already registered on the server', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A'); mocks.history.mockResolvedValue([{ administrationId: draft.administrationId }]);
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('DRAFT_ALREADY_SUBMITTED');
  expect(await hasPreparedDraft('p02es360')).toBe(false);
});
it('removes an old scope-only binding only after full draft encryption commits', async () => {
  localStorage.setItem(storage, 'legacy-scope-only-binding'); const draft = await prepared();
  expect(localStorage.getItem(storage)).toBeNull(); expect(await unlockPreparedDraft('p02es360', passphrase)).toEqual(draft);
});

it('a failed encrypted edit preserves the last ciphertext and revision', async () => {
  const draft = await prepared(); const sealed = await raw();
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });
  await expect(saveLocallyUnlockedDraft('p02es360', draft, 'B')).rejects.toThrow('STORAGE_WRITE_FAILED');
  expect(await raw()).toEqual(sealed);
  expect(await unlockPreparedDraft('p02es360', passphrase)).toEqual(draft);
});
