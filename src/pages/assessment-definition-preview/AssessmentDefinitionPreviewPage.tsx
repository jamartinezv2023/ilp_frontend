import { useSuiteText } from "../../i18n/useSuiteText";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { AssessmentWizard } from "../../features/assessment-engine/components/AssessmentWizard";
import { loadLocalizedInstrument } from "../../services/localizedInstrument";
import { adaptAssessmentRendererToDefinition } from "../../features/assessment-engine/services/adaptAssessmentRendererToDefinition";
import type { AssessmentDefinition } from "../../types/assessmentDefinition";
import { useI18n } from "../../i18n/I18nProvider";

export const AssessmentDefinitionPreviewPage = () => {
  const ui = useSuiteText();
  const { t, locale } = useI18n();
  const [code, setCode] = useState("KOLB_V1");
  const requestSequence = useRef(0);
  const [definition, setDefinition] =
    useState<AssessmentDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDefinition = useCallback(async () => {
    const requestId = ++requestSequence.current;

    try {
      setLoading(true);
      setDefinition(null);
      setError("");

      const result =
        await loadLocalizedInstrument(code, locale);

      if (requestId !== requestSequence.current) return;

      setDefinition(adaptAssessmentRendererToDefinition(result));
    } catch {
      if (requestId !== requestSequence.current) return;

      setDefinition(null);
      setError(
        locale === "es" ? "No hay una versión completa aprobada de este instrumento en español." : "No complete approved English version of this instrument is available."
      );
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
      }
    }
  }, [code, locale]);

  useEffect(() => {
    void loadDefinition();
  }, [loadDefinition]);

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
            {ui("Motor genérico de instrumentos")}
          </Typography>

          <Typography color="text.secondary">
            {ui("Definición dinámica proporcionada por el backend.")}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <label>
            {locale === "es" ? "Instrumento" : "Instrument"}
            <select value={code} onChange={event => setCode(event.target.value)}>
              <option value="KOLB_V1">Kolb</option>
              <option value="FELDER_SILVERMAN_V1">Felder-Silverman</option>
              <option value="KUDER_V1">Kuder</option>
            </select>
          </label>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadDefinition()}
            disabled={loading}
          >
            {ui("Recargar")}
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
              {ui("Reintentar")}
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
