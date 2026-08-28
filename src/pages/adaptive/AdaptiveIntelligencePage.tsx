import { StudentServiceStatusAlert } from "../../components/StudentServiceStatusAlert";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PsychologyIcon from "@mui/icons-material/Psychology";
import GroupsIcon from "@mui/icons-material/Groups";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import type { StudentProfile } from "../../types/student";
import type { AdaptiveLearningPlan } from "../../types/adaptive";
import { fetchStudents } from "../../services/studentApi";
import { generateAdaptivePlan } from "../../services/adaptiveApi";

export const AdaptiveIntelligencePage = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [plan, setPlan] = useState<AdaptiveLearningPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchStudents();
      setStudents(data);
      setSelectedStudent(data[0] ?? null);
    } catch {
      setError("No fue posible cargar estudiantes desde el backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (studentId: string) => {
    try {
      setGenerating(true);
      setError("");
      const data = await generateAdaptivePlan(studentId);
      setPlan(data);
    } catch {
      setError("No fue posible generar el plan adaptativo.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    void loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      void handleGeneratePlan(selectedStudent.id);
    }
  }, [selectedStudent]);

  return (
    <Box>
      <StudentServiceStatusAlert />
      <Box
        sx={{
          mb: 3,
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background:
            "linear-gradient(135deg, rgba(124,58,237,.16), rgba(37,99,235,.12), rgba(16,185,129,.12))",
          border: "1px solid rgba(148,163,184,.25)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <AutoAwesomeIcon color="primary" sx={{ fontSize: 42 }} />
          <Chip label="Adaptive Educational Intelligence" color="primary" variant="outlined" />
        </Stack>

        <Typography variant="h3" fontWeight={950}>
          Adaptive Intelligence Center
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 980 }}>
          Genera rutas adaptativas personalizadas a partir del perfil de aprendizaje,
          preferencias, interés vocacional y nivel de apoyo educativo del estudiante.
        </Typography>
      </Box>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando estudiantes...</Typography>
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && (
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
                    onClick={() => setSelectedStudent(student)}
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
                      "&:hover": { background: "rgba(37,99,235,.06)" },
                    }}
                  >
                    <Typography fontWeight={900}>{student.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.id} · Grado {student.grade}
                    </Typography>
                    <Chip
                      label={student.supportLevel}
                      size="small"
                      sx={{ mt: 1, fontWeight: 800 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 5,
              boxShadow: "0 20px 55px rgba(15,23,42,.10)",
              border: "1px solid rgba(148,163,184,.24)",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {generating && (
                <Stack alignItems="center" sx={{ py: 6 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Generando plan adaptativo...</Typography>
                </Stack>
              )}

              {!generating && plan && (
                <>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography variant="h4" fontWeight={950}>
                        {plan.fullName}
                      </Typography>
                      <Typography color="text.secondary">
                        {plan.studentId} · Perfil {plan.learningProfile} ·{" "}
                        Interés {plan.vocationalInterest}
                      </Typography>
                    </Box>

                    <Chip
                      label={plan.riskLevel}
                      color={
                        plan.riskLevel.includes("HIGH")
                          ? "error"
                          : plan.riskLevel.includes("MODERATE")
                            ? "warning"
                            : "success"
                      }
                      sx={{ fontWeight: 900 }}
                    />
                  </Stack>

                  <Divider sx={{ mb: 3 }} />

                  <Card variant="outlined" sx={{ borderRadius: 4, mb: 3 }}>
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <PsychologyIcon color="primary" />
                        <Typography variant="h6" fontWeight={950}>
                          Metodología recomendada
                        </Typography>
                      </Stack>

                      <Typography variant="h4" fontWeight={950} sx={{ mt: 1 }}>
                        {plan.recommendedMethodology.replaceAll("_", " ")}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                        {plan.learningPreferences.map((item) => (
                          <Chip key={item} label={item} variant="outlined" />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

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
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <AccountTreeIcon color="primary" />
                          <Typography fontWeight={950}>Ruta adaptativa</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {plan.adaptivePathway.map((item, index) => (
                            <Alert key={item} severity="info" variant="outlined">
                              {index + 1}. {item}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Typography fontWeight={950} sx={{ mb: 2 }}>
                          Recursos recomendados
                        </Typography>
                        <Stack spacing={1}>
                          {plan.recommendedResources.map((item) => (
                            <Alert key={item} severity="success" variant="outlined">
                              {item}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <GroupsIcon color="primary" />
                          <Typography fontWeight={950}>Acciones docentes</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {plan.teacherActions.map((item) => (
                            <Alert key={item} severity="info" variant="outlined">
                              {item}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <Diversity3Icon color="success" />
                          <Typography fontWeight={950}>Acciones de inclusión</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {plan.inclusionActions.map((item) => (
                            <Alert key={item} severity="warning" variant="outlined">
                              {item}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <FamilyRestroomIcon color="secondary" />
                          <Typography fontWeight={950}>Acciones familiares</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {plan.familyActions.map((item) => (
                            <Alert key={item} severity="success" variant="outlined">
                              {item}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => void handleGeneratePlan(plan.studentId)}
                    sx={{ mt: 3, borderRadius: 4, fontWeight: 900 }}
                  >
                    Regenerar plan adaptativo
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

