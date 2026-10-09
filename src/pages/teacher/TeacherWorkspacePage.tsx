import { useApiText } from "../../i18n/useApiText";
import { useSuiteText } from "../../i18n/useSuiteText";
import { StudentServiceStatusAlert } from "../../components/StudentServiceStatusAlert";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import PsychologyIcon from "@mui/icons-material/Psychology";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import SchoolIcon from "@mui/icons-material/School";
import type { StudentProfile } from "../../types/student";
import { fetchStudents } from "../../services/studentApi";
import { useI18n } from "../../i18n/I18nProvider";

const supportColor = (level: string): "success" | "warning" | "error" | "default" => {
  if (level === "LOW") return "success";
  if (level === "MEDIUM") return "warning";
  if (level === "HIGH") return "error";
  return "default";
};

export const TeacherWorkspacePage = () => {
  const ui = useSuiteText();
  const apiText = useApiText();
  const { t } = useI18n();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchStudents();
      setStudents(data);
    } catch {
      setError("STUDENTS_UNAVAILABLE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const highSupport = students.filter((student) => student.supportLevel === "HIGH").length;
  const mediumSupport = students.filter((student) => student.supportLevel === "MEDIUM").length;

  return (
    <Box>
      <StudentServiceStatusAlert />
      <Box
        sx={{
          mb: 3,
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background:
            "linear-gradient(135deg, rgba(37,99,235,.14), rgba(16,185,129,.14), rgba(124,58,237,.12))",
          border: "1px solid rgba(148,163,184,.25)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <GroupsIcon color="primary" sx={{ fontSize: 42 }} />
          <Chip label={ui("Teacher Decision Support")} color="primary" variant="outlined" />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1, fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
          {ui("Teacher Workspace")}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          {ui("Espacio docente para consultar estudiantes, perfiles de aprendizaje, niveles de apoyo, estrategias inclusivas y recomendaciones pedagógicas.")}
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
              <SchoolIcon color="primary" />
              <Typography fontWeight={900}>{ui("Estudiantes asignados")}</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
              {loading ? "..." : students.length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Diversity3Icon color="warning" />
              <Typography fontWeight={900}>{ui("Apoyo medio")}</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
              {loading ? "..." : mediumSupport}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PsychologyIcon color="error" />
              <Typography fontWeight={900}>{ui("Apoyo alto")}</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
              {loading ? "..." : highSupport}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>{ui("Cargando estudiantes...")}</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{t("teacher.studentsUnavailable")}</Alert>}

      {!loading && !error && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(3, 1fr)",
            },
            gap: 2.5,
          }}
        >
          {students.map((student) => (
            <Card
              key={student.id}
              sx={{
                height: "100%",
                borderRadius: 5,
                boxShadow: "0 16px 36px rgba(15,23,42,.09)",
                border: "1px solid rgba(148,163,184,.22)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={950}>
                      <span translate="no">{student.fullName}</span>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.id} {ui("· Grado")} {student.grade} · {student.age} {ui("años")}
                    </Typography>
                  </Box>

                  <Chip
                    label={ui(student.supportLevel)}
                    color={supportColor(student.supportLevel)}
                    sx={{ fontWeight: 900 }}
                  />
                </Stack>

                <Typography fontWeight={900} sx={{ mt: 2 }}>
                  {ui("Perfil de aprendizaje")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span translate="no">{apiText(student.learningProfile, student)}</span>
                </Typography>

                <Typography fontWeight={900} sx={{ mt: 2 }}>
                  {ui("Recomendaciones pedagógicas")}
                </Typography>

                <Stack spacing={1} sx={{ mt: 1 }}>
                  {student.pedagogicalRecommendations.slice(0, 3).map((item) => (
                    <Alert key={apiText(item, student)} severity="info" variant="outlined">
                      <span translate="no">{apiText(item, student)}</span>
                    </Alert>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

