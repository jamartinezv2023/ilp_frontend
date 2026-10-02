import { useState } from "react";
import { DatasetDownload } from "./DatasetDownload";
import { createRoot } from "react-dom/client";
import { I18nProvider, useI18n } from "../../src/i18n/I18nProvider";
import { KolbRealForm } from "../../src/pages/assessment/components/KolbRealForm";
export function Lab() {
  const { locale, setLocale } = useI18n();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  return <><select aria-label="Language" value={locale} onChange={event => setLocale(event.target.value === "en" ? "en" : "es")}><option value="es">Español</option><option value="en">English</option></select><KolbRealForm studentId="SYNTHETIC-STUDENT-001" onCompleted={result => setAssessmentId(result.assessmentId)} /><DatasetDownload assessmentId={assessmentId} /></>;
}
createRoot(document.getElementById("root")!).render(<I18nProvider><Lab /></I18nProvider>);
