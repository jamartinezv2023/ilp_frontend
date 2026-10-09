import { useEffect, useRef, useState } from "react";
import { LoginForm } from "../../src/features/auth/components/LoginForm";
import { useAppDispatch, useAppSelector } from "../../src/store/hooks";
import { authenticationFailed } from "../../src/features/auth/store/authSlice";
import { useI18n } from "../../src/i18n/I18nProvider";
import { authorizedScientificApi, type AuthorizedObservation } from "../../src/features/assessment-engine/services/authorizedScientificApi";
import { verifiedDraftScope } from "../../src/features/offline/verifiedDraftScope";
import { createSyntheticDraftStore, type DraftScope, type SyntheticDraft } from "../../src/features/offline/syntheticDraftStore";
import { synchronizeSyntheticDraft } from "../../src/features/offline/synchronizeSyntheticDraft";
import { prepareR9Shell, type OfflinePreparation } from "../../src/features/offline/prepareOfflineLab";
import { prepareDraftAccess, hasPreparedDraft, unlockPreparedDraft, saveLocallyUnlockedDraft, loadUnlockedDraft, lockPreparedDraft } from "../../src/features/offline/preparedDraftAccess";
import { OfflineDraftEditor } from "./OfflineDraftEditor";
const draftStore = createSyntheticDraftStore();

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
  const [online, setOnline] = useState(() => navigator.onLine);
  const [preparation, setPreparation] = useState<OfflinePreparation | "" | "preparing">("");
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  async function prepare() {
    setPreparation("preparing");
    setPreparation(await prepareR9Shell());
  }
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
    <button disabled={!online || preparation === "preparing"} onClick={() => void prepare()}>
      {en ? "Prepare offline screen" : "Preparar pantalla sin conexión"}
    </button>
    {preparation && <output data-testid="shell-preparation">{preparation === "ready"
      ? (en ? "Offline screen prepared. Synchronization requires an online login."
        : "Pantalla sin conexión preparada. Para sincronizar se requiere iniciar sesión en línea.")
      : preparation === "preparing" ? (en ? "Preparing…" : "Preparando…")
        : (en ? "Offline screen unavailable. Keep this page open." : "Pantalla sin conexión no disponible. Mantenga esta página abierta.")}</output>}
    {token ? <>
      <button onClick={() => dispatch(authenticationFailed(""))}>{en ? "End test session" : "Cerrar sesión de prueba"}</button>
      <Session key={token} token={token} />
    </> : online ? <LoginForm /> : <section aria-label={en ? "Locked offline screen" : "Pantalla sin conexión bloqueada"}>
      <h2>{en ? "No institutional session" : "Sin sesión institucional"}</h2>
      <p>{en ? "Use your device key to unlock a previously prepared draft. Synchronization requires an online login."
        : "Use su clave del dispositivo para desbloquear un borrador previamente preparado. Para sincronizar debe iniciar sesión en línea."}</p>
      <OfflineDraftEditor />
    </section>}
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
  const [scope, setScope] = useState<DraftScope>();
  const [draft, setDraft] = useState<SyntheticDraft>();
  const [localStatus, setLocalStatus] = useState<"" | "saved" | "recovered">("");
  const controller = useRef<AbortController | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [deviceKey, setDeviceKey] = useState("");
  const [deviceReady, setDeviceReady] = useState(false);
  const [encrypted, setEncrypted] = useState(false);
  const draftRef = useRef<SyntheticDraft | undefined>(undefined);
  draftRef.current = draft;
  useEffect(() => () => lockPreparedDraft(draftRef.current), []);
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
  useEffect(() => {
    if (!fixture) return;
    let active = true;
    verifiedDraftScope(token, fixture.assignmentId, fixture.assessmentVersion)
      .then(async value => {
        const encrypted = await hasPreparedDraft(fixtureKey);
        return { scope: value, encrypted, draft: encrypted ? undefined : await draftStore.load(value) };
      })
      .then(value => {
        if (!active) return;
        setScope(value.scope); setDraft(value.draft); setEncrypted(value.encrypted);
        setOption(value.draft?.answer ? `R9-${value.draft.answer}` : "");
        setLocalStatus(value.draft ? "recovered" : "");
      }, () => { if (active) setMessage("error"); });
    return () => { active = false; };
  }, [fixture, fixtureKey, token]);
  useEffect(() => {
    const active = new AbortController();
    controller.current = active;
    return () => active.abort();
  }, []);
  async function saveDraft() {
    if (!scope || !option || busy || submitted) return;
    setBusy(true); setMessage("");
    try {
      const saved = deviceReady && draft
        ? await saveLocallyUnlockedDraft(fixtureKey, draft, option === "R9-A" ? "A" : "B")
        : deviceReady && draft ? await saveLocallyUnlockedDraft(fixtureKey, draft, option === "R9-A" ? "A" : "B")
          : await draftStore.save(scope, draft?.revision ?? 0, option === "R9-A" ? "A" : "B");
      setDraft(saved); setLocalStatus("saved");
    } catch { setMessage("error"); }
    finally { setBusy(false); }
  }
  async function prepareAccess() {
    if (!draft) return;
    setBusy(true); setMessage("");
    try {
      if (await prepareR9Shell() !== "ready") throw new Error("SHELL_UNAVAILABLE");
      await prepareDraftAccess(token, fixtureKey, draft, deviceKey);
      setDeviceReady(true); setEncrypted(true);
    } catch { setMessage("error"); }
    finally { setDeviceKey(""); setBusy(false); }
  }
  async function unlockOnline() {
    if (!scope) return;
    setBusy(true); setMessage("");
    try {
      const recovered = await unlockPreparedDraft(fixtureKey, deviceKey);
      if (JSON.stringify(recovered.scope) !== JSON.stringify(scope)) {
        lockPreparedDraft(recovered); throw new Error("DRAFT_OWNER_MISMATCH");
      }
      setDraft(recovered); setOption(recovered.answer ? `R9-${recovered.answer}` : "");
      setDeviceReady(true); setLocalStatus("recovered");
    } catch { setMessage("error"); }
    finally { setDeviceKey(""); setBusy(false); }
  }
  async function submit() {
    if (!fixture || !scope || !option || busy || submitted || !controller.current) return;
    setLocalStatus("");
    await run(async () => {
      const saved = draft?.answer === (option === "R9-A" ? "A" : "B") ? draft
        : deviceReady && draft ? await saveLocallyUnlockedDraft(fixtureKey, draft, option === "R9-A" ? "A" : "B")
          : await draftStore.save(scope, draft?.revision ?? 0, option === "R9-A" ? "A" : "B");
      setDraft(saved);
      const result = await synchronizeSyntheticDraft(token, fixture, saved, locale, controller.current!.signal,
        deviceReady ? () => loadUnlockedDraft(fixtureKey, saved) : undefined);
      setHistory(result.history); setAnswer(result.csv); setSubmitted(true); setLocalStatus(""); setMessage("saved");
    });
  }
  return <section aria-label={en ? "Synthetic assessment" : "Evaluación sintética"}>
    <h2>{en ? "Synthetic assessment" : "Evaluación sintética"}</h2>
    <p translate="no">Synthetic High</p>
    <p translate="no" data-testid="assignment">{fixture?.assignmentId}</p>
    <p translate="no">{fixture?.assessmentCode} · {fixture?.assessmentVersion}</p>
    <fieldset disabled={busy || submitted || !scope || (encrypted && !deviceReady)}>
      <legend>{en ? "Choose a test response" : "Seleccione una respuesta de prueba"}</legend>
      {["A", "B"].map(value => <label key={value} style={{ display: "block" }}>
        <input type="radio" name="response" value={`R9-${value}`} checked={option === `R9-${value}`}
          onChange={event => { setOption(event.target.value); setLocalStatus(""); }} />
        {en ? `Synthetic response ${value}` : `Respuesta sintética ${value}`}
      </label>)}
    </fieldset>
    <p data-testid="draft-attempt" translate="no">{draft?.administrationId}</p>
    <button disabled={!scope || !option || busy || submitted} onClick={() => void saveDraft()}>
      {en ? "Save on this device" : "Guardar en este dispositivo"}
    </button>
    <p>{en ? "Use a separate device key. Encrypted drafts require this key even after an online login; there is no password reset for this test."
      : "Use una clave separada del dispositivo. El borrador cifrado requiere esta clave incluso tras iniciar sesión en línea; esta prueba no permite restablecerla."}</p>
    <label>{encrypted ? (en ? "Device key" : "Clave del dispositivo") : (en ? "Prepare device key (12+ characters)" : "Preparar clave del dispositivo (12+ caracteres)")}
      <input type="password" autoComplete="new-password" maxLength={128} value={deviceKey} onChange={event => setDeviceKey(event.target.value)} />
    </label>
    {encrypted ? <button disabled={!scope || deviceKey.length < 12 || busy || deviceReady}
      onClick={() => void unlockOnline()}>{en ? "Unlock local draft" : "Desbloquear borrador local"}</button>
      : <button disabled={!draft || deviceKey.length < 12 || busy || submitted}
        onClick={() => void prepareAccess()}>{en ? "Enable local unlocking" : "Habilitar desbloqueo local"}</button> }
    {deviceReady && <output data-testid="device-ready">{en ? "Local unlocking prepared. Keep your device key." : "Desbloqueo local preparado. Conserve su clave del dispositivo."}</output>}
    {localStatus && <output data-testid="local-draft-status">{localStatus === "saved"
      ? (en ? "Saved on this device. Not submitted." : "Guardado en este dispositivo. No enviado.")
      : (en ? "Local draft recovered. Server confirmation pending." : "Borrador local recuperado. Confirmación del servidor pendiente.")}</output>}
    <button disabled={!scope || !option || busy || submitted} onClick={() => void submit()}>
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
