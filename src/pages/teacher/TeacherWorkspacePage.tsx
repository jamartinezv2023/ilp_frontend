import { useEffect, useState } from "react";
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

const supportColor = (level: string): "success" | "warning" | "error" | "default" => {
  if (level === "LOW") return "success";
  if (level === "MEDIUM") return "warning";
  if (level === "HIGH") return "error";
  return "default";
};

export const TeacherWorkspacePage = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchStudents();
      setStudents(data);
    } catch {
      setError(
        "No fue posible cargar los estudiantes. Verifique que el backend esté activo en https://ilp-adaptive-education-service.onrender.com."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStudents();
  }, []);

  const highSupport = students.filter((student) => student.supportLevel === "HIGH").length;
  const mediumSupport = students.filter((student) => student.supportLevel === "MEDIUM").length;

  return (
    <Box>
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
          <Chip label="Teacher Decision Support" color="primary" variant="outlined" />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
          Teacher Workspace
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          Espacio docente para consultar estudiantes, perfiles de aprendizaje,
          niveles de apoyo, estrategias inclusivas y recomendaciones pedagógicas.
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
              <Typography fontWeight={900}>Estudiantes asignados</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950}>
              {loading ? "..." : students.length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Diversity3Icon color="warning" />
              <Typography fontWeight={900}>Apoyo medio</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950}>
              {loading ? "..." : mediumSupport}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PsychologyIcon color="error" />
              <Typography fontWeight={900}>Apoyo alto</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950}>
              {loading ? "..." : highSupport}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando estudiantes...</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}

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
                      {student.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.id} · Grado {student.grade} · {student.age} años
                    </Typography>
                  </Box>

                  <Chip
                    label={student.supportLevel}
                    color={supportColor(student.supportLevel)}
                    sx={{ fontWeight: 900 }}
                  />
                </Stack>

                <Typography fontWeight={900} sx={{ mt: 2 }}>
                  Perfil de aprendizaje
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {student.learningProfile}
                </Typography>

                <Typography fontWeight={900} sx={{ mt: 2 }}>
                  Recomendaciones pedagógicas
                </Typography>

                <Stack spacing={1} sx={{ mt: 1 }}>
                  {student.pedagogicalRecommendations.slice(0, 3).map((item) => (
                    <Alert key={item} severity="info" variant="outlined">
                      {item}
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

