import { useEffect, useState } from "react";
import { LoginForm } from "../../src/features/auth/components/LoginForm";
import { useAppDispatch, useAppSelector } from "../../src/store/hooks";
import { authenticationFailed } from "../../src/features/auth/store/authSlice";
import { useI18n } from "../../src/i18n/I18nProvider";
import { authorizedScientificApi, type AuthorizedObservation } from "../../src/features/assessment-engine/services/authorizedScientificApi";
import { ADAPTIVE_API_BASE_URL, TENANT_ID } from "../../src/config/apiConfig";

type Fixture = {
  assignmentId: string; participantId: string; researchParticipantUuid: string;
  consentId: string; consentVersion: string; assessmentCode: string; assessmentVersion: string;
  researchSubjectId: string; evidenceId: string;
};
export function IntegratedLab() {
  const { locale, setLocale } = useI18n();
  const token = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();
  const en = locale === "en";
  return <main style={{ maxWidth: 1000, margin: "auto", padding: 16, overflowWrap: "anywhere" }}>
    <h1>{en ? "Isolated integration test" : "Prueba de integración aislada"}</h1>
    <p>{en ? "Synthetic data only. This is not Kolb, Felder–Silverman or Kuder."
      : "Solo datos sintéticos. Esto no es Kolb, Felder–Silverman ni Kuder."}</p>
    <label>{en ? "Test language" : "Idioma de prueba"}
      <select aria-label={en ? "Test language" : "Idioma de prueba"} value={locale}
        onChange={event => setLocale(event.target.value === "en" ? "en" : "es")}>
        <option value="es">Español</option><option value="en">English</option>
      </select>
    </label>
    {token ? <>
      <button onClick={() => dispatch(authenticationFailed(""))}>{en ? "End test session" : "Cerrar sesión de prueba"}</button>
      <Session key={token} token={token} />
    </> : <LoginForm />}
  </main>;
}
function Session({ token }: { token: string }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const [fixtures, setFixtures] = useState<Record<string, Fixture> | null>(null);
  const [option, setOption] = useState("");
  const [history, setHistory] = useState<AuthorizedObservation[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<"" | "saved" | "error">("");
  const [started] = useState(() => new Date());
  const [administration] = useState(() => crypto.randomUUID());
  const [submitted, setSubmitted] = useState(false);
  const [fixtureKey] = useState(() => new URLSearchParams(location.search).get("fixture") ?? "es360");
  const fixture = fixtures?.[fixtureKey];
  useEffect(() => {
    const controller = new AbortController();
    fetch("/r9-fixture.json", { signal: controller.signal, cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error("FIXTURE_UNAVAILABLE"); return response.json(); })
      .then((value: Record<string, Fixture>) => setFixtures(value))
      .catch(() => { if (!controller.signal.aborted) setMessage("error"); });
    return () => controller.abort();
  }, []);
  const api = authorizedScientificApi(token);
  async function run(action: () => Promise<void>) {
    setHistory([]); setAnswer(""); setMessage(""); setBusy(true);
    try { await action(); }
    catch { setHistory([]); setAnswer(""); setMessage("error"); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (!fixture || !option || busy || submitted) return;
    await run(async () => {
      const time = new Date();
      const body = {
        administrationId: administration, participantId: fixture!.participantId,
        researchParticipantUuid: fixture!.researchParticipantUuid,
        assessmentCode: fixture!.assessmentCode, assessmentVersion: fixture!.assessmentVersion,
        responses: [{ questionCode: "Q1", selectedOptionIds: [option], rankings: {}, numericValue: null, textValue: null }],
        submittedAt: time.toISOString(), context: {
          source: "R9_ISOLATED", fieldworkPhase: "TEST_ONLY", language: locale,
          translationVersion: "r9-test", consentId: fixture!.consentId, consentVersion: fixture!.consentVersion,
          startedAt: started.toISOString(), durationSeconds: String(Math.floor((time.getTime() - started.getTime()) / 1000)),
          timingSource: "CLIENT_REPORTED",
        },
      };
      const response = await fetch(`${ADAPTIVE_API_BASE_URL}/api/v1/assessment-submissions`, {
        method: "POST", cache: "no-store", headers: {
          "Content-Type": "application/json", Authorization: `Bearer ${token}`,
          "X-Tenant-Id": TENANT_ID, "X-Scientific-Grant": fixture!.assignmentId,
        }, body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("SUBMISSION_FAILED");
      const result = await response.json() as { administrationId: string; status: string; persistedAnswerCount: number };
      if (result.administrationId !== administration || result.status !== "COMPLETED" || result.persistedAnswerCount !== 1) {
        throw new Error("PERSISTENCE_NOT_CONFIRMED");
      }
      // A POST acknowledgement alone is insufficient: recover the same attempt and verify its snapshot.
      const recovered = await api.history(fixture!.assignmentId);
      const row = recovered.find(value => value.administrationId === administration);
      if (!row) throw new Error("HISTORY_NOT_CONFIRMED");
      const snapshot = await api.snapshot(fixture!.assignmentId, row);
      if (!snapshot.csv.includes(option)) throw new Error("ANSWER_NOT_CONFIRMED");
      setHistory(recovered); setAnswer(snapshot.csv); setSubmitted(true); setMessage("saved");
    });
  }
  return <section aria-label={en ? "Synthetic assessment" : "Evaluación sintética"}>
    <h2>{en ? "Synthetic assessment" : "Evaluación sintética"}</h2>
    <p translate="no">Synthetic High</p>
    <p translate="no" data-testid="assignment">{fixture?.assignmentId}</p>
    <p translate="no">{fixture?.assessmentCode} · {fixture?.assessmentVersion}</p>
    <fieldset disabled={busy || submitted || !fixture}>
      <legend>{en ? "Choose a test response" : "Seleccione una respuesta de prueba"}</legend>
      {["A", "B"].map(value => <label key={value} style={{ display: "block" }}>
        <input type="radio" name="response" value={`R9-${value}`} checked={option === `R9-${value}`}
          onChange={event => setOption(event.target.value)} />
        {en ? `Synthetic response ${value}` : `Respuesta sintética ${value}`}
      </label>)}
    </fieldset>
    <button disabled={!fixture || !option || busy || submitted} onClick={() => void submit()}>
      {en ? "Submit test response" : "Enviar respuesta de prueba"}
    </button>
    <button disabled={!fixture || busy} onClick={() => void run(async () => setHistory(await api.history(fixture!.assignmentId)))}>
      {en ? "Load history" : "Consultar historial"}
    </button>
    {busy && <p role="status">{en ? "Verifying…" : "Verificando…"}</p>}
    {message === "saved" && <p role="status">{en ? "Response saved and recovered." : "Respuesta guardada y recuperada."}</p>}
    {message === "error" && <p role="alert">{en ? "Access denied or verification failed." : "Acceso denegado o verificación fallida."}</p>}
    <ul data-testid="history">{history.map(row => <li key={row.administrationId}>
      <code>{row.administrationId}</code> · <code>{row.assessmentCode}</code> · <code>{row.assessmentVersion}</code>
      <button disabled={busy} onClick={() => void run(async () => {
        const snapshot = await api.snapshot(fixture!.assignmentId, row);
        setHistory([row]); setAnswer(snapshot.csv);
      })}>{en ? "Verify answers" : "Verificar respuestas"}</button>
    </li>)}</ul>
    {answer && <pre data-testid="answers" translate="no" style={{ whiteSpace: "pre-wrap" }}>{answer}</pre>}
  </section>;
}
