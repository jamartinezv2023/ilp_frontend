import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PsychologyIcon from "@mui/icons-material/Psychology";
import GroupsIcon from "@mui/icons-material/Groups";
import type { StudentProfile } from "../../types/student";
import { fetchStudents } from "../../services/studentApi";

const supportColor = (level: string): "success" | "warning" | "error" | "default" => {
  if (level === "LOW") return "success";
  if (level === "MEDIUM") return "warning";
  if (level === "HIGH") return "error";
  return "default";
};

export const InclusionPiarPage = () => {
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

  return (
    <Box>
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
          <Chip label="Inclusive Education Support" color="success" variant="outlined" />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
          Inclusion & PIAR Center
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          Centro de apoyo para equipos de inclusión, orientación y directivos.
          Permite identificar estudiantes que requieren seguimiento, estrategias
          inclusivas, ajustes razonables y acciones asociadas al PIAR.
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
              <Typography fontWeight={900}>Estudiantes monitoreados</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950}>
              {loading ? "..." : students.length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PsychologyIcon color="warning" />
              <Typography fontWeight={900}>Seguimiento prioritario</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950}>
              {loading ? "..." : piarCandidates.length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AssignmentIcon color="success" />
              <Typography fontWeight={900}>Preparación PIAR</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950}>
              {loading ? "..." : `${Math.round((piarCandidates.length / Math.max(students.length, 1)) * 100)}%`}
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
            Estado de preparación institucional
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={900}>Identificación de necesidades de apoyo</Typography>
                <Typography fontWeight={900}>82%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={82} sx={{ mt: 1, height: 9, borderRadius: 8 }} />
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={900}>Estrategias inclusivas documentadas</Typography>
                <Typography fontWeight={900}>74%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={74} sx={{ mt: 1, height: 9, borderRadius: 8 }} />
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={900}>Preparación de ajustes razonables</Typography>
                <Typography fontWeight={900}>68%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={68} sx={{ mt: 1, height: 9, borderRadius: 8 }} />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando información de inclusión...</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}

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
                    <Typography variant="h6" fontWeight={950}>
                      {student.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.id} · Grado {student.grade} · Perfil: {student.learningProfile}
                    </Typography>
                  </Box>

                  <Chip
                    label={student.supportLevel}
                    color={supportColor(student.supportLevel)}
                    sx={{ fontWeight: 900 }}
                  />
                </Stack>

                <Typography fontWeight={900} sx={{ mt: 2 }}>
                  Estrategias inclusivas sugeridas
                </Typography>

                <Stack spacing={1} sx={{ mt: 1 }}>
                  {student.inclusiveStrategies.map((strategy) => (
                    <Alert key={strategy} severity="success" variant="outlined">
                      {strategy}
                    </Alert>
                  ))}
                </Stack>

                <Typography fontWeight={900} sx={{ mt: 2 }}>
                  Acción institucional recomendada
                </Typography>

                <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                  Revisar necesidad de ajustes razonables, documentar evidencia
                  pedagógica y definir seguimiento con equipo de inclusión.
                </Alert>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};
