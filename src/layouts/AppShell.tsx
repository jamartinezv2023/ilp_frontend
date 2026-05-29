import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SecurityIcon from "@mui/icons-material/Security";
import LogoutIcon from "@mui/icons-material/Logout";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ScienceIcon from "@mui/icons-material/Science";
import { AppRoutes } from "../routes/AppRoutes";
import { useAppDispatch } from "../store/hooks";
import { logout } from "../features/auth/store/authSlice";

const drawerWidth = 310;

const navigationItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Users", icon: <PeopleIcon />, path: "/users" },
  { text: "Roles", icon: <AdminPanelSettingsIcon />, path: "/roles" },
  { text: "Permissions", icon: <VpnKeyIcon />, path: "/permissions" },
  { text: "Security Center", icon: <SecurityIcon />, path: "/security/mfa" },
  { text: "Research Center", icon: <ScienceIcon />, path: "/research" },
];

export const AppShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#0f172a,#1e293b)", color: "white" }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 58, height: 58, background: "linear-gradient(135deg,#38bdf8,#8b5cf6)", boxShadow: "0 16px 34px rgba(139,92,246,.45)" }}>
            ILP
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={900}>ILP Platform</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,.7)" }}>Premium Workspace</Typography>
          </Box>
        </Stack>

        <Chip
          icon={<AutoAwesomeIcon />}
          label="Secure MFA Enabled"
          size="small"
          variant="outlined"
          sx={{ mt: 3, color: "white", borderColor: "rgba(255,255,255,.25)", background: "rgba(255,255,255,.10)", backdropFilter: "blur(12px)" }}
        />
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,.12)" }} />

      <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{
              borderRadius: 4,
              mb: 1,
              color: "white",
              "&.Mui-selected": {
                background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                boxShadow: "0 14px 30px rgba(37,99,235,.38)",
              },
              "&:hover": { background: "rgba(255,255,255,.12)" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<LogoutIcon />}
          onClick={() => dispatch(logout())}
          sx={{ borderRadius: 4, py: 1.3, background: "rgba(255,255,255,.14)", boxShadow: "none", "&:hover": { background: "rgba(255,255,255,.22)" } }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` }, background: "rgba(255,255,255,.76)", color: "#0f172a", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(148,163,184,.24)" }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open navigation menu">
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" fontWeight={900} sx={{ display: { xs: "none", md: "block" } }}>
            Authenticated Workspace
          </Typography>

          <TextField
            size="small"
            placeholder="Search users, roles, permissions..."
            sx={{ flexGrow: 1, maxWidth: 520, bgcolor: "white", borderRadius: 3 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />

          <Tooltip title="Notifications">
            <IconButton>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Theme toggle">
            <IconButton>
              <DarkModeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Help">
            <IconButton>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>

          <Chip label="Online" color="success" variant="outlined" />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", border: 0 } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
        <Toolbar />
        <AppRoutes />
        <Box component="footer" sx={{ mt: 6, py: 3, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2">ILP Backend Platform 2026 - Inclusive - Secure - Accessible</Typography>
        </Box>
      </Box>
    </Box>
  );
};



