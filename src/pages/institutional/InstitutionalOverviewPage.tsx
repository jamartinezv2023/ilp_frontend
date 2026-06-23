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
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import PsychologyIcon from "@mui/icons-material/Psychology";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

const indicators = [
  {
    title: "Estudiantes con seguimiento activo",
    value: "128",
    detail: "Perfiles educativos priorizados para acompañamiento pedagógico.",
    icon: <GroupsIcon color="primary" />,
  },
  {
    title: "Recomendaciones pedagógicas",
    value: "342",
    detail: "Sugerencias educativas generadas para apoyar decisiones docentes.",
    icon: <PsychologyIcon color="secondary" />,
  },
  {
    title: "Apoyos inclusivos registrados",
    value: "86",
    detail: "Estrategias DUA, ajustes razonables y acciones de aula documentadas.",
    icon: <Diversity3Icon color="success" />,
  },
  {
    title: "Familias vinculadas",
    value: "74",
    detail: "Acudientes conectados al proceso de seguimiento educativo.",
    icon: <FamilyRestroomIcon color="info" />,
  },
];

const priorities = [
  "Identificar necesidades de apoyo educativo sin emitir diagnósticos clínicos.",
  "Acompañar al docente con recomendaciones pedagógicas comprensibles.",
  "Fortalecer el seguimiento institucional de inclusión y permanencia.",
  "Promover decisiones humanas, éticas, trazables y centradas en el estudiante.",
];

export const InstitutionalOverviewPage = () => {
  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background:
            "linear-gradient(135deg, rgba(37,99,235,.14), rgba(16,185,129,.14), rgba(124,58,237,.12))",
          border: "1px solid rgba(148,163,184,.25)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <SchoolIcon color="primary" sx={{ fontSize: 42 }} />
          <Chip
            icon={<VerifiedUserIcon />}
            label="Educational Community View"
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1 }}>
          Institutional Inclusion Overview
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          Vista institucional para directivos, docentes, orientadores y comunidad
          educativa. Resume el estado de acompañamiento, inclusión, apoyos
          pedagógicos y seguimiento educativo de la plataforma ILP.
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
        {indicators.map((item) => (
          <Card
            key={item.title}
            sx={{
              height: "100%",
              minHeight: 175,
              borderRadius: 4,
              boxShadow: "0 16px 36px rgba(15,23,42,.09)",
              border: "1px solid rgba(148,163,184,.22)",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {item.icon}
                <Typography fontWeight={900}>{item.title}</Typography>
              </Stack>

              <Typography variant="h3" fontWeight={950} sx={{ mt: 1.5 }}>
                {item.value}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {item.detail}
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
            lg: "1.15fr .85fr",
          },
          gap: 2.5,
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
              <TrendingUpIcon color="primary" />
              <Typography variant="h5" fontWeight={950}>
                Estado institucional de inclusión
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={900}>Seguimiento educativo</Typography>
                  <Typography fontWeight={900}>82%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={82} sx={{ mt: 1, height: 9, borderRadius: 8 }} />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={900}>Apoyo docente</Typography>
                  <Typography fontWeight={900}>78%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={78} sx={{ mt: 1, height: 9, borderRadius: 8 }} />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={900}>Ajustes razonables</Typography>
                  <Typography fontWeight={900}>69%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={69} sx={{ mt: 1, height: 9, borderRadius: 8 }} />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={900}>Participación familiar</Typography>
                  <Typography fontWeight={900}>61%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={61} sx={{ mt: 1, height: 9, borderRadius: 8 }} />
              </Box>
            </Stack>
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
              Prioridades educativas
            </Typography>

            <Stack spacing={1.5}>
              {priorities.map((priority) => (
                <Alert key={priority} severity="info" variant="outlined">
                  {priority}
                </Alert>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

