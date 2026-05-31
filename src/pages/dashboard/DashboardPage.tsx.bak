import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
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
    value: "HIGH",
    description: "Scientific validation pathway is active.",
    icon: <ScienceIcon color="primary" />,
  },
  {
    title: "Ethics Readiness",
    value: "PREPARATION",
    description: "Human oversight and consent planning enabled.",
    icon: <GppGoodIcon color="success" />,
  },
  {
    title: "AI Governance",
    value: "ACTIVE",
    description: "Responsible educational AI policies available.",
    icon: <PsychologyIcon color="secondary" />,
  },
  {
    title: "Deployment Readiness",
    value: "CLOUD-NATIVE",
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
          mb: 4,
          p: { xs: 3, md: 5 },
          borderRadius: 6,
          background:
            "linear-gradient(135deg, rgba(37,99,235,.14), rgba(124,58,237,.16), rgba(14,165,233,.12))",
          border: "1px solid rgba(148,163,184,.25)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <DashboardIcon color="primary" sx={{ fontSize: 42 }} />
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

        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 980 }}>
          Vista ejecutiva de la plataforma ILP para seguimiento de madurez
          científica, ética, tecnológica y de despliegue en el marco de la
          investigación doctoral sobre inteligencia artificial educativa inclusiva.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        {metrics.map((metric) => (
          <Card
            key={metric.title}
            sx={{
              borderRadius: 5,
              boxShadow: "0 18px 45px rgba(15,23,42,.10)",
              border: "1px solid rgba(148,163,184,.22)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {metric.icon}
                <Typography fontWeight={900}>{metric.title}</Typography>
              </Stack>

              <Typography variant="h4" fontWeight={950} sx={{ mt: 2 }}>
                {metric.value}
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1 }}>
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
          gap: 3,
        }}
      >
        <Card
          sx={{
            borderRadius: 6,
            boxShadow: "0 24px 70px rgba(15,23,42,.12)",
            border: "1px solid rgba(148,163,184,.24)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <ScienceIcon color="primary" />
              <Typography variant="h5" fontWeight={950}>
                Doctoral Research Progress
              </Typography>
            </Stack>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
              La plataforma ha evolucionado desde un sistema funcional hacia un
              entorno de investigación validable, con evidencias de gobernanza,
              explicabilidad, equidad, seguridad, arquitectura y preparación para
              pilotaje.
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
            borderRadius: 6,
            boxShadow: "0 24px 70px rgba(15,23,42,.12)",
            border: "1px solid rgba(148,163,184,.24)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <SecurityIcon color="primary" />
              <Typography variant="h5" fontWeight={950}>
                Institutional Readiness
              </Typography>
            </Stack>

            <Stack spacing={2}>
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
          mt: 4,
          p: 3,
          borderRadius: 5,
          background: "rgba(255,255,255,.72)",
          border: "1px solid rgba(148,163,184,.22)",
        }}
      >
        <Typography variant="h6" fontWeight={900}>
          Inclusive Learning Platform (ILP)
        </Typography>
        <Typography color="text.secondary">
          Artificial Intelligence for Inclusive Education · Doctoral Research
          Validation Environment · Educational Technology Research · 2026
        </Typography>
      </Box>
    </Box>
  );
};

