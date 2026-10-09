export type DraftScope = { ownerId: string; tenantId: string; assignmentId: string; instrumentVersion: string };
export type SyntheticAnswer = '' | 'A' | 'B';
export type SyntheticDraft = {
  schema: 1; kind: 'SYNTHETIC_P02'; scope: DraftScope; administrationId: string;
  revision: number; answer: SyntheticAnswer; createdAt: string; updatedAt: string;
};
export interface DraftStore {
  load(scope: DraftScope): Promise<SyntheticDraft | undefined>;
  save(scope: DraftScope, revision: number, answer: SyntheticAnswer): Promise<SyntheticDraft>;
}
function normalizedScope(scope: DraftScope): DraftScope {
  const { ownerId, tenantId, assignmentId, instrumentVersion } = scope;
  if ([ownerId, tenantId, assignmentId, instrumentVersion].some(value => typeof value !== 'string' || !value.trim())) {
    throw new Error('INVALID_DRAFT_SCOPE');
  }
  return { ownerId, tenantId, assignmentId, instrumentVersion };
}
function key(scope: DraftScope): string {
  const value = normalizedScope(scope);
  return JSON.stringify([value.ownerId, value.tenantId, value.assignmentId, value.instrumentVersion]);
}
function checkedDraft(value: unknown, scope: DraftScope): SyntheticDraft | undefined {
  if (value === undefined) return undefined;
  const draft = value as SyntheticDraft;
  if (draft?.schema !== 1 || draft.kind !== 'SYNTHETIC_P02'
    || !draft.scope || key(draft.scope) !== key(scope)
    || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(draft.administrationId)
    || !Number.isSafeInteger(draft.revision) || draft.revision < 1
    || !['', 'A', 'B'].includes(draft.answer)
    || !Number.isFinite(Date.parse(draft.createdAt)) || !Number.isFinite(Date.parse(draft.updatedAt))) {
    throw new Error('INVALID_STORED_DRAFT');
  }
  return draft;
}
export function createSyntheticDraftStore(databaseName = 'ilp-p02-synthetic-drafts'): DraftStore {
  function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) { reject(new Error('STORAGE_UNAVAILABLE')); return; }
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts');
      request.onerror = () => reject(new Error('STORAGE_UNAVAILABLE'));
      let blocked = false;
      request.onblocked = () => { blocked = true; reject(new Error('STORAGE_BLOCKED')); };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        if (blocked) db.close();
        else resolve(db);
      };
    });
  }
  async function access(scope: DraftScope, write?: { revision: number; answer: SyntheticAnswer }): Promise<SyntheticDraft | undefined> {
    const storageKey = key(scope);
    const db = await open();
    try {
      return await new Promise<SyntheticDraft | undefined>((resolve, reject) => {
        const mode = write ? 'readwrite' : 'readonly';
        const tx = db.transaction('drafts', mode, { durability: 'strict' });
        let result: SyntheticDraft | undefined;
        let failure: Error | undefined;
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(failure ?? new Error('STORAGE_WRITE_FAILED'));
        const store = tx.objectStore('drafts');
        const request = store.get(storageKey);
        request.onsuccess = () => {
          try {
            result = checkedDraft(request.result, scope);
            if (!write) return;
            if ((result?.revision ?? 0) !== write.revision) throw new Error('DRAFT_CONFLICT');
            const now = new Date().toISOString();
            result = {
              schema: 1, kind: 'SYNTHETIC_P02', scope: normalizedScope(scope),
              administrationId: result?.administrationId ?? crypto.randomUUID(),
              createdAt: result?.createdAt ?? now, updatedAt: now,
              revision: write.revision + 1, answer: write.answer,
            };
            store.put(result, storageKey);
          } catch (error) { failure = error instanceof Error ? error : new Error('STORAGE_WRITE_FAILED', { cause: error }); tx.abort(); }
        };
      });
    } finally { db.close(); }
  }
  return {
    load: scope => access(scope),
    save: async (scope, revision, answer) => {
      if (!Number.isSafeInteger(revision) || revision < 0 || !['', 'A', 'B'].includes(answer)) throw new Error('INVALID_DRAFT_INPUT');
      const draft = await access(scope, { revision, answer });
      if (!draft) throw new Error('STORAGE_WRITE_FAILED');
      return draft;
    },
  };
}
