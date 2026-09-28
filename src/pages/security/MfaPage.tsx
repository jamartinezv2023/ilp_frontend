import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useI18n } from "../../i18n/I18nProvider";
import { useAppSelector } from "../../store/hooks";
import { authApi, bearerHeaders } from "../../features/auth/services/authApi";

interface SetupResponse {
  secret: string;
  qrProvisioningUri: string;
}

export const MfaPage = () => {
  const { locale } = useI18n();
  const { accessToken, email } = useAppSelector((state) => state.auth);
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSetup = async () => {
    if (!accessToken || !email) return;
    setBusy(true);
    setError(null);
    try {
      const response = await authApi.post<SetupResponse>(
        "/auth/mfa/setup",
        { email },
        { headers: bearerHeaders(accessToken) },
      );
      setSetup(response.data);
    } catch {
      setError(
        locale === "es"
          ? "No fue posible iniciar la configuración MFA. Puede que ya esté configurada."
          : "MFA setup could not be started. It may already be configured.",
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!accessToken || !email || !/^\d{6}$/.test(code)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await authApi.post<boolean>(
        "/auth/mfa/verify",
        { email, code: Number(code) },
        { headers: bearerHeaders(accessToken) },
      );
      if (!response.data) {
        throw new Error("Invalid code");
      }
      setSuccess(true);
      setSetup(null);
      setCode("");
    } catch {
      setError(
        locale === "es"
          ? "El código no fue válido o ya expiró."
          : "The code was invalid or expired.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="h3" fontWeight={900} sx={{ mb: 1 }}>
        {locale === "es" ? "Autenticación multifactor" : "Multi-factor authentication"}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 820 }}>
        {locale === "es"
          ? "Proteja su cuenta mediante una aplicación autenticadora compatible con TOTP."
          : "Protect your account with a TOTP-compatible authenticator application."}
      </Typography>

      <Card sx={{ maxWidth: 760, borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            <SecurityIcon color="primary" sx={{ fontSize: 44 }} aria-hidden="true" />
            {error && <Alert severity="error" role="alert">{error}</Alert>}
            {success && (
              <Alert severity="success" role="status">
                {locale === "es" ? "MFA quedó activada correctamente." : "MFA was enabled successfully."}
              </Alert>
            )}

            {!setup && !success && (
              <Button
                variant="contained"
                onClick={startSetup}
                disabled={busy || !accessToken || !email}
                startIcon={busy ? <CircularProgress size={18} /> : <SecurityIcon />}
              >
                {locale === "es" ? "Configurar MFA" : "Set up MFA"}
              </Button>
            )}

            {setup && (
              <>
                <Alert severity="warning">
                  {locale === "es"
                    ? "El secreto se muestra una sola vez. No lo comparta ni lo incluya en capturas."
                    : "The secret is shown once. Do not share it or include it in screenshots."}
                </Alert>
                <TextField
                  label={locale === "es" ? "Clave de configuración" : "Setup key"}
                  value={setup.secret}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  inputProps={{ "aria-describedby": "mfa-setup-help" }}
                />
                <Typography id="mfa-setup-help" variant="body2" color="text.secondary">
                  {locale === "es"
                    ? "Introduzca esta clave manualmente en su aplicación autenticadora y genere un código de seis dígitos."
                    : "Enter this key manually in your authenticator app and generate a six-digit code."}
                </Typography>
                <TextField
                  label={locale === "es" ? "Código de verificación" : "Verification code"}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]{6}", maxLength: 6 }}
                  error={code.length > 0 && !/^\d{6}$/.test(code)}
                  helperText={
                    code.length > 0 && !/^\d{6}$/.test(code)
                      ? locale === "es" ? "Ingrese seis dígitos." : "Enter six digits."
                      : " "
                  }
                />
                <Button
                  variant="contained"
                  onClick={verify}
                  disabled={busy || !/^\d{6}$/.test(code)}
                  startIcon={busy ? <CircularProgress size={18} /> : <VerifiedUserIcon />}
                >
                  {locale === "es" ? "Verificar y activar" : "Verify and enable"}
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
