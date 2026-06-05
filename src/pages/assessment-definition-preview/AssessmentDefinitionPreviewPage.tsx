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
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import type { AssessmentDefinition } from "../../types/assessmentDefinition";
import { fetchAssessmentDefinition } from "../../services/assessmentDefinitionApi";
import { QuestionRenderer } from "../../features/assessment-engine/components/QuestionRenderer";

export const AssessmentDefinitionPreviewPage = () => {
  const [definition, setDefinition] = useState<AssessmentDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDefinition = async () => {
    try {
      setLoading(true);
      setError("");
      setDefinition(await fetchAssessmentDefinition("KOLB_V1"));
    } catch {
      setError("No fue posible cargar la definición del instrumento KOLB_V1.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDefinition();
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
          <DynamicFormIcon color="primary" sx={{ fontSize: 42 }} />
          <Chip
            label="Rich Form Engine Preview"
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Typography variant="h3" fontWeight={950}>
          Assessment Definition Preview
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 980 }}>
          Vista técnica y pedagógica para validar que el frontend puede renderizar
          instrumentos desde definiciones persistidas en PostgreSQL.
        </Typography>
      </Box>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando definición del instrumento...</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && definition && (
        <Stack spacing={3}>
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
              >
                <Box>
                  <Typography variant="h4" fontWeight={950}>
                    {definition.name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {definition.description}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={definition.code} color="primary" />
                  <Chip label={definition.assessmentType} variant="outlined" />
                  <Chip label={`v${definition.version}`} variant="outlined" />
                  <Chip
                    label={`${definition.estimatedMinutes} min`}
                    variant="outlined"
                  />
                </Stack>
              </Stack>

              <Alert severity="info" sx={{ mt: 3 }}>
                {definition.instructions}
              </Alert>

              <Box sx={{ mt: 3 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={900}>
                    Preguntas cargadas desde backend
                  </Typography>
                  <Typography fontWeight={900}>
                    {definition.questions.length} / {definition.questions.length}
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{ mt: 1, height: 9, borderRadius: 8 }}
                />
              </Box>
            </CardContent>
          </Card>

          <Stack spacing={2}>
            {definition.questions.map((question) => (
              <QuestionRenderer key={question.id} question={question} />
            ))}
          </Stack>
        </Stack>
      )}
    </Box>
  );
};
