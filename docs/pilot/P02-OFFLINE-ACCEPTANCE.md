# P02 — Continuidad offline del piloto: inspección y criterios de aceptación

Estado: especificación preparada; funcionalidad offline todavía no implementada ni acreditada.
Fecha: 9 de octubre de 2026 (UTC).
Referencia frontend: `6b991a5114daf5c8c1dbdc0eab2636b7fd31fdec`.
Referencia backend fijada por R9: `e9fe737d146663a3f7ccc4640fee358446a8aeba`.

## Objetivo y límites

Demostrar con datos sintéticos: abrir online, preparar un formulario identificado, responder offline, cerrar y reabrir el navegador, recuperar el borrador, reconectar, autenticarse y autorizar el envío, confirmar su persistencia y recuperar las mismas respuestas en historial.

El primer acceso, la descarga inicial, el inicio de sesión real y la autorización del servidor requieren conexión. Trabajar offline no prueba que una autorización o un consentimiento sigan vigentes. El piloto no acredita Kolb, Felder–Silverman o Kuder originales, validación psicométrica, trabajo de campo, funcionamiento productivo ni sincronización con Neon. Neon se abordará después en un entorno separado.

## Evidencia de la inspección

| Componente | Comportamiento observado | Consecuencia para P02 |
|---|---|---|
| `e2e/integrated-r9/IntegratedLab.tsx` | Respuesta, fixture, estado y UUID de administración en estado React; el UUID se genera al montar la sesión. | Recargar pierde el borrador y cambia el intento. Persistir ambos antes de habilitar el trabajo offline. |
| Misma sesión R9 | `submitted` se activa tras POST, historial y snapshot confirmados. El tratamiento general de errores no conserva un estado explícito de entrega incierta. | Una confirmación perdida debe mantener el intento bloqueado y pendiente de conciliación. |
| Fixture R9 | Se consulta con `cache: no-store`. | El laboratorio actual no acredita una descarga durable del formulario. |
| `src/features/auth/store/authSlice.ts` | Access token en Redux; restauración mediante refresh online. | Conservar esta separación: no guardar tokens ni contraseñas en borradores o Cache Storage. |
| `authorizedScientificApi.ts` | Historial y snapshot sin caché; comprobación de hash y metadatos del snapshot. | Reutilizar la verificación autorizada para confirmar las respuestas; no sustituirla por un aviso local. |
| `ScientificProductionService` del backend fijado | Autoriza actor, institución, asignación y consentimiento; comprueba permisos para envío, lectura y exportación. | Mantener autorización actual en cada operación de sincronización. |
| `SubmitAssessmentService.validateIdempotency` | Un administrationId existente se rechaza con conflicto. | No tratar un 409 como éxito ni cambiar UUID para evitar el conflicto. Conciliar identidad y respuestas. |
| Recursos inspeccionados del frontend | No se encontró almacenamiento IndexedDB ni registro de service worker en el circuito revisado. | La continuidad offline requiere nuevos componentes y pruebas; un manifest o el bundle dividido no la acredita. |

Esta inspección se limita al circuito de respuestas, autenticación y recursos offline revisados; no constituye una auditoría completa de toda la plataforma ni una prueba de concurrencia del backend.

## Decisiones del incremento

