import { webcrypto } from 'node:crypto';
import { TextDecoder, TextEncoder } from 'node:util';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, expect, it, vi } from 'vitest';
import { createSyntheticDraftStore, type DraftScope } from '../../src/features/offline/syntheticDraftStore';
import { prepareDraftAccess, unlockPreparedDraft, forgetPreparedAccess, saveLocallyUnlockedDraft } from '../../src/features/offline/preparedDraftAccess';
import { verifiedDraftScope } from '../../src/features/offline/verifiedDraftScope';
vi.mock('../../src/features/offline/verifiedDraftScope', () => ({ verifiedDraftScope: vi.fn() }));
const mocks = vi.hoisted(() => ({ history: vi.fn() }));
vi.mock('../../src/features/assessment-engine/services/authorizedScientificApi', () => ({ authorizedScientificApi: () => ({ history: mocks.history }) }));
const scope: DraftScope = { ownerId: '90000000-0000-4000-8000-000000000001', tenantId: '11111111-1111-4111-8111-111111111111',
  assignmentId: '90000000-0000-4000-8000-000000000021', instrumentVersion: 'r9-v1' };
const passphrase = 'Synthetic-device-key-only!';
const storage = 'ilp.r9.prepared.p02es360';
beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory());
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('TextEncoder', TextEncoder); vi.stubGlobal('TextDecoder', TextDecoder);
  vi.stubGlobal('navigator', { onLine: true, locks: { request: vi.fn(async (_name, action) => action()) } });
  localStorage.clear();
  vi.mocked(verifiedDraftScope).mockResolvedValue(scope);
  mocks.history.mockReset().mockResolvedValue([]);
});
async function prepared() {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  await prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase);
  return draft;
}
it('prepares only after identity and authorization, without storing credentials or plaintext scope', async () => {
  const draft = await prepared();
  expect(verifiedDraftScope).toHaveBeenCalledWith('synthetic-token', scope.assignmentId, scope.instrumentVersion);
  expect(mocks.history).toHaveBeenCalledWith(scope.assignmentId);
  const text = localStorage.getItem(storage)!;
  expect(text).not.toContain(passphrase); expect(text).not.toContain('synthetic-token'); expect(text).not.toContain(scope.ownerId);
  expect(await unlockPreparedDraft('p02es360', passphrase)).toEqual(draft);
});
it('unlocks after offline edits and preserves attempt identity and current revision', async () => {
  const initial = await prepared();
  vi.stubGlobal('navigator', { onLine: false });
  const current = await unlockPreparedDraft('p02es360', passphrase);
  const edited = await saveLocallyUnlockedDraft('p02es360', current, 'B');
  expect(await unlockPreparedDraft('p02es360', passphrase)).toEqual(edited);
  expect(edited.administrationId).toBe(initial.administrationId);
  expect(edited.revision).toBe(initial.revision + 1);
});
it('rejects a wrong key and leaves the draft intact', async () => {
  const initial = await prepared();
  await expect(unlockPreparedDraft('p02es360', 'Wrong-device-key-only!')).rejects.toThrow();
  expect(await createSyntheticDraftStore().load(scope)).toEqual(initial);
});
it('rejects tampering with the encrypted scope', async () => {
  await prepared();
  const record = JSON.parse(localStorage.getItem(storage)!);
  record.ciphertext[0] ^= 1;
  localStorage.setItem(storage, JSON.stringify(record));
  await expect(unlockPreparedDraft('p02es360', passphrase)).rejects.toThrow();
});
it('rejects copying a sealed record to another fixture', async () => {
  await prepared();
  localStorage.setItem('ilp.r9.prepared.p02en360', localStorage.getItem(storage)!);
  await expect(unlockPreparedDraft('p02en360', passphrase)).rejects.toThrow();
});
it('does not replace a previously prepared key silently', async () => {
  const draft = await prepared();
  const text = localStorage.getItem(storage);
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, 'Replacement-device-key!')).rejects.toThrow('PREPARED_ACCESS_EXISTS');
  expect(localStorage.getItem(storage)).toBe(text);
});
it('requires a fresh identity that matches the draft owner', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  vi.mocked(verifiedDraftScope).mockResolvedValue({ ...scope, ownerId: '90000000-0000-4000-8000-000000000002' });
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('DRAFT_OWNER_MISMATCH');
  expect(mocks.history).not.toHaveBeenCalled(); expect(localStorage.getItem(storage)).toBeNull();
});
it('denied authorization cannot prepare local access', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  mocks.history.mockRejectedValue(new Error('403'));
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('403');
  expect(localStorage.getItem(storage)).toBeNull();
});
it('rejects a stale preparation revision', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  await createSyntheticDraftStore().save(scope, draft.revision, 'B');
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('DRAFT_CONFLICT');
  expect(localStorage.getItem(storage)).toBeNull();
});
it.each(['short', 'a'.repeat(129)])('rejects an unsuitable device key', async key => {
  await expect(unlockPreparedDraft('p02es360', key)).rejects.toThrow('INVALID_DEVICE_KEY');
});
it('does not offer a fallback without native cryptography', async () => {
  vi.stubGlobal('crypto', {});
  await expect(unlockPreparedDraft('p02es360', passphrase)).rejects.toThrow('LOCAL_CRYPTO_UNAVAILABLE');
});
it('cannot prepare while disconnected', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  vi.stubGlobal('navigator', { onLine: false });
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('ONLINE_PREPARATION_REQUIRED');
});
it('reports missing preparation without disclosing any draft', async () => {
  await expect(unlockPreparedDraft('p02es360', passphrase)).rejects.toThrow('PREPARED_ACCESS_UNAVAILABLE');
});
it('rejects invalid fixture context', async () => {
  await expect(unlockPreparedDraft('../other', passphrase)).rejects.toThrow('INVALID_PREPARATION_CONTEXT');
});
it.each([
  { schema: 2 }, { schema: 1, salt: [] }, { schema: 1, salt: Array(16).fill(256) },
  { schema: 1, salt: Array(16).fill(0), iv: [] },
  { schema: 1, salt: Array(16).fill(0), iv: Array(12).fill(0), ciphertext: Array(1025).fill(0) },
])('rejects malformed sealed metadata %j', async record => {
  localStorage.setItem(storage, JSON.stringify(record));
  await expect(unlockPreparedDraft('p02es360', passphrase)).rejects.toThrow('INVALID_PREPARED_ACCESS');
});

it('refuses to prepare an attempt already recorded on the server', async () => {
  const draft = await createSyntheticDraftStore().save(scope, 0, 'A');
  mocks.history.mockResolvedValue([{ administrationId: draft.administrationId }]);
  await expect(prepareDraftAccess('synthetic-token', 'p02es360', draft, passphrase)).rejects.toThrow('DRAFT_ALREADY_SUBMITTED');
  expect(localStorage.getItem(storage)).toBeNull();
});
it('forgets local access after confirmation without deleting the recoverable draft', async () => {
  const draft = await prepared();
  forgetPreparedAccess('p02es360');
  await expect(unlockPreparedDraft('p02es360', passphrase)).rejects.toThrow('PREPARED_ACCESS_UNAVAILABLE');
  expect(await createSyntheticDraftStore().load(scope)).toEqual(draft);
});

it('does not edit an open draft after the prepared access is removed', async () => {
  const draft = await prepared();
  forgetPreparedAccess('p02es360');
  expect(() => saveLocallyUnlockedDraft('p02es360', draft, 'B')).toThrow('LOCAL_ACCESS_ENDED');
  expect(await createSyntheticDraftStore().load(scope)).toEqual(draft);
});
