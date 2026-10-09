import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { createSyntheticDraftStore, type DraftScope } from '../../src/features/offline/syntheticDraftStore';
const scope: DraftScope = { ownerId: 'synthetic-owner', tenantId: 'tenant', assignmentId: 'assignment', instrumentVersion: 'v1' };
beforeEach(() => { vi.stubGlobal('indexedDB', new IDBFactory()); });
async function replace(value: unknown) {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('test', 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('drafts', 'readwrite');
      tx.objectStore('drafts').put(value, JSON.stringify(Object.values(scope)));
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(new Error('fixture failed')); };
    };
  });
}
describe('synthetic durable drafts', () => {
  it('recovers across store instances with the same attempt and creation time', async () => {
    const store = createSyntheticDraftStore('test');
    expect(await store.load(scope)).toBeUndefined();
    const first = await store.save(scope, 0, 'A');
    const recovered = await createSyntheticDraftStore('test').load(scope);
    expect(recovered).toEqual(first);
    const changed = await store.save(scope, first.revision, 'B');
    expect(changed.administrationId).toBe(first.administrationId);
    expect(changed.createdAt).toBe(first.createdAt);
    expect(changed.revision).toBe(2);
    expect((await store.load(scope))?.answer).toBe('B');
  });
  it.each(['ownerId', 'tenantId', 'assignmentId', 'instrumentVersion'] as const)('separates %s and rejects stale overwrite', async field => {
    const store = createSyntheticDraftStore('test');
    await store.save(scope, 0, 'A');
    expect(await store.load({ ...scope, [field]: 'other' })).toBeUndefined();
    await expect(store.save(scope, 0, 'B')).rejects.toThrow('DRAFT_CONFLICT');
    expect((await store.load(scope))?.answer).toBe('A');
  });
  it('serializes simultaneous first saves instead of losing a response', async () => {
    const results = await Promise.allSettled([createSyntheticDraftStore('test').save(scope, 0, 'A'), createSyntheticDraftStore('test').save(scope, 0, 'B')]);
    expect(results.filter(value => value.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(value => value.status === 'rejected')).toHaveLength(1);
    expect((await createSyntheticDraftStore('test').load(scope))?.revision).toBe(1);
  });
  it('keeps the last committed draft after a quota failure', async () => {
    const store = createSyntheticDraftStore('test');
    const draft = await store.save(scope, 0, 'A');
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
    await expect(store.save(scope, 1, 'B')).rejects.toThrow('quota');
    put.mockRestore();
    expect(await store.load(scope)).toEqual(draft);
  });
  it('reports unavailable storage without confirming a draft', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(createSyntheticDraftStore().load(scope)).rejects.toThrow('STORAGE_UNAVAILABLE');
  });
  it.each([-1, 0.5, Number.NaN])('rejects invalid revision %s', async revision => {
    await expect(createSyntheticDraftStore().save(scope, revision, 'A')).rejects.toThrow('INVALID_DRAFT_INPUT');
  });
  it('rejects empty context and invalid answers', async () => {
    await expect(createSyntheticDraftStore().load({ ...scope, ownerId: '' })).rejects.toThrow('INVALID_DRAFT_SCOPE');
    await expect(createSyntheticDraftStore().save(scope, 0, 'X' as 'A')).rejects.toThrow('INVALID_DRAFT_INPUT');
  });
  it.each([{ schema: 2 }, { kind: 'ORIGINAL' }, { answer: 'X' }, { administrationId: 'invalid' }, { revision: 0 }, { updatedAt: 'invalid' }, { scope: { ...scope, ownerId: 'other' } }])('blocks corrupted stored data %j', async change => {
    const store = createSyntheticDraftStore('test');
    const draft = await store.save(scope, 0, 'A');
    await replace({ ...draft, ...change });
    await expect(store.load(scope)).rejects.toThrow('INVALID_STORED_DRAFT');
    await expect(store.save(scope, 1, 'B')).rejects.toThrow();
  });
  it('does not downgrade an incompatible database', async () => {
    await new Promise<void>(resolve => {
      const request = indexedDB.open('test', 2);
      request.onsuccess = () => { request.result.close(); resolve(); };
    });
    await expect(createSyntheticDraftStore('test').load(scope)).rejects.toThrow('STORAGE_UNAVAILABLE');
  });
});