1. Mantener R9 sin cambios como regresión de referencia. Crear una superficie P02 aislada para el formulario sintético y componentes reutilizables bajo `src/features/offline/`.
2. IndexedDB para formulario descargado, borrador, intento y estado de conciliación. El almacenamiento confirmado debe preceder al mensaje «Guardado en este dispositivo». Un fallo de cuota, permiso o escritura debe mostrarse sin afirmar que el borrador quedó guardado.
3. Vincular cada registro a institución, identidad estable del usuario, asignación, instrumento y versión. La fuente de identidad estable debe comprobarse en el contrato de autenticación antes de implementarla; el correo visible no basta para acreditar autorización.
4. Mantener el administrationId al recuperar, sincronizar o reintentar el mismo intento. Congelar el payload al ponerlo en cola. Una modificación posterior exige una acción explícita y no puede sustituir silenciosamente un envío incierto.
5. Service worker limitado al ámbito P02 y a recursos estáticos versionados. Descargar ES/EN antes de declarar disponibilidad. No cachear login, refresh, tokens, historial, snapshots o respuestas personales del API.
6. Sincronización explícita al recuperar conexión. No depender de Background Sync: debe funcionar con la aplicación abierta mediante el botón «Sincronizar / Sync». `navigator.onLine` solo es una señal; la respuesta real del servidor determina el resultado.
7. Antes de repetir un POST incierto, consultar historial y comprobar el snapshot autorizado del mismo intento y sus respuestas. Si no hay prueba concluyente, conservar «Entrega incierta» y bloquear la repetición. Un 409 aislado no confirma persistencia correcta.
8. Control de exclusión entre pestañas mediante transacciones del almacenamiento local, complementado por la protección del servidor. Comprobar concurrencia real: un bloqueo de botón en una sola pestaña no demuestra ausencia de duplicados.
9. Mostrar «Borrador local», «Pendiente de sincronizar», «Verificando», «Entrega incierta», «Requiere iniciar sesión», «Acceso rechazado» y «Confirmado en historial» en ES/EN. Ningún estado local se presenta como confirmación del servidor.
10. Los datos de esta fase serán exclusivamente sintéticos. IndexedDB no garantiza conservación ante borrado del navegador, modo privado o expulsión de almacenamiento; probar cierres normales y comunicar los errores observados.

## Criterios verificables

| ID | Escenario | Resultado exigido y evidencia |
|---|---|---|
| P02-01 | Preparación online | Formulario sintético identificado por código, versión, idioma y hash; recursos necesarios descargados y verificados antes de declarar «Disponible offline». |
| P02-02 | Corte de conexión | No se ejecuta POST offline. La persona responde y recibe confirmación local únicamente después de una escritura durable. |
| P02-03 | Cierre y reapertura | Nuevo contexto de navegador con el mismo perfil: formulario, respuestas y administrationId recuperados sin red. No basta `page.reload()` para acreditar el cierre del navegador. |
| P02-04 | Cambio ES/EN | Etiquetas del idioma elegido; no cambian identificadores, respuestas, versión del formulario ni payload congelado. Registrar el idioma de aplicación de forma explícita. |
| P02-05 | Reconexion y autorización | Se exige sesión online vigente y autorización real; token expirado, permiso revocado o consentimiento retirado impiden el envío sin borrar el borrador. |
| P02-06 | Confirmación completa | POST aceptado, mismo administrationId en historial y snapshot íntegro con las mismas respuestas. Solo entonces mostrar «Confirmado». |
| P02-07 | POST aceptado, respuesta perdida | El intento queda incierto; al reconectar se concilia con historial. No se genera otro UUID ni se envía otra administración. |
| P02-08 | Historial o snapshot fallidos | No se muestra éxito. Se conserva el intento y se permite verificar de nuevo mediante GET autorizado. |
| P02-09 | Conflicto 409 | Comparar el intento existente y su snapshot autorizado. Si no coincide o no puede comprobarse, bloquear y mostrar el conflicto. |
| P02-10 | Dos pestañas sincronizan | Un único intento persistido; ambas pestañas convergen al mismo resultado. Verificar conteo en el entorno aislado, no solo número de botones pulsados. |
| P02-11 | Usuario o institución distintos | No se muestran ni envían borradores de otra identidad. No se acepta cambiar el contexto almacenado para eludir permisos. |
| P02-12 | Almacenamiento no disponible | Error ES/EN claro; no afirmar guardado ni disponibilidad offline. El contenido actualmente escrito no desaparece de la vista por el error. |
| P02-13 | Actualización de la aplicación | Un borrador pendiente conserva su versión de formulario y contrato; incompatibilidad explícita y recuperable, sin reemplazo silencioso. |
| P02-14 | Regresión | R9, suite bilingüe, inclusión, lint, tipos, unitarias, cobertura y Sonar aprobados sobre el SHA exacto del nuevo PR y, tras autorizar merge, sobre el SHA integrado. |

