const DATABASE = "ilp-synthetic-offline-lab-v1";
const STORE = "attempts";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "operationId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode, action) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    database.close();
  }
}

export function createSyntheticAttempt() {
  return Object.freeze({
    operationId: crypto.randomUUID(),
    participantId: "DEMO-OFFLINE-ONLY",
    instrumentId: "PHYSICS-SYNTHETIC-REVIEW",
    instrumentVersion: "1.0-demo",
    language: "es",
    createdAt: new Date().toISOString(),
    answers: Object.freeze({ F1: 0, F2: 0, F3: 0 }),
    status: "PENDING",
  });
}

export async function enqueue(attempt) {
  const expected = ["answers", "createdAt", "instrumentId", "instrumentVersion", "language", "operationId", "participantId", "status"];
  if (!attempt || Object.keys(attempt).sort().join(",") !== expected.join(",") ||
      attempt.status !== "PENDING" || attempt.participantId !== "DEMO-OFFLINE-ONLY" ||
      attempt.instrumentId !== "PHYSICS-SYNTHETIC-REVIEW" ||
      attempt.instrumentVersion !== "1.0-demo" || attempt.language !== "es" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attempt.operationId) ||
      !Number.isFinite(Date.parse(attempt.createdAt)) ||
      Object.keys(attempt.answers ?? {}).sort().join(",") !== "F1,F2,F3" ||
      Object.values(attempt.answers).some((value) => value !== 0)) {
    throw new Error("Sólo se admiten intentos sintéticos pendientes.");
  }
  await transaction("readwrite", (store) => store.add(attempt));
}

export async function listPending() {
  const attempts = await transaction("readonly", (store) => store.getAll());
  return attempts.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function clearPending() {
  await transaction("readwrite", (store) => store.clear());
}
