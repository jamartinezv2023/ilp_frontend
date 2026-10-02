import { useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { AccessibleAppShell } from "./layouts/AccessibleAppShell";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { restoreSession } from "./features/auth/store/authSlice";
import { useI18n } from "./i18n/I18nProvider";

let restoreRequested = false;

function App() {
  const dispatch = useAppDispatch();
  const { locale } = useI18n();
  const { accessToken, initializing } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!restoreRequested) {
      restoreRequested = true;
      void dispatch(restoreSession());
    }
  }, [dispatch]);

  if (initializing) {
    return (
      <Box
        role="status"
        aria-live="polite"
        sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress aria-hidden="true" />
          <Typography sx={{ mt: 2 }}>
            {locale === "es" ? "Verificando sesión segura…" : "Checking secure session…"}
          </Typography>
        </Box>
      </Box>
    );
  }

  return accessToken ? (
    <AccessibleAppShell />
  ) : <LoginPage />;
}

export default App;

