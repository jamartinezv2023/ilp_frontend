import assert from "node:assert/strict";
import { test } from "node:test";
import { createSyntheticAttempt, enqueue } from "../../public/offline-lab/store.mjs";

test("sólo crea identidad, versión y respuestas sintéticas", () => {
  const attempt = createSyntheticAttempt();
  assert.equal(attempt.status, "PENDING");
  assert.equal(attempt.participantId, "DEMO-OFFLINE-ONLY");
  assert.equal(attempt.instrumentId, "PHYSICS-SYNTHETIC-REVIEW");
  assert.equal(attempt.instrumentVersion, "1.0-demo");
  assert.deepEqual(attempt.answers, { F1: 0, F2: 0, F3: 0 });
});

test("rechaza propiedades añadidas y una identidad no sintética antes de guardar", async () => {
  const attempt = createSyntheticAttempt();
  await assert.rejects(enqueue({ ...attempt, name: "persona real" }), /sintéticos/);
  await assert.rejects(enqueue({ ...attempt, participantId: "STUDENT-123" }), /sintéticos/);
});
