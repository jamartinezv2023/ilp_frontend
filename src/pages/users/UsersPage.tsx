import { Typography } from "@mui/material";
import { useI18n } from "../../i18n/I18nProvider";

export const UsersPage = () => {
  const { t } = useI18n();
  return (
    <Typography variant="h3" fontWeight={900}>
      {t("route.usersHeading")}
    </Typography>
  );
};

