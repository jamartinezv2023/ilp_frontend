import { test } from "node:test";
import { strict as assert } from "node:assert";
import { items, summarize } from "../../public/review/model.mjs";

test("la demo contiene preguntas ficticias de Física y no inventarios", () => {
  assert.equal(items.length, 3);
  assert.ok(items.every((item) => item.id.startsWith("F")));
});
test("un intento completo produce apoyo trazable al puntaje", () => {
  assert.deepEqual(summarize({ F1: 0, F2: 0, F3: 2 }), {
    answered: 3, correct: 2, total: 3,
    support: "Profundizar con transferencia a otro contexto",
  });
});
test("respuestas inválidas o incompletas no se cuentan", () => {
  assert.equal(summarize({ F1: -1, F2: 100, F3: 0 }).answered, 1);
  assert.equal(summarize({}).answered, 0);
});
