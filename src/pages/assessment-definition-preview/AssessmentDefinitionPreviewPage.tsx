import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { AssessmentWizard } from "../../features/assessment-engine/components/AssessmentWizard";
import {
  loadCompatibleAssessmentDefinition,
  type AssessmentDefinitionSource,
} from "../../features/assessment-engine/services/loadCompatibleAssessmentDefinition";
import type { AssessmentDefinition } from "../../types/assessmentDefinition";
import { useI18n } from "../../i18n/I18nProvider";

const ASSESSMENT_CODE = "KOLB_V1";

const sourceLabel: Record<AssessmentDefinitionSource, string> = {
  GENERIC_RENDERER: "API genérica",
  LEGACY_FALLBACK: "Compatibilidad temporal",
};

export const AssessmentDefinitionPreviewPage = () => {
  const { t } = useI18n();
  const requestSequence = useRef(0);
  const [definition, setDefinition] =
    useState<AssessmentDefinition | null>(null);
  const [source, setSource] =
    useState<AssessmentDefinitionSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDefinition = async () => {
    const requestId = ++requestSequence.current;

    try {
      setLoading(true);
      setError("");

      const result =
        await loadCompatibleAssessmentDefinition(ASSESSMENT_CODE);

      if (requestId !== requestSequence.current) return;

      setDefinition(result.definition);
      setSource(result.source);
    } catch {
      if (requestId !== requestSequence.current) return;

      setDefinition(null);
      setSource(null);
      setError(
        `No fue posible cargar la definición del instrumento ${ASSESSMENT_CODE}.`
      );
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadDefinition();
  }, []);

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={950}>
            Motor genérico de instrumentos
          </Typography>

          <Typography color="text.secondary">
            Definición dinámica proporcionada por el backend.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {source && (
            <Chip
              label={sourceLabel[source]}
              color={
                source === "GENERIC_RENDERER"
                  ? "success"
                  : "warning"
              }
              variant="outlined"
            />
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadDefinition()}
            disabled={loading}
          >
            Recargar
          </Button>
        </Stack>
      </Stack>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />

          <Typography sx={{ mt: 2 }}>
            {t("assessment.loading")}
          </Typography>
        </Stack>
      )}

      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadDefinition()}
            >
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!loading && definition && (
        <AssessmentWizard definition={definition} />
      )}
    </Box>
  );
};
