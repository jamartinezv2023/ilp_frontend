import { items, summarize } from "./model.mjs";

// Los intentos viven solamente en memoria; no se usa almacenamiento persistente ni red.
let attempts = [];
const quiz = document.querySelector("#quiz");
const result = document.querySelector("#result");
const history = document.querySelector("#history");
const network = document.querySelector("#network");

function element(tag, value) {
  const node = document.createElement(tag);
  node.textContent = value;
  return node;
}

for (const item of items) {
  const group = document.createElement("fieldset");
  group.append(element("legend", `${item.id}: ${item.prompt}`));
  item.options.forEach((option, position) => {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = item.id;
    radio.value = String(position);
    label.append(radio, document.createTextNode(option));
    group.append(label);
  });
  quiz.append(group);
}

document.querySelector("#finish").addEventListener("click", () => {
  const form = new FormData(quiz);
  const answers = Object.fromEntries(items.filter((item) => form.has(item.id)).map((item) => [item.id, Number(form.get(item.id))]));
  const summary = summarize(answers);
  if (summary.answered !== summary.total) {
    result.replaceChildren(element("p", `Faltan ${summary.total - summary.answered} preguntas. Complete todas antes de evaluar.`));
    return;
  }
  attempts = [...attempts, { number: attempts.length + 1, summary }];
  result.replaceChildren(element("p", `Resultado: ${summary.correct} de ${summary.total}. Apoyo sugerido: ${summary.support}.`));
  for (const item of items) {
    const feedback = element("p", `${item.id}: ${answers[item.id] === item.correct ? "Correcto" : "Por revisar"}. ${item.explanation}`);
    feedback.className = "feedback";
    result.append(feedback);
  }
  history.replaceChildren(...attempts.map(({ number, summary: item }) => element("li", `Intento ${number}: ${item.correct} de ${item.total}. ${item.support}.`)));
});

document.querySelector("#reset").addEventListener("click", () => {
  attempts = [];
  quiz.reset();
  result.replaceChildren(element("p", "Sesión reiniciada. No se conservaron respuestas."));
  history.replaceChildren(element("li", "Todavía no hay intentos en esta sesión."));
});

function updateNetwork() { network.textContent = navigator.onLine ? "En línea" : "Sin conexión · demostración disponible"; }
window.addEventListener("online", updateNetwork);
window.addEventListener("offline", updateNetwork);
updateNetwork();

if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
    network.textContent += " · La instalación offline no está disponible";
  });
}
