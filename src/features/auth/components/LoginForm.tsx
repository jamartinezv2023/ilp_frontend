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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import PsychologyIcon from "@mui/icons-material/Psychology";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SecurityIcon from "@mui/icons-material/Security";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { loginThunk } from "../store/authSlice";

export const LoginForm = () => {
  const dispatch = useAppDispatch();

  const {
    loading,
    error,
    mfaRequired,
    email: savedEmail,
    password: savedPassword,
    accessToken,
  } = useAppSelector((state) => state.auth);

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
        p: 3,
        background:
          "linear-gradient(135deg,#eef2ff 0%,#f8fafc 50%,#ede9fe 100%)",
      }}
    >
      <Grid container spacing={4} maxWidth="1200px">

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
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
                label="Doctoral Research Validation Environment"
                color="primary"
              />

              <Typography variant="h3" fontWeight={900}>
                Inclusive Learning Platform
              </Typography>

              <Typography variant="h6">
                Artificial Intelligence for Inclusive Education
              </Typography>

              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Plataforma de investigación doctoral orientada al apoyo de
                decisiones educativas mediante inteligencia artificial
                explicable, ética e inclusiva.
              </Typography>

              <Stack spacing={2} sx={{ mt: 2 }}>

                <Stack direction="row" spacing={2}>
                  <SchoolIcon />
                  <Typography>Inclusive Education</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <PsychologyIcon />
                  <Typography>Explainable Artificial Intelligence</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <SecurityIcon />
                  <Typography>Security, Privacy & Governance</Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <VerifiedUserIcon />
                  <Typography>Research Validation & Evidence</Typography>
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
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3} component="form" onSubmit={handleSubmit}>

                <Typography variant="h4" fontWeight={900}>
                  Research Platform Access
                </Typography>

                <Typography color="text.secondary">
                  Secure authentication for researchers, educators and
                  institutional stakeholders.
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                {accessToken && (
                  <Alert severity="success">
                    Authentication successful.
                  </Alert>
                )}

                {mfaRequired && (
                  <Alert severity="info">
                    Multi-factor authentication required.
                  </Alert>
                )}

                <TextField
                  label="Institutional Email"
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
                    label="MFA Verification Code"
                    fullWidth
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
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
                    ? "Verify Authentication"
                    : "Access Platform"}
                </Button>

              </Stack>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

