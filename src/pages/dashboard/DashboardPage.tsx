import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SecurityIcon from "@mui/icons-material/Security";

const modules = [
  { title: "Users", value: "128", description: "Profiles and access control", icon: <PeopleIcon />, gradient: "linear-gradient(135deg,#2563eb,#06b6d4)" },
  { title: "Roles", value: "12", description: "Dynamic institutional roles", icon: <AdminPanelSettingsIcon />, gradient: "linear-gradient(135deg,#7c3aed,#ec4899)" },
  { title: "Permissions", value: "46", description: "Granular authorization rules", icon: <VpnKeyIcon />, gradient: "linear-gradient(135deg,#059669,#22c55e)" },
  { title: "Security", value: "MFA", description: "JWT RS256 + Google Authenticator", icon: <SecurityIcon />, gradient: "linear-gradient(135deg,#f97316,#ef4444)" },
];

export const DashboardPage = () => {
  return (
    <Box>
      <Box
        sx={{
          mt: 2,
          mb: 4,
          p: { xs: 3, md: 5 },
          borderRadius: 7,
          color: "white",
          background: "linear-gradient(135deg,#2563eb 0%,#7c3aed 55%,#ec4899 100%)",
          boxShadow: "0 28px 70px rgba(79,70,229,.35)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 80% 20%,rgba(255,255,255,.28),transparent 30%)",
          }}
        />
        <Box sx={{ position: "relative" }}>
          <Chip
            label="Premium Enterprise Workspace"
            sx={{
              mb: 2,
              color: "white",
              background: "rgba(255,255,255,.18)",
              backdropFilter: "blur(12px)",
            }}
          />
          <Typography variant="h3" fontWeight={950}>
            ILP Dashboard
          </Typography>
          <Typography sx={{ mt: 1, maxWidth: 720, opacity: 0.9 }}>
            Secure, accessible and inclusive platform for authentication, users, roles and permissions.
          </Typography>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder="Search modules, users, roles, permissions..."
        sx={{
          mb: 3,
          bgcolor: "rgba(255,255,255,.82)",
          borderRadius: 4,
          backdropFilter: "blur(14px)",
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={3}>
        {modules.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 6, lg: 3 }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 6,
                background: "rgba(255,255,255,.86)",
                backdropFilter: "blur(18px)",
                boxShadow: "0 18px 48px rgba(15,23,42,.12)",
                transition: "all .25s ease",
                border: "1px solid rgba(255,255,255,.65)",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 26px 70px rgba(15,23,42,.18)",
                },
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 5,
                      background: item.gradient,
                      color: "white",
                      boxShadow: "0 16px 34px rgba(15,23,42,.18)",
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Box>
                    <Typography variant="h4" fontWeight={950}>
                      {item.value}
                    </Typography>
                    <Typography variant="h6" fontWeight={850}>
                      {item.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>

                  <Chip label="Available" color="primary" variant="outlined" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
