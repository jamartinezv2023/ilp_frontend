import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import PsychologyIcon from "@mui/icons-material/Psychology";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SecurityIcon from "@mui/icons-material/Security";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  authenticationFailed,
  authenticationRequiresMfa,
  authenticationStarted,
  authenticationSucceeded,
} from "../store/authSlice";
import { login } from "../services/authApi";
import { useI18n } from "../../../i18n/I18nProvider";

export const LoginForm = () => {
  const dispatch = useAppDispatch();
  const { locale, setLocale, t } = useI18n();

  const {
    loading,
    error,
    mfaRequired,
    email: savedEmail,
    accessToken,
  } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState(savedEmail ?? "");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const emailError = submitted && !/^\S+@\S+\.\S+$/.test(email);
  const passwordError = submitted && password.length < 8;
  const mfaError = submitted && mfaRequired && (useRecoveryCode
    ? !/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(recoveryCode.toUpperCase())
    : !/^\d{6}$/.test(mfaCode));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const invalidMfa = mfaRequired && (useRecoveryCode
      ? !/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(recoveryCode.toUpperCase())
      : !/^\d{6}$/.test(mfaCode));
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || invalidMfa) return;

    dispatch(authenticationStarted());
    try {
      const response = await login({
        email,
        password,
        mfaCode: mfaRequired && !useRecoveryCode && mfaCode ? Number(mfaCode) : undefined,
        recoveryCode: mfaRequired && useRecoveryCode ? recoveryCode.toUpperCase() : undefined,
      });
      if (response.mfaRequired) {
        dispatch(authenticationRequiresMfa());
        setMfaCode("");
        return;
      }
      if (!response.accessToken) {
        throw new Error("Missing access token");
      }
      dispatch(authenticationSucceeded(response));
      setPassword("");
      setMfaCode("");
      setRecoveryCode("");
    } catch {
      dispatch(
        authenticationFailed(
          locale === "es"
            ? "No fue posible autenticar. Verifique sus credenciales e inténtelo nuevamente."
            : "Authentication failed. Check your credentials and try again.",
        ),
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: { xs: 2, sm: 3 },
        pt: { xs: 10, sm: 9 },
        background:
          "linear-gradient(135deg,#eef2ff 0%,#f8fafc 50%,#ede9fe 100%)",
      }}
    >
      <FormControl
        size="small"
        sx={{ position: "absolute", insetBlockStart: 16, insetInlineEnd: 16, minWidth: 150 }}
      >
        <InputLabel id="login-language-label">{t("language.label")}</InputLabel>
        <Select
          labelId="login-language-label"
          value={locale}
          label={t("language.label")}
          onChange={(event) => setLocale(event.target.value as "es" | "en")}
          inputProps={{ "aria-label": t("language.change") }}
        >
          <MenuItem value="es">{t("language.spanish")}</MenuItem>
          <MenuItem value="en">{t("language.english")}</MenuItem>
        </Select>
      </FormControl>
      <Grid container spacing={4} maxWidth="1200px">

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              height: "100%",
              borderRadius: 6,
              background:
                "linear-gradient(135deg,#1e293b,#0f172a)",
              color: "white",
            }}
          >
            <Stack spacing={3}>
              <Chip
                icon={<VerifiedUserIcon />}
                label={locale === "es" ? "Entorno de validación de investigación doctoral" : "Doctoral Research Validation Environment"}
                color="primary"
              />

              <Typography variant="h3" fontWeight={900}>
                {t("shell.platform")}
              </Typography>

              <Typography variant="h6">
                {t("shell.subtitle")}
              </Typography>

              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {locale === "es" ? "Plataforma de investigación doctoral orientada al apoyo de decisiones educativas mediante inteligencia artificial explicable, ética e inclusiva." : "Doctoral research platform supporting educational decisions through explainable, ethical and inclusive artificial intelligence."}
              </Typography>

              <Button component="a" href="/review/index.html" variant="outlined" sx={{ color: "white", borderColor: "white", alignSelf: "flex-start" }}>
                {locale === "es" ? "Abrir demostración para expertos (datos ficticios)" : "Open expert demonstration (fictional data)"}
              </Button>

              <Stack spacing={2} sx={{ mt: 2 }}>

                <Stack direction="row" spacing={2}>
                  <SchoolIcon />
                  <Typography>{locale === "es" ? "Educación inclusiva" : "Inclusive Education"}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <PsychologyIcon />
                  <Typography>{locale === "es" ? "Inteligencia artificial explicable" : "Explainable Artificial Intelligence"}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <SecurityIcon />
                  <Typography>{locale === "es" ? "Seguridad, privacidad y gobernanza" : "Security, Privacy & Governance"}</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <VerifiedUserIcon />
                  <Typography>{locale === "es" ? "Validación y evidencia de investigación" : "Research Validation & Evidence"}</Typography>
                </Stack>

              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              borderRadius: 6,
              boxShadow: "0 25px 60px rgba(15,23,42,.12)",
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={3} component="form" noValidate onSubmit={handleSubmit}>

                <Typography variant="h4" fontWeight={900}>
                  {locale === "es" ? "Acceso a la plataforma de investigación" : "Research Platform Access"}
                </Typography>

                <Typography color="text.secondary">
                  {locale === "es" ? "Autenticación segura para investigadores, educadores y actores institucionales." : "Secure authentication for researchers, educators and institutional stakeholders."}
                </Typography>

                {error && <Alert severity="error" role="alert" aria-live="assertive">{t("auth.failure")}</Alert>}

                {accessToken && (
                  <Alert severity="success">
                    {locale === "es" ? "Autenticación correcta." : "Authentication successful."}
                  </Alert>
                )}

                {mfaRequired && (
                  <Alert severity="info">
                    {locale === "es" ? "Se requiere autenticación multifactor." : "Multi-factor authentication required."}
                  </Alert>
                )}

                {mfaRequired && useRecoveryCode && (
                  <TextField
                    label={locale === "es" ? "Código de recuperación" : "Recovery Code"}
                    fullWidth
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    required
                    autoComplete="one-time-code"
                    inputProps={{ pattern: "[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}", maxLength: 14 }}
                    error={mfaError}
                    helperText={mfaError ? (locale === "es" ? "Use el formato XXXX-XXXX-XXXX." : "Use format XXXX-XXXX-XXXX.") : ""}
                  />
                )}

                {mfaRequired && (
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => {
                      setUseRecoveryCode((current) => !current);
                      setMfaCode("");
                      setRecoveryCode("");
                      setSubmitted(false);
                    }}
                  >
                    {useRecoveryCode
                      ? (locale === "es" ? "Usar aplicación autenticadora" : "Use authenticator app")
                      : (locale === "es" ? "Usar código de recuperación" : "Use recovery code")}
                  </Button>
                )}

                <TextField
                  label={locale === "es" ? "Correo institucional" : "Institutional Email"}
                  type="email"
                  fullWidth
                  value={email}
                  disabled={mfaRequired}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  error={emailError}
                  helperText={emailError ? (locale === "es" ? "Ingrese un correo electrónico válido." : "Enter a valid email address.") : ""}
                />

                <TextField
                  label={locale === "es" ? "Contraseña" : "Password"}
                  type="password"
                  fullWidth
                  value={password}
                  disabled={mfaRequired}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  error={passwordError}
                  helperText={passwordError ? (locale === "es" ? "La contraseña debe tener al menos 8 caracteres." : "The password must contain at least 8 characters.") : ""}
                />

                {mfaRequired && !useRecoveryCode && (
                  <TextField
                    label={locale === "es" ? "Código de verificación MFA" : "MFA Verification Code"}
                    fullWidth
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    required
                    autoComplete="one-time-code"
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]{6}", maxLength: 6 }}
                    error={mfaError}
                    helperText={mfaError ? (locale === "es" ? "Ingrese exactamente seis dígitos." : "Enter exactly six digits.") : ""}
                  />
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={18} /> : undefined
                  }
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 800,
                  }}
                >
                  {mfaRequired
                    ? (locale === "es" ? "Verificar autenticación" : "Verify Authentication")
                    : (locale === "es" ? "Acceder a la plataforma" : "Access Platform")}
                </Button>

              </Stack>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

