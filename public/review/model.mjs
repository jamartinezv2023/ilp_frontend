// Instrumento demostrativo de Física. No es Kolb ni una medición validada.
export const items = Object.freeze([
  { id: "F1", prompt: "Si duplicamos la fuerza aplicada a un objeto y su masa no cambia, ¿qué ocurre con la aceleración?", options: ["Se duplica", "Se reduce a la mitad", "No cambia"], correct: 0, explanation: "La segunda ley de Newton relaciona fuerza, masa y aceleración: a = F/m." },
  { id: "F2", prompt: "Un automóvil frena. ¿Hacia dónde tiende a moverse su contenido si no está sujeto?", options: ["Hacia adelante", "Hacia atrás", "Permanece inmóvil respecto del auto"], correct: 0, explanation: "Por inercia, el contenido tiende a conservar su movimiento hacia adelante." },
  { id: "F3", prompt: "Dos estudiantes empujan una caja con fuerzas iguales en sentidos contrarios. ¿Cuál es la fuerza neta?", options: ["Cero", "El doble de una fuerza", "Siempre hacia la derecha"], correct: 0, explanation: "Las fuerzas opuestas de igual magnitud se cancelan." },
]);

export function summarize(responses) {
  const valid = items.filter((item) => Number.isInteger(responses[item.id]) && responses[item.id] >= 0 && responses[item.id] < item.options.length);
  const correct = valid.filter((item) => responses[item.id] === item.correct).length;
  return { answered: valid.length, correct, total: items.length, support: correct < 2 ? "Reforzar con ejemplo guiado y retroalimentación" : "Profundizar con transferencia a otro contexto" };
}
