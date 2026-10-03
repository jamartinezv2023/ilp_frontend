import { useRef, useState } from "react";
import { useI18n } from "../../src/i18n/I18nProvider";
import { buildScientificSubmission, type ScientificSession } from "../../src/features/assessment-engine/services/scientificApplication";

const words = {
  es: { title: "Aplicación científica sintética", start: "Iniciar aplicación", consent: "Confirmo el consentimiento de prueba", submit: "Enviar aplicación", confirmed: "Aplicación confirmada en historial", export: "Verificar dataset", csv: "Descargar CSV", manifest: "Descargar manifiesto", dictionary: "Descargar diccionario", failed: "No se pudo confirmar la aplicación. Conserve sus respuestas.", exportFailed: "No se pudo validar el dataset. Descargas bloqueadas.", denied: "Aplicación no autorizada o consentimiento inactivo. No se guardó el intento.", duplicate: "Esta aplicación ya existe. No se creó otra.", invalid: "Rankings inválidos. Use 1, 2, 3 y 4 una vez por grupo. No se guardó el intento.", timing: "Tiempo de aplicación incoherente. No se guardó el intento." },
  en: { title: "Synthetic scientific application", start: "Start application", consent: "I confirm the test consent", submit: "Submit application", confirmed: "Application confirmed in history", export: "Verify dataset", csv: "Download CSV", manifest: "Download manifest", dictionary: "Download dictionary", failed: "Application could not be confirmed. Keep your answers.", exportFailed: "Dataset validation failed. Downloads blocked.", denied: "Application unauthorized or consent inactive. This attempt was not saved.", duplicate: "This application already exists. No new record was created.", invalid: "Invalid ranks. Use 1, 2, 3 and 4 once per group. This attempt was not saved.", timing: "Inconsistent application timing. This attempt was not saved." },
};
type Snapshot = { csv: string; dictionary: string; manifest: { administrationId: string; participantId: string; assessmentVersion: string; dataClass: string; csvSha256: string; dictionarySha256: string; [key: string]: unknown } };
const hash = async (text: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))).map(value => value.toString(16).padStart(2, "0")).join("");
const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export function App() {
  const { locale, setLocale } = useI18n(); const w = words[locale];
  const [session, setSession] = useState<(ScientificSession & { accessToken: string; tenantId: string; grantId: string }) | null>(null);
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState("idle"); const [error, setError] = useState<keyof typeof words.es | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const started = useRef<Date | null>(null); const busy = useRef(false);
  const pending = useRef<ReturnType<typeof buildScientificSubmission> | null>(null);
  function authorizedFetch(input: string, init: RequestInit = {}) {
    if (!session) throw new Error("SCIENTIFIC_SESSION_REQUIRED");
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${session.accessToken}`);
    headers.set("X-Tenant-Id", session.tenantId);
    headers.set("X-Scientific-Grant", session.grantId);
    return fetch(input, { ...init, headers });
  }
  const start = async () => {
    if (busy.current) return; busy.current = true; setError(null);
    try { const response = await fetch("/test/session", { cache: "no-store" }); if (!response.ok) throw new Error();
      setSession(await response.json()); started.current = new Date(); setState("editing");
    } catch { setError("failed"); } finally { busy.current = false; }
  };
  const confirm = async () => {
    if (busy.current || !session || !started.current || !consent) return;
    busy.current = true; setState("busy"); setError(null);
    try {
      pending.current ??= buildScientificSubmission(session, ranks, locale, started.current, new Date());
      const response = await authorizedFetch("/api/v1/assessment-submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pending.current) });
      if (!response.ok && response.status !== 409) {
        setError(response.status === 403 ? "denied" : response.status === 400 ? "timing" : response.status === 422 ? "invalid" : "failed");
        pending.current = null; setState("editing"); return;
      }
      const historyResponse = await authorizedFetch(`/api/v1/participants/${session.researchSubjectId}/assessment-scientific-history`, { cache: "no-store" });
      if (!historyResponse.ok) throw new Error();
      const history = await historyResponse.json();
      const observations = history.observations as { administrationId: string; assessmentVersion: string }[];
      if (!observations.some(item => item.administrationId === session.administrationId && item.assessmentVersion === session.assessmentVersion)) throw new Error();
      const rawResponse = await authorizedFetch(`/api/v1/assessment-responses/${session.administrationId}`, { cache: "no-store" });
      if (!rawResponse.ok) throw new Error();
      const raw = await rawResponse.json();
      const expected = pending.current.responses.flatMap(question => Object.entries(question.rankings).map(([optionId, rank]) => ({ questionId: question.questionCode, optionId, rank })));
      const persisted = raw.answers as { questionId: string; optionId: string; score: number; value: string }[];
      const submitted = typeof raw.submittedAt === "number" ? raw.submittedAt * 1000 : Date.parse(raw.submittedAt);
      if (raw.studentId !== session.participantId || raw.assessmentCode !== session.assessmentCode || raw.assessmentVersion !== session.assessmentVersion || !Number.isFinite(submitted) || Math.abs(submitted - Date.parse(pending.current.submittedAt)) > 2 || persisted.length !== expected.length || expected.some(answer => !persisted.some(item => item.questionId === answer.questionId && item.optionId === answer.optionId && item.score === answer.rank && item.value === String(answer.rank)))) throw new Error();
      setState("confirmed"); if (response.status === 409) setError("duplicate");
    } catch { setError("failed"); setState("editing"); }
    finally { busy.current = false; }
  };
  const prepare = async () => {
    if (busy.current || !session) return; busy.current = true; setSnapshot(null); setError(null);
    try {
      const response = await authorizedFetch(`/test/snapshot/${session.administrationId}`, { cache: "no-store" });
      if (!response.ok) throw new Error(); const data: Snapshot = await response.json();
      if (data.manifest.administrationId !== session.administrationId || data.manifest.participantId !== session.researchSubjectId || data.manifest.assessmentVersion !== session.assessmentVersion || data.manifest.dataClass !== "SYNTHETIC_ONLY" || await hash(data.csv) !== data.manifest.csvSha256 || await hash(data.dictionary) !== data.manifest.dictionarySha256) throw new Error();
      const dictionary = JSON.parse(data.dictionary) as { timingSource: string; variables: { name: string }[] };
      if (data.manifest.schemaVersion !== "scientific-application-v1" || data.manifest.rows !== 48 || data.manifest.encoding !== "UTF-8" || data.manifest.lineEnding !== "LF" || !Array.isArray(data.manifest.columns) || data.manifest.columns.length !== 18 || dictionary.timingSource !== "CLIENT_REPORTED" || JSON.stringify(dictionary.variables.map(item => item.name)) !== JSON.stringify(data.manifest.columns)) throw new Error();
      setSnapshot(data);
    } catch { setError("exportFailed"); } finally { busy.current = false; }
  };
  return <main style={{ maxWidth: 850, margin: "auto", padding: 24 }}>
    <label>Idioma / Language <select aria-label="Language" value={locale} disabled={!!session} onChange={event => setLocale(event.target.value === "en" ? "en" : "es")}><option value="es">Español</option><option value="en">English</option></select></label>
    <h1>{w.title}</h1><p>SYNTHETIC_ONLY · TEST_ONLY · CLIENT_REPORTED</p>
    {!session && <button onClick={() => void start()}>{w.start}</button>}
    {session && <><p>{session.administrationId}</p>
      {session.questions.map((question, index) => <fieldset key={question.code} disabled={state === "busy" || state === "confirmed" || pending.current !== null}><legend>{index + 1}. {question.code}</legend>
        {question.options.map(option => <label key={option.id} style={{ display: "inline-block", padding: 8 }}>{option.dimension}<select aria-label={option.id} value={ranks[option.id] ?? ""} onChange={event => setRanks(current => ({ ...current, [option.id]: Number(event.target.value) }))}><option value="">—</option>{[1, 2, 3, 4].map(rank => <option key={rank} value={rank}>{rank}</option>)}</select></label>)}
      </fieldset>)}
      <label><input type="checkbox" checked={consent} disabled={state === "confirmed"} onChange={event => setConsent(event.target.checked)} />{w.consent}</label>
      <button disabled={!consent || state === "busy" || state === "confirmed"} onClick={() => void confirm()}>{w.submit}</button>
      {state === "confirmed" && <><p role="status">{w.confirmed}</p><button onClick={() => void prepare()}>{w.export}</button></>}
      <div>{(["csv", "manifest", "dictionary"] as const).map(kind => <button key={kind} disabled={!snapshot} onClick={() => snapshot && download(`${session.administrationId}.${kind === "csv" ? "csv" : `${kind}.json`}`, kind === "manifest" ? JSON.stringify(snapshot.manifest, null, 2) + "\n" : snapshot[kind])}>{w[kind]}</button>)}</div>
    </>}
    {error && <p role="alert">{w[error]}</p>}
  </main>;
}
