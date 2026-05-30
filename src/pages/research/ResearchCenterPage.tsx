import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import VerifiedIcon from "@mui/icons-material/Verified";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import type { ResearchSignal } from "../../types/research";
import { fetchResearchSignals } from "../../services/researchApi";

export const ResearchCenterPage = () => {
  const [signals, setSignals] = useState<ResearchSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSignals = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchResearchSignals();
      setSignals(data);
    } catch {
      setError(
        "No fue posible conectar con el backend. Verifique que el servicio esté activo en http://localhost:8083."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSignals();
  }, []);

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, md: 5 },
          borderRadius: 6,
          background:
            "linear-gradient(135deg, rgba(37,99,235,.14), rgba(124,58,237,.16), rgba(14,165,233,.12))",
          border: "1px solid rgba(148,163,184,.25)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <ScienceIcon color="primary" sx={{ fontSize: 42 }} />
          <Chip
            icon={<VerifiedIcon />}
            label="Doctoral Research Validation"
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
          Research Validation Center
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 980 }}>
          Centro ejecutivo para visualizar, en lenguaje académico y no técnico,
          el estado de gobernanza, confiabilidad, equidad, arquitectura y
          despliegue de la plataforma ILP.
        </Typography>

        <Button
          startIcon={<RefreshIcon />}
          variant="contained"
          onClick={() => void loadSignals()}
          sx={{ mt: 3, borderRadius: 4 }}
        >
          Actualizar evidencia
        </Button>
      </Box>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Consultando endpoints del backend...</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {signals.map((signal) => (
            <Box key={signal.endpoint}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 5,
                  boxShadow: "0 22px 50px rgba(15,23,42,.10)",
                  border: "1px solid rgba(148,163,184,.22)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <AccountTreeIcon color="primary" />
                    <Typography variant="h6" fontWeight={900}>
                      {signal.title}
                    </Typography>
                  </Stack>

                  <Chip
                    label={signal.status}
                    color="success"
                    variant="outlined"
                    sx={{ mb: 2, fontWeight: 800 }}
                  />

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {signal.summary}
                  </Typography>

                  <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                    Evidencia visible
                  </Typography>

                  <Stack spacing={1}>
                    {signal.evidence.slice(0, 4).map((item) => (
                      <Alert severity="info" variant="outlined" key={item}>
                        {item}
                      </Alert>
                    ))}
                  </Stack>

                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                    Endpoint: {signal.endpoint}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};




