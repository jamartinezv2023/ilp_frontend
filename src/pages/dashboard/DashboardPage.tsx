import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PsychologyIcon from "@mui/icons-material/Psychology";
import GppGoodIcon from "@mui/icons-material/GppGood";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import ScienceIcon from "@mui/icons-material/Science";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

const metrics = [
  {
    title: "Research Readiness",
    value: "92%",
    score: 92,
    description: "Scientific validation pathway is active.",
    icon: <ScienceIcon color="primary" />,
  },
  {
    title: "Ethics Readiness",
    value: "88%",
    score: 88,
    description: "Human oversight and consent planning enabled.",
    icon: <GppGoodIcon color="success" />,
  },
  {
    title: "Trustworthiness",
    value: "94%",
    score: 94,
    description: "Responsible educational AI policies available.",
    icon: <PsychologyIcon color="secondary" />,
  },
  {
    title: "Deployment Readiness",
    value: "96%",
    score: 96,
    description: "Docker, health checks and Kubernetes readiness validated.",
    icon: <CloudDoneIcon color="info" />,
  },
];

const evidenceAreas = [
  "Inclusive educational intelligence",
  "Explainability and trustworthiness",
  "Fairness and bias monitoring",
  "Research ethics readiness",
  "Expert validation preparation",
  "Research instruments validation",
  "OpenAPI contract governance",
  "Docker and Kubernetes deployment readiness",
];

export const DashboardPage = () => {
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
          <DashboardIcon color="primary" sx={{ fontSize: 38 }} />
          <Chip
            icon={<VerifiedUserIcon />}
            label="Doctoral Research Executive View"
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
          Executive Research Dashboard
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          Executive overview of scientific, ethical, technological and deployment
          maturity for the ILP doctoral research platform.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2.5,
          mb: 3,
        }}
      >
        {metrics.map((metric) => (
          <Card
            key={metric.title}
            sx={{
              height: "100%",
              minHeight: 168,
              borderRadius: 4,
              boxShadow: "0 16px 36px rgba(15,23,42,.09)",
              border: "1px solid rgba(148,163,184,.22)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {metric.icon}
                <Typography fontWeight={900}>{metric.title}</Typography>
              </Stack>

              <Typography variant="h4" fontWeight={950} sx={{ mt: 1.5 }}>
                {metric.value}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={metric.score}
                sx={{
                  mt: 1.5,
                  height: 9,
                  borderRadius: 8,
                  backgroundColor: "rgba(148,163,184,.25)",
                }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {metric.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.25fr .75fr",
          },
          gap: 2.5,
        }}
      >
        <Card
          sx={{
            height: "100%",
            borderRadius: 5,
            boxShadow: "0 20px 55px rgba(15,23,42,.10)",
            border: "1px solid rgba(148,163,184,.24)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <ScienceIcon color="primary" />
              <Typography variant="h5" fontWeight={950}>
                Doctoral Research Progress
              </Typography>
            </Stack>

            <Typography color="text.secondary" sx={{ mb: 2.5 }}>
              The platform has evolved into a research validation environment
              with governance, explainability, fairness, security, architecture
              and pilot readiness evidence.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {evidenceAreas.map((area) => (
                <Alert key={area} severity="info" variant="outlined">
                  {area}
                </Alert>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            height: "100%",
            borderRadius: 5,
            boxShadow: "0 20px 55px rgba(15,23,42,.10)",
            border: "1px solid rgba(148,163,184,.24)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <SecurityIcon color="primary" />
              <Typography variant="h5" fontWeight={950}>
                Institutional Readiness
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <Alert severity="success" variant="filled">
                Backend validated with PostgreSQL runtime.
              </Alert>

              <Alert severity="success" variant="filled">
                OpenAPI and Swagger documentation operational.
              </Alert>

              <Alert severity="success" variant="filled">
                Actuator health, liveness and readiness available.
              </Alert>

              <Alert severity="info" variant="outlined">
                Next focus: pilot protocol, ethics documentation, expert
                validation and research instruments.
              </Alert>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          mt: 3,
          p: 2.5,
          borderRadius: 4,
          background: "rgba(255,255,255,.72)",
          border: "1px solid rgba(148,163,184,.22)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={900}>
          Inclusive Learning Platform (ILP)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Doctoral Research Validation Environment · Educational Technology ·
          Explainable AI · Inclusive Education · 2026
        </Typography>
      </Box>
    </Box>
  );
};
