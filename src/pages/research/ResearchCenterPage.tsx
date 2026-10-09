import { useI18n } from "../../i18n/I18nProvider";
import { researchDetails, researchTerm } from "../../i18n/researchText";
import { useSuiteText } from "../../i18n/useSuiteText";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import VerifiedIcon from "@mui/icons-material/Verified";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PsychologyIcon from "@mui/icons-material/Psychology";
import GppGoodIcon from "@mui/icons-material/GppGood";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { ResearchCategory, ResearchSignal } from "../../types/research";
import { fetchResearchSignals } from "../../services/researchApi";

const categories: { label: string; value: ResearchCategory }[] = [
  { label: "All", value: "all" },
  { label: "Governance", value: "governance" },
  { label: "Trustworthiness", value: "trustworthiness" },
  { label: "Ethics", value: "ethics" },
  { label: "Architecture", value: "architecture" },
  { label: "Deployment", value: "deployment" },
  { label: "Research", value: "research" },
];

export const ResearchCenterPage = () => {
  const ui = useSuiteText();
  const { locale } = useI18n();
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
        "No fue posible conectar con el backend. Verifique que el servicio esté activo en https://ilp-adaptive-education-service.onrender.com."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSignals();
  }, []);

  const filteredSignals =
    activeCategory === "all"
      ? signals
      : signals.filter((signal) => signal.category === activeCategory);

  const totalSignals = signals.length;
  const availableSignals = signals.filter(
    (signal) => signal.status !== "NO DISPONIBLE"
  ).length;
  const unavailableSignals = totalSignals - availableSignals;
  const evidenceItems = signals.reduce(
    (total, signal) => total + signal.evidence.length,
    0
  );

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background:
            "linear-gradient(135deg, rgba(37,99,235,.14), rgba(124,58,237,.16), rgba(14,165,233,.12))",
          border: "1px solid rgba(148,163,184,.25)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <ScienceIcon color="primary" sx={{ fontSize: 40 }} />
          <Chip
            icon={<VerifiedIcon />}
            label={ui("Doctoral Research Analytics")}
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1, fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
          {ui("Inclusive Educational AI Research Center")}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          {ui("Executive analytics workspace for monitoring the scientific, ethical, architectural and technological maturity of the ILP doctoral research platform.")}
        </Typography>

        <Button
          startIcon={<RefreshIcon />}
          variant="contained"
          onClick={() => void loadSignals()}
          sx={{ mt: 3, borderRadius: 4, fontWeight: 900 }}
        >
          {ui("Refresh evidence")}
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },
          gap: 2.5,
          mb: 3,
        }}
      >
        <Card sx={{ borderRadius: 4, boxShadow: "0 16px 36px rgba(15,23,42,.09)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PsychologyIcon color="primary" />
              <Typography fontWeight={900}>{ui("Contratos consultados")}</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ mt: 1 }}>
              {loading ? "..." : totalSignals}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {ui("Endpoints de Research consultados por el cliente.")}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: "0 16px 36px rgba(15,23,42,.09)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GppGoodIcon color="success" />
              <Typography fontWeight={900}>{ui("Respuestas backend")}</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ mt: 1 }}>
              {loading ? "..." : availableSignals}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {ui("Señales construidas únicamente desde respuestas disponibles.")}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: "0 16px 36px rgba(15,23,42,.09)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CloudDoneIcon color="info" />
              <Typography fontWeight={900}>{ui("No disponibles")}</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ mt: 1 }}>
              {loading ? "..." : unavailableSignals}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {ui("Endpoints sin respuesta; no se aplicaron valores fallback.")}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        {ui("Los porcentajes de madurez y readiness se muestran como no calculados: los contratos backend actuales no entregan métricas cuantitativas certificadas. La interfaz no infiere ni sustituye esos valores. Evidencias backend visibles:")} {evidenceItems}.
      </Alert>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            {ui("Consulting scientific and technological evidence...")}
          </Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{ui(error)}</Alert>}

      {!loading && !error && (
        <>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
            {categories.map((category) => (
              <Chip
                key={category.value}
                label={researchTerm(category.label, locale)}
                clickable
                color={activeCategory === category.value ? "primary" : "default"}
                variant={activeCategory === category.value ? "filled" : "outlined"}
                onClick={() => setActiveCategory(category.value)}
                sx={{ fontWeight: 800, mb: 1 }}
              />
            ))}
          </Stack>

          <Stack spacing={1.5}>
            {filteredSignals.map((signal) => (
              <Accordion
                key={signal.endpoint}
                disableGutters
                sx={{
                  borderRadius: 4,
                  border: "1px solid rgba(148,163,184,.24)",
                  boxShadow: "0 12px 30px rgba(15,23,42,.07)",
                  overflow: "hidden",
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`${signal.endpoint}-content`}
                  id={`${signal.endpoint}-header`}
                  sx={{
                    px: 2.5,
                    py: 1.2,
                    "& .MuiAccordionSummary-content": {
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 2,
                    },
                  }}
                >
                  <AccountTreeIcon color="primary" />

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={950}>
                      {ui(signal.title)}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                        maxWidth: "100%",
                      }}
                    >
                      {signal.status === "NO DISPONIBLE" ? `${ui("Sin respuesta del servicio.")} ${signal.summary.match(/HTTP \d+/)?.[0] ?? ""}` : <span>{researchDetails(signal.payload ?? {}, locale).slice(0, 3).join(" · ")}</span>}
                    </Typography>
                  </Box>

                  <Chip
                    label={signal.status === "NO DISPONIBLE" ? (locale === "es" ? "No disponible" : "Unavailable") : researchTerm(signal.status, locale)}
                    color={
                      signal.status === "NO DISPONIBLE" ? "error" : "success"
                    }
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 800, maxWidth: "100%", height: "auto", py: 0.5, "& .MuiChip-label": { whiteSpace: "normal", overflowWrap: "anywhere" } }}
                  />
                </AccordionSummary>

                <AccordionDetails sx={{ px: 3, pb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={900}
                    sx={{ mb: 1 }}
                  >
                    {ui("Visible evidence")}
                  </Typography>

                  <Stack spacing={1}>
                    {(signal.payload ? researchDetails(signal.payload, locale) : [locale === "es" ? "Sin respuesta del servicio; no se muestran evidencias sustitutivas." : "No service response; no substitute evidence is displayed."]).map((item) => (
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
                    {ui("Origen:")} {signal.status === "NO DISPONIBLE"
                      ? ui("sin respuesta backend")
                      : ui("respuesta backend")}
                    {" · "}{locale === "es" ? "Servicio" : "Endpoint"}: <code translate="no" data-technical-value>{signal.endpoint}</code>
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
};



