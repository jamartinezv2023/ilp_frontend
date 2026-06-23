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
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SchoolIcon from "@mui/icons-material/School";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import type { StudentProfile } from "../../types/student";
import type {
  FelderSilvermanAssessmentResponse,
  KolbAssessmentResponse,
  KuderAssessmentResponse,
} from "../../types/assessment";
import { fetchStudents, fetchStudentById } from "../../services/studentApi";
import { generateAdaptivePlan } from "../../services/adaptiveApi";
import type { AdaptiveLearningPlan } from "../../types/adaptive";
import {
  submitFelderSilvermanAssessment,
  submitKuderAssessment,
} from "../../services/assessmentApi";
import { KolbRealForm } from "./components/KolbRealForm";

export const AssessmentCenterPage = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [kolbResult, setKolbResult] = useState<KolbAssessmentResponse | null>(null);
  const [felderResult, setFelderResult] =
    useState<FelderSilvermanAssessmentResponse | null>(null);
  const [kuderResult, setKuderResult] = useState<KuderAssessmentResponse | null>(null);
  const [adaptivePlan, setAdaptivePlan] = useState<AdaptiveLearningPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState("");
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

  const runFelder = async () => {
    if (!selectedStudent) return;

    try {
      setRunning("felder");
      setFelderResult(await submitFelderSilvermanAssessment(selectedStudent.id));
      setSelectedStudent(await fetchStudentById(selectedStudent.id));
    } catch {
      setError("No fue posible aplicar Felder-Silverman.");
    } finally {
      setRunning("");
    }
  };

  const runKuder = async () => {
    if (!selectedStudent) return;

    try {
      setRunning("kuder");
      setKuderResult(await submitKuderAssessment(selectedStudent.id));
      setSelectedStudent(await fetchStudentById(selectedStudent.id));
    } catch {
      setError("No fue posible aplicar Kuder.");
    } finally {
      setRunning("");
    }
  };

  const runAdaptivePlan = async () => {
    if (!selectedStudent) return;

    try {
      setRunning("adaptive");
      setAdaptivePlan(await generateAdaptivePlan(selectedStudent.id));
    } catch {
      setError("No fue posible generar el plan adaptativo.");
    } finally {
      setRunning("");
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
            "linear-gradient(135deg, rgba(37,99,235,.14), rgba(124,58,237,.14), rgba(16,185,129,.12))",
          border: "1px solid rgba(148,163,184,.25)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <AssignmentTurnedInIcon color="primary" sx={{ fontSize: 42 }} />
          <Chip label="Educational Assessment Engine" color="primary" variant="outlined" />
        </Stack>

        <Typography variant="h3" fontWeight={950}>
          Assessment Center
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 980 }}>
          Centro para aplicar instrumentos educativos, calcular perfiles de
          aprendizaje, preferencias de procesamiento e intereses vocacionales.
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
                    onClick={() => {
                      setSelectedStudent(student);
                      setKolbResult(null);
                      setFelderResult(null);
                      setKuderResult(null);
                      setAdaptivePlan(null);
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
                      "&:hover": { background: "rgba(37,99,235,.06)" },
                    }}
                  >
                    <Typography fontWeight={900}>{student.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.id} · Grado {student.grade}
                    </Typography>
                    <Chip label={student.supportLevel} size="small" sx={{ mt: 1 }} />
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
              {selectedStudent && (
                <>
                  <Typography variant="h4" fontWeight={950}>
                    {selectedStudent.fullName}
                  </Typography>
                  <Typography color="text.secondary">
                    {selectedStudent.id} · Grado {selectedStudent.grade} ·{" "}
                    Perfil actual: {selectedStudent.learningProfile}
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(3, 1fr)",
                      },
                      gap: 2.5,
                    }}
                  >
                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <PsychologyIcon color="primary" />
                          <Typography fontWeight={950}>Kolb</Typography>
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Identifica el estilo de aprendizaje experiencial.
                        </Typography>

                        {selectedStudent && (
                          <Box sx={{ mt: 2 }}>
                            <KolbRealForm
                              studentId={selectedStudent.id}
                              onCompleted={(result) => setKolbResult(result)}
                            />
                          </Box>
                        )}

                        {kolbResult && (
                          <Alert severity="success" sx={{ mt: 2 }}>
                            Resultado real: {kolbResult.learningStyle}
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <SchoolIcon color="secondary" />
                          <Typography fontWeight={950}>Felder-Silverman</Typography>
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Identifica preferencias de procesamiento.
                        </Typography>

                        <Button
                          fullWidth
                          variant="contained"
                          disabled={running === "felder"}
                          onClick={() => void runFelder()}
                          sx={{ mt: 2, borderRadius: 3, fontWeight: 900 }}
                        >
                          {running === "felder"
                            ? "Aplicando..."
                            : "Aplicar Felder"}
                        </Button>

                        {felderResult && (
                          <Alert severity="success" sx={{ mt: 2 }}>
                            {felderResult.learningPreferences.join(", ")}
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <TipsAndUpdatesIcon color="warning" />
                          <Typography fontWeight={950}>Kuder</Typography>
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Identifica áreas de interés vocacional.
                        </Typography>

                        <Button
                          fullWidth
                          variant="contained"
                          disabled={running === "kuder"}
                          onClick={() => void runKuder()}
                          sx={{ mt: 2, borderRadius: 3, fontWeight: 900 }}
                        >
                          {running === "kuder" ? "Aplicando..." : "Aplicar Kuder"}
                        </Button>

                        {kuderResult && (
                          <Alert severity="success" sx={{ mt: 2 }}>
                            Área dominante: {kuderResult.dominantVocationalArea}
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Box>

                  <Card variant="outlined" sx={{ borderRadius: 4, mt: 3 }}>
                    <CardContent>
                      <Typography variant="h5" fontWeight={950}>
                        Perfil actualizado del estudiante
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                        <Chip label={`Kolb: ${selectedStudent.learningProfile}`} color="primary" />
                        <Chip label={`Vocacional: ${selectedStudent.vocationalInterest}`} color="secondary" />
                        <Chip label={`Apoyo: ${selectedStudent.supportLevel}`} variant="outlined" />
                      </Stack>

                      <Button
                        variant="contained"
                        disabled={running === "adaptive"}
                        onClick={() => void runAdaptivePlan()}
                        sx={{ mt: 3, borderRadius: 3, fontWeight: 900 }}
                      >
                        {running === "adaptive"
                          ? "Generando plan..."
                          : "Generar plan adaptativo actualizado"}
                      </Button>

                      {adaptivePlan && (
                        <Alert severity="success" sx={{ mt: 3 }}>
                          Plan generado: {adaptivePlan.recommendedMethodology.replaceAll("_", " ")} · Riesgo: {adaptivePlan.riskLevel}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};




