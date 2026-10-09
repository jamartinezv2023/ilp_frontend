import { useApiText } from "../../i18n/useApiText";
import { useSuiteText } from "../../i18n/useSuiteText";
import { StudentServiceStatusAlert } from "../../components/StudentServiceStatusAlert";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PsychologyIcon from "@mui/icons-material/Psychology";
import GroupsIcon from "@mui/icons-material/Groups";
import type { StudentProfile } from "../../types/student";
import { useI18n } from "../../i18n/I18nProvider";
import { fetchStudents } from "../../services/studentApi";

const supportColor = (level: string): "success" | "warning" | "error" | "default" => {
  if (level === "LOW") return "success";
  if (level === "MEDIUM") return "warning";
  if (level === "HIGH") return "error";
  return "default";
};

export const InclusionPiarPage = () => {
  const ui = useSuiteText();
  const apiText = useApiText();
  const { t, locale } = useI18n();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      setStudents([]);
      const data = await fetchStudents();
      setStudents(data);
    } catch {
      setError("No fue posible cargar información de inclusión desde el backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStudents();
  }, []);

  const highSupport = students.filter((student) => student.supportLevel === "HIGH");
  const mediumSupport = students.filter((student) => student.supportLevel === "MEDIUM");
  const piarCandidates = [...highSupport, ...mediumSupport];
  let monitoredCount: string | number = "...";
  let priorityCount: string | number = "...";
  let supportShare = "...";
  if (!loading) {
    monitoredCount = "—";
    priorityCount = "—";
    supportShare = "—";
    if (!error) {
      monitoredCount = students.length;
      priorityCount = piarCandidates.length;
      if (students.length > 0) {
        supportShare = `${Math.round((piarCandidates.length / students.length) * 100)}%`;
      }
    }
  }

  return (
    <Box>
      <StudentServiceStatusAlert />
      <Box
        sx={{
          mb: 3,
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background:
            "linear-gradient(135deg, rgba(16,185,129,.16), rgba(37,99,235,.12), rgba(124,58,237,.12))",
          border: "1px solid rgba(148,163,184,.25)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Diversity3Icon color="success" sx={{ fontSize: 42 }} />
          <Chip label={ui("Inclusive Education Support")} color="success" variant="outlined" />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1, fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
          {ui("Inclusion & PIAR Center")}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          {ui("Centro de apoyo para equipos de inclusión, orientación y directivos. Permite identificar estudiantes que requieren seguimiento, estrategias inclusivas, ajustes razonables y acciones asociadas al PIAR.")}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },
          gap: 2.5,
          mb: 3,
        }}
      >
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GroupsIcon color="primary" />
              <Typography fontWeight={900}>{ui("Estudiantes monitoreados")}</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
              {monitoredCount}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PsychologyIcon color="warning" />
              <Typography fontWeight={900}>{ui("Seguimiento prioritario")}</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
              {priorityCount}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AssignmentIcon color="success" />
              <Typography fontWeight={900}>{t("inclusion.supportShare")}</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
              {supportShare}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card
        sx={{
          mb: 3,
          borderRadius: 5,
          boxShadow: "0 18px 45px rgba(15,23,42,.09)",
          border: "1px solid rgba(148,163,184,.22)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={950} sx={{ mb: 2 }}>
            {ui("Estado de preparación institucional")}
          </Typography>

          <Alert severity="info">{t("inclusion.readinessUnavailable")}</Alert>
        </CardContent>
      </Card>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>{ui("Cargando información de inclusión...")}</Typography>
        </Stack>
      )}

      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              onClick={() => void loadStudents()}
              disabled={loading}
            >
              {locale === "es" ? "Reintentar" : "Retry"}
            </Button>
          }
        >
          {ui(error)}
        </Alert>
      )}
      {!loading && !error && students.length === 0 && (
        <Alert severity="info" role="status">
          {locale === "es"
            ? "No hay estudiantes disponibles en la respuesta del servicio."
            : "No students are available in the service response."}
        </Alert>
      )}

      {!loading && !error && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2, 1fr)",
            },
            gap: 2.5,
          }}
        >
          {piarCandidates.map((student) => (
            <Card
              key={student.id}
              sx={{
                borderRadius: 5,
                boxShadow: "0 16px 36px rgba(15,23,42,.09)",
                border: "1px solid rgba(148,163,184,.22)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={950} translate="no">
                      <span translate="no">{student.fullName}</span>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <span translate="no">{student.id}</span> {ui("· Grado")} <span translate="no">{student.grade}</span> {ui("· Perfil:")} <span translate="no">{apiText(student.learningProfile, student)}</span>
                    </Typography>
                  </Box>

                  <Chip
                    translate="no"
                    label={ui(student.supportLevel)}
                    color={supportColor(student.supportLevel)}
                    sx={{ fontWeight: 900 }}
                  />
                </Stack>

                <Typography fontWeight={900} sx={{ mt: 2 }}>
                  {ui("Estrategias inclusivas sugeridas")}
                </Typography>

                <Stack spacing={1} sx={{ mt: 1 }}>
                  {student.inclusiveStrategies.map((strategy) => (
                    <Alert key={apiText(strategy, student)} severity="success" variant="outlined" translate="no">
                      {apiText(strategy, student)}
                    </Alert>
                  ))}
                </Stack>

                <Typography fontWeight={900} sx={{ mt: 2 }}>
                  {ui("Acción institucional recomendada")}
                </Typography>

                <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                  {ui("Revisar necesidad de ajustes razonables, documentar evidencia pedagógica y definir seguimiento con equipo de inclusión.")}
                </Alert>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

