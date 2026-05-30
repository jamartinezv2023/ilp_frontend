import { useEffect, useMemo, useState } from "react";
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
  LinearProgress,
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
import TimelineIcon from "@mui/icons-material/Timeline";
import InsightsIcon from "@mui/icons-material/Insights";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
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

const readinessScores = [
  {
    label: "Research readiness",
    score: 86,
    icon: <ScienceIcon color="primary" />,
    detail: "Scientific validation pathway is progressing.",
  },
  {
    label: "Ethics readiness",
    score: 82,
    icon: <GppGoodIcon color="success" />,
    detail: "Ethics submission preparation is active.",
  },
  {
    label: "Pilot readiness",
    score: 64,
    icon: <PsychologyIcon color="secondary" />,
    detail: "Expert validation and instruments are in preparation.",
  },
  {
    label: "Publication readiness",
    score: 48,
    icon: <EmojiEventsIcon color="warning" />,
    detail: "Empirical evidence is still required.",
  },
];

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

const maturityDimensions = [
  { label: "Governance", score: 100 },
  { label: "Trustworthiness", score: 94 },
  { label: "Architecture", score: 96 },
  { label: "Deployment", score: 92 },
  { label: "Ethics", score: 82 },
  { label: "Expert validation", score: 58 },
  { label: "Research instruments", score: 58 },
  { label: "Pilot study", score: 25 },
];

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

  const filteredSignals =
    activeCategory === "all"
      ? signals
      : signals.filter((signal) => signal.category === activeCategory);

  const totalSignals = signals.length;
  const validatedSignals = signals.filter((signal) => signal.status).length;
  const evidenceItems = signals.reduce(
    (total, signal) => total + signal.evidence.length,
    0
  );

  const maturityIndex = useMemo(() => {
    const total = maturityDimensions.reduce(
      (sum, item) => sum + item.score,
      0
    );

    return Math.round(total / maturityDimensions.length);
  }, []);

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
            label="Doctoral Research Analytics"
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
          Inclusive Educational AI Research Center
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          Executive analytics workspace for monitoring the scientific, ethical,
          architectural and technological maturity of the ILP doctoral research
          platform.
        </Typography>

        <Button
          startIcon={<RefreshIcon />}
          variant="contained"
          onClick={() => void loadSignals()}
          sx={{ mt: 3, borderRadius: 4, fontWeight: 900 }}
        >
          Refresh evidence
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "360px 1fr",
          },
          gap: 2.5,
          mb: 3,
        }}
      >
        <Card
          sx={{
            borderRadius: 5,
            boxShadow: "0 20px 55px rgba(15,23,42,.10)",
            border: "1px solid rgba(148,163,184,.24)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <InsightsIcon color="primary" />
              <Typography variant="h5" fontWeight={950}>
                Research Maturity Index
              </Typography>
            </Stack>

            <Typography variant="h2" fontWeight={950}>
              {maturityIndex}%
            </Typography>

            <LinearProgress
              variant="determinate"
              value={maturityIndex}
              sx={{
                mt: 2,
                height: 12,
                borderRadius: 8,
                backgroundColor: "rgba(148,163,184,.25)",
              }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Overall maturity based on governance, trustworthiness,
              architecture, deployment, ethics, expert validation, instruments
              and pilot readiness.
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 5,
            boxShadow: "0 20px 55px rgba(15,23,42,.10)",
            border: "1px solid rgba(148,163,184,.24)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={950} sx={{ mb: 2 }}>
              Readiness Scores
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                },
                gap: 2,
              }}
            >
              {readinessScores.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    p: 2,
                    borderRadius: 4,
                    background: "rgba(248,250,252,.92)",
                    border: "1px solid rgba(148,163,184,.22)",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {item.icon}
                    <Typography fontWeight={900}>{item.label}</Typography>
                  </Stack>

                  <Typography variant="h5" fontWeight={950} sx={{ mt: 1 }}>
                    {item.score}%
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={item.score}
                    sx={{
                      mt: 1,
                      height: 8,
                      borderRadius: 8,
                      backgroundColor: "rgba(148,163,184,.25)",
                    }}
                  />

                  <Typography variant="caption" color="text.secondary">
                    {item.detail}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

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
                label={`${
                  item.status === "Completed"
                    ? "?"
                    : item.status === "In preparation"
                      ? "?"
                      : "?"
                } ${item.label}`}
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
              <Typography fontWeight={900}>Active evidence</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ mt: 1 }}>
              {loading ? "..." : totalSignals}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Research and governance areas connected to backend services.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: "0 16px 36px rgba(15,23,42,.09)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GppGoodIcon color="success" />
              <Typography fontWeight={900}>Validated status</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ mt: 1 }}>
              {loading ? "..." : validatedSignals}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Signals receiving real responses from active services.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 4, boxShadow: "0 16px 36px rgba(15,23,42,.09)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CloudDoneIcon color="info" />
              <Typography fontWeight={900}>Evidence items</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} sx={{ mt: 1 }}>
              {loading ? "..." : evidenceItems}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Visible indicators for doctoral monitoring and review.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card
        sx={{
          mb: 3,
          borderRadius: 5,
          boxShadow: "0 18px 45px rgba(15,23,42,.10)",
          border: "1px solid rgba(148,163,184,.22)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={950} sx={{ mb: 1 }}>
            Executive Summary
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 2 }}>
            The ILP platform demonstrates strong maturity in governance,
            trustworthiness, architecture, deployment and responsible educational
            AI. The next doctoral priorities are expert validation, research
            instruments, pilot execution and scientific dissemination.
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label="Governance strong" color="success" />
            <Chip label="Architecture validated" color="success" />
            <Chip label="Ethics in preparation" color="warning" />
            <Chip label="Pilot pending" variant="outlined" />
            <Chip label="Publication pending" variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Consulting scientific and technological evidence...
          </Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <>
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
                      gap: 2,
                    },
                  }}
                >
                  <AccountTreeIcon color="primary" />

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight={950}>
                      {signal.title}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {signal.summary}
                    </Typography>
                  </Box>

                  <Chip
                    label={signal.status}
                    color="success"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </AccordionSummary>

                <AccordionDetails sx={{ px: 3, pb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={900}
                    sx={{ mb: 1 }}
                  >
                    Visible evidence
                  </Typography>

                  <Stack spacing={1}>
                    {signal.evidence.slice(0, 5).map((item) => (
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
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
};


