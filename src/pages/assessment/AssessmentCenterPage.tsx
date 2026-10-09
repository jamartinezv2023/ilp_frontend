import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";
import { fetchStudents } from "../../services/studentApi";
import { fetchKolbAssessmentHistory } from "../../services/assessmentApi";
import type { StudentProfile } from "../../types/student";
import type { KolbAssessmentResponse } from "../../types/assessment";

export const AssessmentCenterPage = () => {
  const { locale } = useI18n();
  const en = locale === "en";
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [studentId, setStudentId] = useState("");
  const [history, setHistory] = useState<KolbAssessmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    let active = true;
    void fetchStudents().then(data => {
      if (active) { setStudents(data); setStudentId(data[0]?.id ?? ""); }
    }).catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function loadHistory() {
    setHistory([]); setChecked(false); setError(false); setBusy(true);
    try { setHistory(await fetchKolbAssessmentHistory(studentId)); setChecked(true); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100 }}>
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">{en ? "Assessment center" : "Centro de evaluaciones"}</Typography>
      <Alert severity="warning">{en
        ? "Legacy submissions are disabled pending institutional and instrument approval. This page does not collect or submit answers."
        : "Los envíos antiguos están deshabilitados hasta aprobar la institución y el instrumento. Esta página no recoge ni envía respuestas."}</Alert>
      <Typography>{en
        ? "Kolb, Felder-Silverman and Kuder require an approved version, scoring manual, institutional assignment and versioned consent. Existing student profiles do not confirm a new assessment."
        : "Kolb, Felder-Silverman y Kuder requieren versión aprobada, manual de puntuación, asignación institucional y consentimiento versionado. Los perfiles existentes no confirman una evaluación nueva."}</Typography>
      <Button component={Link} to="/research/authorized" variant="outlined">{en ? "Authorized history and evidence" : "Historial y evidencia autorizados"}</Button>
      <Alert severity="info">{en
        ? "The authorized circuit requires a configured backend and valid identifiers. Local visualization does not activate it."
        : "El circuito autorizado requiere un backend configurado e identificadores válidos. La visualización local no lo activa."}</Alert>
      <Typography variant="h5">{en ? "Legacy Kolb history (read only)" : "Historial antiguo Kolb (solo lectura)"}</Typography>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{en ? "The service could not be verified. This is not an empty history." : "No se pudo verificar el servicio. Esto no equivale a un historial vacío."}</Alert>}
      {!loading && students.length === 0 && !error && <Typography>{en ? "No students available." : "No hay estudiantes disponibles."}</Typography>}
      {students.length > 0 && <>
        <TextField select label={en ? "Student" : "Estudiante"} value={studentId} disabled={busy} onChange={event => {
          setStudentId(event.target.value); setHistory([]); setChecked(false); setError(false);
        }}>{students.map(student => <MenuItem key={student.id} value={student.id}><span translate="no">{student.fullName} · {student.id}</span></MenuItem>)}</TextField>
        <Button variant="contained" disabled={busy || !studentId} onClick={() => void loadHistory()}>{en ? "Read history without submitting" : "Consultar historial sin enviar"}</Button>
      </>}
      {busy && <CircularProgress />}
      {checked && history.length === 0 && <Alert severity="info">{en ? "No legacy Kolb assessments were returned for this student." : "No se devolvieron evaluaciones antiguas Kolb para este estudiante."}</Alert>}
      <ul>{history.map(item => <li key={item.assessmentId}><span translate="no">{item.assessmentId} · {item.instrumentVersion} · {String(item.createdAt)}</span></li>)}</ul>
    </Stack>
  </Box>;
};
