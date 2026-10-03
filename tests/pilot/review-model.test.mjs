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

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

test("el código offline incrustado coincide exactamente con las fuentes revisadas", () => {
  const directory = resolve(dirname(fileURLToPath(import.meta.url)), "../../public/review");
  const readSource = (name) => readFileSync(resolve(directory, name), "utf8")
    .replace(/\r\n?/g, "\n");
  const html = readSource("index.html");
  const model = readSource("model.mjs");
  const app = readSource("app.mjs");
  const inline = html.match(/<script id="review-code">\n([\s\S]*?)\n  <\/script>/)?.[1];
  const expected = (model.replace("export const items", "const items")
    .replace("export function summarize", "function summarize") + "\n" +
    app.replace('import { items, summarize } from "./model.mjs";\n', "")).trimEnd();
  assert.equal(inline, expected);
});
