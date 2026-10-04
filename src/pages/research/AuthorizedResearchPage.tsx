import { useState } from "react";
import { useAppSelector } from "../../store/hooks";
import { useI18n } from "../../i18n/I18nProvider";
import { authorizedScientificApi, type AuthorizedObservation, type AuthorizedSnapshot } from "../../features/assessment-engine/services/authorizedScientificApi";

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function AuthorizedResearchPage() {
  const token = useAppSelector(state => state.auth.accessToken);
  return token ? <AuthorizedResearchSession key={token} token={token} /> : <p role="status">Inicie sesión / Sign in</p>;
}
function AuthorizedResearchSession({ token }: { token: string }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const [assignment, setAssignment] = useState("");
  const [evidence, setEvidence] = useState("");
  const [history, setHistory] = useState<AuthorizedObservation[]>([]);
  const [snapshot, setSnapshot] = useState<AuthorizedSnapshot | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>) {
    setSnapshot(null); setMessage(""); setBusy(true);
    try { await action(); }
    catch { setHistory([]); setMessage(en ? "Access denied or verification failed. No download is available." : "Acceso denegado o verificación fallida. No hay descarga disponible."); }
    finally { setBusy(false); }
  }
  const api = authorizedScientificApi(token);
  async function downloadCurrent(kind: "csv" | "manifest") {
    if (!snapshot) return;
    const observation = history.find(row => row.administrationId === snapshot.manifest.administrationId);
    if (!observation) throw new Error("SNAPSHOT_NOT_CURRENT");
    const current = await api.snapshot(assignment, observation);
    if (kind === "csv") download(current.csv, "authorized-answers.csv", "text/csv;charset=utf-8");
    else download(JSON.stringify(current.manifest, null, 2), "authorized-manifest.json", "application/json");
    setSnapshot(current);
  }
  return <section>
    <h2>{en ? "Authorized research" : "Investigación autorizada"}</h2>
    <label>{en ? "Institutional assignment ID" : "Identificador de asignación institucional"}
      <input value={assignment} disabled={busy} onChange={event => { setAssignment(event.target.value.trim()); setHistory([]); setSnapshot(null); }} />
    </label>
    <button disabled={busy || !assignment} onClick={() => void run(async () => setHistory(await api.history(assignment)))}>{en ? "Load history" : "Consultar historial"}</button>
    <p role="status" aria-live="polite">{message}</p>
    <ul>{history.map(observation => <li key={observation.administrationId}>
      {observation.assessmentCode} · {observation.assessmentVersion} · {observation.submittedAt}
      <button disabled={busy} onClick={() => void run(async () => {
        const verified = await api.snapshot(assignment, observation);
        setSnapshot(verified); setEvidence(verified.manifest.consentEvidenceId);
      })}>{en ? "Verify dataset" : "Verificar dataset"}</button>
    </li>)}</ul>
    {snapshot && <div>
      <p>SHA-256: <code>{snapshot.manifest.sha256}</code></p>
      <button disabled={busy} onClick={() => void run(() => downloadCurrent("csv"))}>CSV</button>
      <button disabled={busy} onClick={() => void run(() => downloadCurrent("manifest"))}>{en ? "Manifest" : "Manifiesto"}</button>
    </div>}
    <h3>{en ? "Withdraw consent" : "Retirar consentimiento"}</h3>
    <p>{en ? "Use your acceptance evidence ID. Withdrawal blocks future submission, history and export through this circuit." : "Use el identificador de su evidencia de aceptación. El retiro bloquea nuevos envíos, historial y exportación en este circuito."}</p>
    <label>{en ? "Acceptance evidence ID" : "Identificador de evidencia de aceptación"}
      <input value={evidence} disabled={busy} onChange={event => setEvidence(event.target.value.trim())} />
    </label>
    <button disabled={busy || !evidence} onClick={() => {
      if (window.confirm(en ? "Confirm consent withdrawal?" : "¿Confirma el retiro del consentimiento?")) void run(async () => {
        await api.withdraw(evidence); setHistory([]);
        setMessage(en ? "Consent withdrawn." : "Consentimiento retirado.");
      });
    }}>{en ? "Withdraw consent" : "Retirar consentimiento"}</button>
  </section>;
}
