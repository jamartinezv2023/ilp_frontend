import { useEffect, useState } from "react";
import { useI18n } from "../../src/i18n/I18nProvider";

type Manifest = {
  schemaVersion: string;
  dataClass: string;
  instrumentCode: string;
  storedVersion: string;
  assessmentId: string;
  participantId: string;
  records: number;
  answers: number;
  encoding: string;
  lineEnding: string;
  csvSha256: string;
  columns: string[];
};
type Snapshot = { csv: string; manifest: Manifest };
const words = {
  es: { prepare: "Preparar dataset sintético", csv: "Descargar CSV", manifest: "Descargar manifiesto",
    ready: "Dataset sintético verificado.", error: "No se pudo validar el dataset. No se descargó ningún archivo." },
  en: { prepare: "Prepare synthetic dataset", csv: "Download CSV", manifest: "Download manifest",
    ready: "Synthetic dataset verified.", error: "Dataset validation failed. No file was downloaded." },
};
export function DatasetDownload({ assessmentId }: { assessmentId: string | null }) {
  const { locale } = useI18n();
  const text = words[locale];
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "ready" | "error">("idle");
  useEffect(() => { setSnapshot(null); setStatus("idle"); }, [assessmentId]);
  async function prepare() {
    setSnapshot(null);
    setStatus("busy");
    try {
      const response = await fetch(`/test/kolb-dataset/${encodeURIComponent(assessmentId ?? "")}`,
        { cache: "no-store" });
      if (!response.ok) throw new Error("Rejected snapshot");
      const candidate: Snapshot = await response.json();
      const m = candidate.manifest;
      if (typeof candidate.csv !== "string" || !m || m.assessmentId !== assessmentId ||
          m.participantId !== "SYNTHETIC-STUDENT-001" || m.dataClass !== "SYNTHETIC_ONLY" ||
          m.schemaVersion !== "kolb-synthetic-wide-v1" || m.instrumentCode !== "KOLB_V1" ||
          m.storedVersion !== "KOLB_BASELINE_V1" || m.records !== 1 || m.answers !== 48 ||
          m.encoding !== "UTF-8" || m.lineEnding !== "LF" || !Array.isArray(m.columns) ||
          m.columns.length !== 58 || candidate.csv.split("\n")[0] !== m.columns.join(",")) {
        throw new Error("Invalid manifest");
      }
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(candidate.csv));
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      if (hash !== m.csvSha256) throw new Error("Checksum mismatch");
      setSnapshot(candidate);
      setStatus("ready");
    } catch { setStatus("error"); }
  }
  function download(kind: "csv" | "manifest") {
    if (!snapshot || status !== "ready") return;
    const blob = new Blob([kind === "csv" ? snapshot.csv : JSON.stringify(snapshot.manifest, null, 2) + "\n"],
      { type: kind === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${snapshot.manifest.assessmentId}.${kind === "csv" ? "csv" : "manifest.json"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section aria-label={locale === "es" ? "Dataset sintético" : "Synthetic dataset"}>
    <button disabled={!assessmentId || status === "busy"} onClick={() => void prepare()}>{text.prepare}</button>
    <button disabled={!snapshot || status !== "ready"} onClick={() => download("csv")}>{text.csv}</button>
    <button disabled={!snapshot || status !== "ready"} onClick={() => download("manifest")}>{text.manifest}</button>
    {status === "ready" && <p role="status">{text.ready}</p>}
    {status === "error" && <p role="alert">{text.error}</p>}
  </section>;
}
