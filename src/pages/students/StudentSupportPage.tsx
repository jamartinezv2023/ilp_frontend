import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SchoolIcon from "@mui/icons-material/School";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import type { StudentProfile } from "../../types/student";
import { fetchStudents } from "../../services/studentApi";
import { fetchStudentRecommendations } from "../../services/recommendationApi";
import type { StudentRecommendation } from "../../types/recommendation";

const supportColor = (level: string): "success" | "warning" | "error" | "default" => {
  if (level === "LOW") return "success";
  if (level === "MEDIUM") return "warning";
  if (level === "HIGH") return "error";
  return "default";
};

export const StudentSupportPage = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendation, setRecommendation] =
    useState<StudentRecommendation | null>(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchStudents();
      setStudents(data);
      setSelectedStudent(data[0] ?? null);
      if (data[0]) {
        const recommendationData = await fetchStudentRecommendations(data[0].id);
        setRecommendation(recommendationData);
      }
    } catch {
      setError("No fue posible cargar los perfiles estudiantiles desde el backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStudents();
  }, []);

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
          <PsychologyIcon color="primary" sx={{ fontSize: 42 }} />
          <Chip label="Student Educational Support" color="primary" variant="outlined" />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
          Student Support Profile
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          Perfil educativo del estudiante para comprender necesidades de apoyo,
          estilos de aprendizaje, intereses vocacionales, estrategias inclusivas
          y recomendaciones pedagógicas.
        </Typography>
      </Box>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando perfiles estudiantiles...</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "360px 1fr",
            },
            gap: 2.5,
          }}
        >
          <Card sx={{ borderRadius: 5, height: "fit-content" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={950} sx={{ mb: 2 }}>
                Estudiantes
              </Typography>

              <Stack spacing={1.2}>
                {students.map((student) => (
                  <Box
                    key={student.id}
                    onClick={async () => {
                      setSelectedStudent(student);
                      const data = await fetchStudentRecommendations(student.id);
                      setRecommendation(data);
                    }}
                    sx={{
                      p: 2,
                      borderRadius: 4,
                      cursor: "pointer",
                      border:
                        selectedStudent?.id === student.id
                          ? "2px solid #2563eb"
                          : "1px solid rgba(148,163,184,.25)",
                      background:
                        selectedStudent?.id === student.id
                          ? "rgba(37,99,235,.08)"
                          : "white",
                      "&:hover": {
                        background: "rgba(37,99,235,.06)",
                      },
                    }}
                  >
                    <Typography fontWeight={900}>{student.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.id} · Grado {student.grade}
                    </Typography>
                    <Chip
                      label={student.supportLevel}
                      color={supportColor(student.supportLevel)}
                      size="small"
                      sx={{ mt: 1, fontWeight: 800 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {selectedStudent && (
            <Card
              sx={{
                borderRadius: 5,
                boxShadow: "0 20px 55px rgba(15,23,42,.10)",
                border: "1px solid rgba(148,163,184,.24)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight={950}>
                      {selectedStudent.fullName}
                    </Typography>
                    <Typography color="text.secondary">
                      {selectedStudent.id} · Grado {selectedStudent.grade} ·{" "}
                      {selectedStudent.age} años
                    </Typography>
                  </Box>

                  <Chip
                    label={`Nivel de apoyo: ${selectedStudent.supportLevel}`}
                    color={supportColor(selectedStudent.supportLevel)}
                    sx={{ fontWeight: 900 }}
                  />
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, 1fr)",
                    },
                    gap: 2.5,
                  }}
                >
                  <Card variant="outlined" sx={{ borderRadius: 4 }}>
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <SchoolIcon color="primary" />
                        <Typography fontWeight={900}>Perfil de aprendizaje</Typography>
                      </Stack>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {selectedStudent.learningProfile}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderRadius: 4 }}>
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <TipsAndUpdatesIcon color="secondary" />
                        <Typography fontWeight={900}>Interés vocacional</Typography>
                      </Stack>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {selectedStudent.vocationalInterest}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Typography variant="h6" fontWeight={950} sx={{ mt: 4, mb: 2 }}>
                  Estrategias inclusivas
                </Typography>

                <Stack spacing={1}>
                  {selectedStudent.inclusiveStrategies.map((strategy) => (
                    <Alert key={strategy} severity="success" variant="outlined" icon={<Diversity3Icon />}>
                      {strategy}
                    </Alert>
                  ))}
                </Stack>

                <Typography variant="h6" fontWeight={950} sx={{ mt: 4, mb: 2 }}>
                  Recomendaciones inteligentes
                </Typography>

                <Stack spacing={1}>
                  {(recommendation?.teacherRecommendations ?? selectedStudent.pedagogicalRecommendations).map((item) => (
                    <Alert key={item} severity="info" variant="outlined">
                      {item}
                    </Alert>
                  ))}
                </Stack>

                <Typography variant="h6" fontWeight={950} sx={{ mt: 4, mb: 2 }}>
                  Próximas acciones
                </Typography>

                <Stack spacing={1}>
                  {(recommendation?.nextActions ?? []).map((item) => (
                    <Alert key={item} severity="warning" variant="outlined">
                      {item}
                    </Alert>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};


