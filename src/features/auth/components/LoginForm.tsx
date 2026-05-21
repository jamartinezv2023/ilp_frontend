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
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { loginThunk } from "../store/authSlice";

export const LoginForm = () => {
  const dispatch = useAppDispatch();
  const { loading, error, mfaRequired, email: savedEmail, password: savedPassword, accessToken } =
    useAppSelector((state) => state.auth);

  const [email, setEmail] = useState(savedEmail ?? "admin@demo.com");
  const [password, setPassword] = useState(savedPassword ?? "Admin123*");
  const [mfaCode, setMfaCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch(
      loginThunk({
        email,
        password,
        mfaCode: mfaRequired && mfaCode ? Number(mfaCode) : undefined,
      })
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f5f7fb",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 440, borderRadius: 4, boxShadow: 6 }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={handleSubmit}>
            <Typography variant="h4" fontWeight={700}>
              ILP Login
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Auth Service + Google Authenticator MFA
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            {accessToken && (
              <Alert severity="success">
                Authentication successful. JWT stored in localStorage.
              </Alert>
            )}

            {mfaRequired && (
              <Alert severity="info">
                MFA required. Enter your Google Authenticator code.
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              disabled={mfaRequired}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              disabled={mfaRequired}
              onChange={(e) => setPassword(e.target.value)}
            />

            {mfaRequired && (
              <TextField
                label="Google Authenticator Code"
                type="number"
                fullWidth
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                inputProps={{ maxLength: 6 }}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : null}
            >
              {mfaRequired ? "Verify MFA" : "Login"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
