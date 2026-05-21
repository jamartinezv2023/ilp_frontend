import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export const MfaPage = () => {
  return (
    <Box>
      <Typography variant="h3" fontWeight={900} mb={4}>
        MFA Security Center
      </Typography>

      <Card
        sx={{
          borderRadius: 6,
          maxWidth: 520,
          background: "rgba(255,255,255,.82)",
          backdropFilter: "blur(16px)",
        }}
      >
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={800}>
              Google Authenticator
            </Typography>

            <Typography color="text.secondary">
              Configure multi-factor authentication for your account.
            </Typography>

            <Box
              sx={{
                height: 240,
                borderRadius: 5,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg,#dbeafe,#ede9fe,#fce7f3)",
              }}
            >
              QR CODE PLACEHOLDER
            </Box>

            <TextField
              label="Authentication Code"
              placeholder="123456"
              fullWidth
            />

            <Button
              variant="contained"
              size="large"
              sx={{
                borderRadius: 4,
                py: 1.5,
                background:
                  "linear-gradient(135deg,#2563eb,#7c3aed)",
              }}
            >
              Verify MFA
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
