import { Typography } from "@mui/material";
import { useI18n } from "../../i18n/I18nProvider";

export const PermissionsPage = () => {
  const { t } = useI18n();
  return (
    <Typography variant="h3" fontWeight={900} sx={{ overflowWrap: "anywhere", fontSize: { xs: "2rem", md: "3rem" } }}>
      {t("route.permissionsHeading")}
    </Typography>
  );
};

