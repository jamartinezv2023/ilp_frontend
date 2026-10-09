import { Box, Card, CardContent, Typography } from "@mui/material";
import { useI18n } from "../../i18n/I18nProvider";

export const AdministrationPage = () => {
  const { t } = useI18n();
  return (
  <Box>
    <Card sx={{ borderRadius: 5 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h3" fontWeight={950} sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, overflowWrap: "anywhere" }}>{t("nav.administration")}</Typography>
        <Typography color="text.secondary">
          {t("administration.description")}
        </Typography>
      </CardContent>
    </Card>
  </Box>
  );
};

