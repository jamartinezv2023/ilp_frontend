import { useApiText } from "../../i18n/useApiText";
import { useSuiteText } from "../../i18n/useSuiteText";
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
import { useI18n } from "../../i18n/I18nProvider";

export const AdaptiveIntelligencePage = () => {
  const ui = useSuiteText();
  const apiText = useApiText();
  const { t, locale } = useI18n();
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

  const [previewAttempt, setPreviewAttempt] = useState(0);

  useEffect(() => {
    void loadStudents();
  }, []);

  useEffect(() => {
    let active = true;
    setPlan(null);
    if (!selectedStudent) return;
    const student = selectedStudent;
    setGenerating(true);
    setError("");
    void generateAdaptivePlan(student.id).then((data) => {
      if (!active) return;
      if (data.studentId !== student.id || data.supportLevel !== student.supportLevel) {
        throw new Error("Unexpected student");
      }
      setPlan(data);
    }).catch(() => {
      if (active) {
        setPlan(null);
        setError("No fue posible consultar la vista previa del plan adaptativo.");
      }
    }).finally(() => {
      if (active) setGenerating(false);
    });
    return () => { active = false; };
  }, [selectedStudent, previewAttempt]);

  return (
    <Box>
      <StudentServiceStatusAlert />
      <Alert severity="info" sx={{ mb: 2 }}>
        {locale === "es"
          ? "Vista previa sin guardar. Consultar o actualizar no registra un plan ni modifica el historial. El registro autorizado sigue pendiente."
          : "Unsaved preview. Viewing or refreshing does not record a plan or change history. Authorized recording remains pending."}
      </Alert>
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
          <Chip label={ui("Adaptive Educational Intelligence")} color="primary" variant="outlined" />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
          {ui("Adaptive Intelligence Center")}
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 980 }}>
          {t("adaptive.description")}
        </Typography>
      </Box>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>{ui("Cargando estudiantes...")}</Typography>
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error === "No fue posible consultar la vista previa del plan adaptativo." ? (locale === "es" ? error : "The adaptive plan preview could not be retrieved.") : ui(error)}</Alert>}

      {!loading && error && selectedStudent && (
        <Button disabled={generating} onClick={() => setPreviewAttempt((attempt) => attempt + 1)}>
          {locale === "es" ? "Reintentar consulta" : "Retry preview"}
        </Button>
      )}
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
                {ui("Estudiantes")}
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
                    <Typography fontWeight={900}><span translate="no">{student.fullName}</span></Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.id} {ui("· Grado")} {student.grade}
                    </Typography>
                    <Chip
                      label={ui(student.supportLevel)}
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
                  <Typography sx={{ mt: 2 }}>{locale === "es" ? "Consultando vista previa..." : "Loading preview..."}</Typography>
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
                        <span translate="no">{plan.fullName}</span>
                      </Typography>
                      <Typography color="text.secondary">
                        {plan.studentId} {ui("· Perfil")} {apiText(plan.learningProfile, plan)} ·{" "}
                        {ui("Interés")} {apiText(plan.vocationalInterest, plan)}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`${ui("Nivel de apoyo:")} ${ui(plan.supportLevel)}`}
                        variant="outlined"
                        sx={{ fontWeight: 900 }}
                      />
                      <Chip
                        label={`${ui("Riesgo adaptativo:")} ${apiText(plan.riskLevel, plan)}`}
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
                  </Stack>

                  <Divider sx={{ mb: 3 }} />

                  <Card variant="outlined" sx={{ borderRadius: 4, mb: 3 }}>
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <PsychologyIcon color="primary" />
                        <Typography variant="h6" fontWeight={950}>
                          {ui("Metodología recomendada")}
                        </Typography>
                      </Stack>

                      <Typography variant="h4" fontWeight={950} sx={{ mt: 1 }}>
                        {apiText(plan.recommendedMethodology, plan)}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                        {plan.learningPreferences.map((item) => (
                          <Chip key={apiText(item, plan)} label={apiText(item, plan)} variant="outlined" />
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
                          <Typography fontWeight={950}>{ui("Ruta adaptativa")}</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {plan.adaptivePathway.map((item, index) => (
                            <Alert key={apiText(item, plan)} severity="info" variant="outlined">
                              {index + 1}. {apiText(item, plan)}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Typography fontWeight={950} sx={{ mb: 2 }}>
                          {ui("Recursos recomendados")}
                        </Typography>
                        <Stack spacing={1}>
                          {plan.recommendedResources.map((item) => (
                            <Alert key={apiText(item, plan)} severity="success" variant="outlined">
                              {apiText(item, plan)}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <GroupsIcon color="primary" />
                          <Typography fontWeight={950}>{ui("Acciones docentes")}</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {plan.teacherActions.map((item) => (
                            <Alert key={apiText(item, plan)} severity="info" variant="outlined">
                              {apiText(item, plan)}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <Diversity3Icon color="success" />
                          <Typography fontWeight={950}>{ui("Acciones de inclusión")}</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {plan.inclusionActions.map((item) => (
                            <Alert key={apiText(item, plan)} severity="warning" variant="outlined">
                              {apiText(item, plan)}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <FamilyRestroomIcon color="secondary" />
                          <Typography fontWeight={950}>{ui("Acciones familiares")}</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {plan.familyActions.map((item) => (
                            <Alert key={apiText(item, plan)} severity="success" variant="outlined">
                              {apiText(item, plan)}
                            </Alert>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={() => {
                      setPreviewAttempt((attempt) => attempt + 1);
                    }}
                    disabled={!selectedStudent || generating}
                    sx={{ mt: 3, borderRadius: 4, fontWeight: 900 }}
                  >
                    {locale === "es" ? "Actualizar vista previa" : "Refresh preview"}
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

