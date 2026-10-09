import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
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
import { useI18n } from "../../i18n/I18nProvider";

const makeIndicators = (t: ReturnType<typeof useI18n>["t"]) => [
  {
    title: t("institutional.explicit.0"),
    value: "—",
    detail: t("institutional.explicit.1"),
    icon: <GroupsIcon color="primary" />,
  },
  {
    title: t("institutional.explicit.2"),
    value: "—",
    detail: t("institutional.explicit.3"),
    icon: <PsychologyIcon color="secondary" />,
  },
  {
    title: t("institutional.explicit.4"),
    value: "—",
    detail: t("institutional.explicit.5"),
    icon: <Diversity3Icon color="success" />,
  },
  {
    title: t("institutional.explicit.6"),
    value: "—",
    detail: t("institutional.explicit.7"),
    icon: <FamilyRestroomIcon color="info" />,
  },
];

export const InstitutionalOverviewPage = () => {
  const { t } = useI18n();
  const indicators = makeIndicators(t);
  const priorities = [
    t("institutional.explicit.8"),
    t("institutional.explicit.9"),
    t("institutional.explicit.10"),
    t("institutional.priority.studentCentered"),
  ];

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>{t("institutional.metricsUnavailable")}</Alert>
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
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.25, sm: 2 }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ mb: 2, minWidth: 0, width: "100%" }}
        >
          <SchoolIcon color="primary" sx={{ fontSize: 42 }} />
          <Chip
            icon={<VerifiedUserIcon />}
            label={t("institutional.explicit.11")}
            color="primary"
            variant="outlined"
            sx={{ maxWidth: "100%", minWidth: 0 }}
          />
        </Stack>

        <Typography variant="h3" fontWeight={950} sx={{ mb: 1, fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>
          {t("institutional.explicit.12")}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 980 }}>
          {t("institutional.description")}
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
                {t("institutional.explicit.13")}
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Alert severity="info">
              {t("institutional.metricsUnavailable")}
            </Alert>
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
              {t("institutional.explicit.14")}
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

