import { clearPending, createSyntheticAttempt, enqueue, listPending } from "./store.mjs";

const status = document.querySelector("#status");
const history = document.querySelector("#history");
const create = document.querySelector("#create");
const clear = document.querySelector("#clear");

async function render() {
  const attempts = await listPending();
  history.replaceChildren();
  for (const attempt of attempts) {
    const entry = document.createElement("li");
    entry.textContent = `${attempt.operationId} · ${attempt.instrumentId} · ${attempt.instrumentVersion} · PENDIENTE LOCAL (sin enviar)`;
    history.append(entry);
  }
  status.textContent = `${attempts.length} intento(s) sintético(s) pendiente(s) en este navegador. Ninguno ha sido enviado ni confirmado.`;
}

async function run(action) {
  create.disabled = true;
  clear.disabled = true;
  try {
    await action();
    await render();
  } catch {
    status.textContent = "No se pudo utilizar el almacenamiento local. No se guardó ni envió ningún intento.";
  } finally {
    create.disabled = false;
    clear.disabled = false;
  }
}

create.addEventListener("click", () => run(() => enqueue(createSyntheticAttempt())));
clear.addEventListener("click", () => run(clearPending));
run(async () => {});

if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
    status.textContent += " La recarga sin conexión aún no está disponible.";
  });
}
