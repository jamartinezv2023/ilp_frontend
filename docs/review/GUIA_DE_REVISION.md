# ILP · Revisión académica sintética

Este cambio agrega una demostración independiente al frontend en `/review/index.html`. Presenta tres preguntas ficticias de Física, retroalimentación, un apoyo determinista y un historial en memoria que desaparece al reiniciar o recargar. El service worker cachea sólo recursos de la demostración bajo el alcance `/review/`.

## Revisión local

1. Ejecute `npm ci`, `npm run lint` y `npm run build`.
2. Para explorar, ejecute `npm run preview -- --host localhost --port 5173 --strictPort` y abra `http://localhost:5173/review/index.html`.
3. Ejecute `node --test tests/pilot/review-model.test.mjs`.
4. Detenga el servidor de vista previa y ejecute `./node_modules/.bin/playwright test --config playwright.review.config.ts` (en Windows, `playwright.cmd`). La prueba inicia su propio servidor sobre el build generado; requiere el puerto 5173 libre.

El sistema de CI existente debe ejecutar los tests de navegador explícitamente si se desea convertirlos en condición de integración. El material publicado en GitHub se añadirá al build de Vite dentro de `dist/review/`; cualquier vista previa remota requiere verificación de rutas, HTTPS, service worker y acceso.

## Evidencia local comunicada

Tres pruebas de Chromium aprobaron en la copia local el 24-09-2026: recarga offline sin llamadas al backend, borrado del historial y recorrido con teclado. El informe JSON comunicado tuvo SHA-256 `6E38BB02184E6F054FCEC3070A14F6A6FFD522473CA2105D784C06969E8B2E0E`; el informe original no está adjunto al PR. Lint y build local también aprobaron.

## Límites

Las preguntas no son Kolb, Felder–Silverman ni Kuder y no acreditan validez científica ni eficacia pedagógica. No registrar datos escolares ni presentar esta demostración como el MVP completo. Antes de pruebas con participantes hacen falta las aprobaciones del instrumento, la revisión del protocolo y la trazabilidad de respuestas. Los PR #12–#14 siguen separados; no se integran aquí. La copia local contiene otros cambios sin publicar y requiere reconciliación antes de fusionar ramas.

Utilice `FORMULARIO_REVISION.md` para recoger incidencias y propuestas sin datos de estudiantes.