Matriz inicial: ES/EN × anchos 360/768/1440; Chromium en CI y comprobación adicional en dispositivos/navegadores de evaluación disponibles antes del piloto remoto. No atribuir compatibilidad con todos los navegadores a una sola ejecución Chromium.

## Secuencia de implementación

- P02-A: almacenamiento durable y recuperación del borrador sintético; pruebas de identidad, versión, errores de almacenamiento y conservación del intento. Sin envío automático ni despliegue.
- P02-B: recursos offline versionados y reapertura del navegador; pruebas con red desconectada y service worker real (las suites actuales lo bloquean).
- P02-C: conciliación y sincronización autorizadas contra H2 aislada con escritura; respuesta perdida, 401/403/409, retirada de consentimiento y concurrencia entre pestañas.
- P02-D: integración revisada, evidencia por SHA, guía de evaluación y posterior preparación del entorno remoto separado. Las 46 incidencias de Sonar quedan en seguimiento paralelo y requieren su listado detallado.

Cada entrega tendrá PR separado, alcance concreto y pruebas relevantes. No se fusiona ni se despliega por el mero hecho de redactar esta especificación. La referencia validada permanece identificada para comparar regresiones.

## Evidencia a conservar

SHA frontend y backend, configuración sin secretos, resultados JUnit, trazas y capturas de errores, identificador del intento, hash del payload sintético, conteo de administraciones y respuestas, cronología de desconexión/reapertura/sincronización y resultado de historial/snapshot. Las evidencias de CI no deben incluir tokens, cookies, contraseñas ni datos de estudiantes.

La fase se considera terminada cuando el recorrido completo y los casos de fallo están acreditados; guardar un formulario en el navegador, por sí solo, no cierra P02.

## P02-A implementation candidate

A separate synthetic laboratory (`p02.html`) implements explicit IndexedDB draft saving and recovery. Records are partitioned by synthetic owner, tenant, assignment and instrument version. A committed draft retains its administration UUID; optimistic revisions reject stale writes. No access tokens, passwords or personal responses are included in the schema.

The laboratory does not perform authentication or submission. The current login response lacks a stable user identifier, so real account binding is a prerequisite for the following phase. P02-A does not enable offline page reopening or synchronization, and browser storage can be removed by the user or browser.

Validation: unit tests exercise commit confirmation, corruption, quota failure, concurrency and scope isolation. The P02 browser workflow checks native IndexedDB recovery after reload and in another tab, ES/EN at 360/768/1440 pixels, identity separation, online browser restart, unavailable storage and absence of POST submissions. These checks do not prove a service worker, offline browser restart or production persistence.

Local review: `npx vite build --config vite.p02.config.ts` then `npx vite preview --config vite.p02.config.ts --host 127.0.0.1 --port 5188 --strictPort`; open `http://127.0.0.1:5188/p02.html`. Automated browser review: `npx playwright test --config playwright.p02-draft.config.ts`.

## P02-B implementation candidate

The synthetic laboratory now prepares a service worker with scope `/p02.html`. Installation caches only the build-generated HTML and static asset allowlist, using requests without credentials. API URLs, POST requests and the maintained application's root page are not handled by this worker. Readiness requires an active worker and verification that its complete cache remains available. An initial offline visit without preparation cannot open the laboratory.

New releases wait for existing laboratory clients to close; activation removes only older `ilp-p02-lab-` caches. Draft UUIDs and instrument versions remain independent of cache revisions. Normal-profile offline browser restart, ES/EN draft recovery and offline editing, missing-cache detection, request boundaries and waiting-update activation have dedicated native Chromium checks.

This candidate does not provide offline authentication, real-account binding, synchronization or school collection. Browser deletion, private-mode cleanup and origin/profile changes can remove or separate cached content and drafts. HTTPS is required outside the localhost test origin. The maintained application is not converted into an offline application by this laboratory.
