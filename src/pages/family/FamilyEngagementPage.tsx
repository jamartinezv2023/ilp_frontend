import { StudentServiceStatusAlert } from "../../components/StudentServiceStatusAlert";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
import FavoriteIcon from "@mui/icons-material/Favorite";
import type { StudentProfile } from "../../types/student";
import { fetchStudents } from "../../services/studentApi";
import { useI18n } from "../../i18n/I18nProvider";

export const FamilyEngagementPage = () => {
  const { t, translateBackendValue } = useI18n();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await fetchStudents();
      setStudents(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <Box>
      <StudentServiceStatusAlert />
      <Box
        sx={{
          mb: 3,
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background:
            "linear-gradient(135deg, rgba(236,72,153,.12), rgba(37,99,235,.10), rgba(16,185,129,.10))",
          border: "1px solid rgba(148,163,184,.24)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FamilyRestroomIcon color="primary" sx={{ fontSize: 42 }} />
          <Chip
            label={t("family.badge")}
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Typography variant="h3" fontWeight={950}>
          {t("family.title")}
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {t("family.description")}
        </Typography>
      </Box>

      {loading && (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label={t("status.loading")} />
        </Stack>
      )}

      {error && <Alert severity="error">{t("family.loadError")}</Alert>}

      {!loading && !error && students.length === 0 && (
        <Alert severity="info">{t("family.empty")}</Alert>
      )}

      {!loading && !error && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2,1fr)",
            },
            gap: 2.5,
          }}
        >
          {students.map((student) => (
            <Card
              key={student.id}
              sx={{
                borderRadius: 5,
                boxShadow: "0 16px 36px rgba(15,23,42,.09)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={950}>
                      {translateBackendValue(student.fullName)}
                    </Typography>

                    <Typography color="text.secondary">
                      {t("family.grade")} {translateBackendValue(student.grade)}
                    </Typography>
                  </Box>

                  <Chip
                    label={`${t("family.support")} ${translateBackendValue(student.supportLevel)}`}
                    color="primary"
                  />
                </Stack>

                <Typography
                  fontWeight={900}
                  sx={{ mt: 3, mb: 1 }}
                >
                  {t("family.learning")}
                </Typography>

                <Alert severity="success" variant="outlined">
                  {translateBackendValue(student.learningProfile)}
                </Alert>

                <Typography
                  fontWeight={900}
                  sx={{ mt: 3, mb: 1 }}
                >
                  {t("family.recommendations")}
                </Typography>

                <Stack spacing={1}>
                  {student.pedagogicalRecommendations.map((item) => (
                    <Alert
                      key={item}
                      severity="info"
                      variant="outlined"
                    >
                      {translateBackendValue(item)}
                    </Alert>
                  ))}
                </Stack>

                <Typography
                  fontWeight={900}
                  sx={{ mt: 3, mb: 1 }}
                >
                  {t("family.strategies")}
                </Typography>

                <Stack spacing={1}>
                  {student.inclusiveStrategies.map((item) => (
                    <Alert
                      key={item}
                      icon={<FavoriteIcon />}
                      severity="success"
                      variant="outlined"
                    >
                        {translateBackendValue(item)}
                    </Alert>
                  ))}
                </Stack>

                <Alert
                  icon={<SchoolIcon />}
                  severity="warning"
                  sx={{ mt: 3 }}
                >
                  {t("family.contact")}
                </Alert>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};
