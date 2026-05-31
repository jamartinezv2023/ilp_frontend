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
import TimelineIcon from "@mui/icons-material/Timeline";
import PsychologyIcon from "@mui/icons-material/Psychology";
import GppGoodIcon from "@mui/icons-material/GppGood";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import type { ResearchCategory, ResearchSignal } from "../../types/research";
import { fetchResearchSignals } from "../../services/researchApi";

export const ResearchCenterPage = () => {
  const [signals, setSignals] = useState<ResearchSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<ResearchCategory>("all");

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

  const categories: { label: string; value: ResearchCategory }[] = [
    { label: "All", value: "all" },
    { label: "Governance", value: "governance" },
    { label: "Trustworthiness", value: "trustworthiness" },
    { label: "Ethics", value: "ethics" },
    { label: "Architecture", value: "architecture" },
    { label: "Deployment", value: "deployment" },
    { label: "Research", value: "research" },
  ];

  const filteredSignals =
    activeCategory === "all"
      ? signals
      : signals.filter((signal) => signal.category === activeCategory);

  const roadmapItems = [
    { label: "Governance", status: "Completed" },
    { label: "Trustworthiness", status: "Completed" },
    { label: "Fairness", status: "Completed" },
    { label: "Architecture", status: "Completed" },
    { label: "Deployment", status: "Completed" },
    { label: "Ethics", status: "Completed" },
    { label: "Expert Validation", status: "In preparation" },
    { label: "Research Instruments", status: "In preparation" },
    { label: "Pilot Study", status: "Pending" },
    { label: "Scientific Publications", status: "Pending" },
  ];

  const totalSignals = signals.length;
  const validatedSignals = signals.filter((signal) => signal.status).length;
  const evidenceItems = signals.reduce(
    (total, signal) => total + signal.evidence.length,
    0
  );

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
          Inclusive Educational AI Research Center
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 980 }}>
          Tablero ejecutivo para visualizar la madurez científica, ética,
          arquitectónica y tecnológica de la plataforma ILP como evidencia de
          investigación doctoral aplicada a la educación inclusiva.
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        <Card sx={{ borderRadius: 5, boxShadow: "0 18px 45px rgba(15,23,42,.10)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PsychologyIcon color="primary" />
              <Typography fontWeight={900}>Evidencias activas</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ mt: 2 }}>
              {loading ? "..." : totalSignals}
            </Typography>
            <Typography color="text.secondary">
              Áreas de investigación y gobernanza conectadas al backend.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 5, boxShadow: "0 18px 45px rgba(15,23,42,.10)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GppGoodIcon color="success" />
              <Typography fontWeight={900}>Estado validado</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ mt: 2 }}>
              {loading ? "..." : validatedSignals}
            </Typography>
            <Typography color="text.secondary">
              Señales con respuesta real desde servicios activos.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 5, boxShadow: "0 18px 45px rgba(15,23,42,.10)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CloudDoneIcon color="info" />
              <Typography fontWeight={900}>Ítems de evidencia</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ mt: 2 }}>
              {loading ? "..." : evidenceItems}
            </Typography>
            <Typography color="text.secondary">
              Indicadores visibles para seguimiento doctoral.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Consultando evidencia científica y tecnológica...
          </Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <>
          <Card
            sx={{
              mb: 3,
              borderRadius: 5,
              boxShadow: "0 18px 45px rgba(15,23,42,.10)",
              border: "1px solid rgba(148,163,184,.22)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <TimelineIcon color="primary" />
                <Typography variant="h5" fontWeight={950}>
                  Doctoral Research Roadmap
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    lg: "repeat(5, 1fr)",
                  },
                  gap: 1.5,
                }}
              >
                {roadmapItems.map((item) => (
                  <Chip
                    key={item.label}
                    label={`${item.status === "Completed" ? "✓" : item.status === "In preparation" ? "◐" : "○"} ${item.label}`}
                    color={
                      item.status === "Completed"
                        ? "success"
                        : item.status === "In preparation"
                          ? "warning"
                          : "default"
                    }
                    variant={item.status === "Completed" ? "filled" : "outlined"}
                    sx={{
                      justifyContent: "flex-start",
                      fontWeight: 800,
                      px: 1,
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
            {categories.map((category) => (
              <Chip
                key={category.value}
                label={category.label}
                clickable
                color={activeCategory === category.value ? "primary" : "default"}
                variant={activeCategory === category.value ? "filled" : "outlined"}
                onClick={() => setActiveCategory(category.value)}
                sx={{ fontWeight: 800, mb: 1 }}
              />
            ))}
          </Stack>

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
          {filteredSignals.map((signal) => (
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

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 2 }}
                  >
                    Endpoint: {signal.endpoint}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
        </>
      )}
    </Box>
  );
};



