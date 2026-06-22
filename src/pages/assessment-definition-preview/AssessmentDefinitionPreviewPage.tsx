import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { AssessmentDefinition } from "../../types/assessmentDefinition";
import { fetchAssessmentDefinition } from "../../services/assessmentDefinitionApi";
import { AssessmentWizard } from "../../features/assessment-engine/components/AssessmentWizard";

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
      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Cargando instrumento...</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && definition && <AssessmentWizard definition={definition} />}
    </Box>
  );
};
