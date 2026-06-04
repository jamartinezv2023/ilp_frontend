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
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import PsychologyIcon from "@mui/icons-material/Psychology";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import ScienceIcon from "@mui/icons-material/Science";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import SecurityIcon from "@mui/icons-material/Security";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { AppRoutes } from "../routes/AppRoutes";
import { useAppDispatch } from "../store/hooks";
import { logout } from "../features/auth/store/authSlice";
import { researchIdentity } from "../shared/theme/researchIdentity";

const drawerExpandedWidth = 310;
const drawerCollapsedWidth = 88;

const navigationItems = [
  { text: "Institutional Overview", icon: <SchoolIcon />, path: "/institutional" },
  { text: "Teacher Workspace", icon: <GroupsIcon />, path: "/teacher" },
  { text: "Student Support", icon: <PsychologyIcon />, path: "/students" },
  { text: "Inclusion & PIAR", icon: <Diversity3Icon />, path: "/inclusion" },
  { text: "Family Engagement", icon: <FamilyRestroomIcon />, path: "/family" },
  { text: "Assessment Center", icon: <AssignmentTurnedInIcon />, path: "/assessments" },
  { text: "Adaptive Intelligence", icon: <AutoAwesomeIcon />, path: "/adaptive" },
  { text: "Research & Evaluation", icon: <ScienceIcon />, path: "/research" },
  { text: "Security & Privacy", icon: <SecurityIcon />, path: "/security/mfa" },
  { text: "Administration", icon: <AdminPanelSettingsIcon />, path: "/administration" },
];

export const AppShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentDrawerWidth = collapsed ? drawerCollapsedWidth : drawerExpandedWidth;

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg,#0f172a,#1e293b)",
        color: "white",
        overflowX: "hidden",
      }}
    >
      <Box sx={{ p: collapsed ? 2 : 3 }}>
        <Stack
          direction="row"
          spacing={collapsed ? 0 : 2}
          alignItems="center"
          justifyContent={collapsed ? "center" : "flex-start"}
        >
          <Avatar
            sx={{
              width: collapsed ? 52 : 58,
              height: collapsed ? 52 : 58,
              background: "linear-gradient(135deg,#38bdf8,#8b5cf6)",
              boxShadow: "0 16px 34px rgba(139,92,246,.45)",
              fontWeight: 900,
            }}
          >
            ILP
          </Avatar>

          {!collapsed && (
            <Box>
              <Typography variant="h5" fontWeight={900} lineHeight={1.1}>
                {researchIdentity.platformName}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,.72)" }}
              >
                {researchIdentity.subtitle}
              </Typography>
            </Box>
          )}
        </Stack>

        {!collapsed && (
          <Chip
            label="Educational Support Platform"
            size="small"
            variant="outlined"
            sx={{
              mt: 3,
              color: "white",
              borderColor: "rgba(255,255,255,.25)",
              background: "rgba(255,255,255,.10)",
              backdropFilter: "blur(12px)",
            }}
          />
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,.12)" }} />

      <List sx={{ flexGrow: 1, px: collapsed ? 1 : 2, py: 2 }}>
        {navigationItems.map((item) => {
          const selected =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);

          return (
            <Tooltip
              key={item.text}
              title={collapsed ? item.text : ""}
              placement="right"
              arrow
            >
              <ListItemButton
                selected={selected}
                aria-label={item.text}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 4,
                  mb: 1,
                  minHeight: 54,
                  color: "white",
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1.5 : 2,
                  "&.Mui-selected": {
                    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                    boxShadow: "0 14px 30px rgba(37,99,235,.38)",
                  },
                  "&:hover": { background: "rgba(255,255,255,.12)" },
                  "&:focus-visible": {
                    outline: "3px solid rgba(96,165,250,.95)",
                    outlineOffset: "2px",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "inherit",
                    minWidth: collapsed ? 0 : 44,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {!collapsed && <ListItemText primary={item.text} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Box sx={{ p: collapsed ? 1 : 2 }}>
        <Tooltip title={collapsed ? "Logout" : ""} placement="right" arrow>
          <Button
            fullWidth
            variant="contained"
            startIcon={!collapsed ? <LogoutIcon /> : undefined}
            onClick={() => dispatch(logout())}
            aria-label="Logout"
            sx={{
              minWidth: 0,
              borderRadius: 4,
              py: 1.3,
              background: "rgba(255,255,255,.14)",
              boxShadow: "none",
              "&:hover": { background: "rgba(255,255,255,.22)" },
              "&:focus-visible": {
                outline: "3px solid rgba(96,165,250,.95)",
                outlineOffset: "2px",
              },
            }}
          >
            {collapsed ? <LogoutIcon /> : "Logout"}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          background: "rgba(255,255,255,.82)",
          color: "#0f172a",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(148,163,184,.24)",
          transition: "width .25s ease, margin-left .25s ease",
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Tooltip title={collapsed ? "Expand navigation" : "Collapse navigation"}>
            <IconButton
              onClick={() => {
                if (window.innerWidth < 900) {
                  setMobileOpen(!mobileOpen);
                  return;
                }
                setCollapsed((value) => !value);
              }}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>

          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ display: { xs: "none", lg: "block" }, whiteSpace: "nowrap" }}
          >
            Inclusive Educational Support Environment
          </Typography>

          <TextField
            size="small"
            placeholder="Search students, supports, teachers, families or institutional evidence..."
            sx={{
              flexGrow: 1,
              maxWidth: 650,
              bgcolor: "white",
              borderRadius: 3,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Tooltip title="Notifications">
            <IconButton aria-label="Notifications">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Theme toggle">
            <IconButton aria-label="Theme toggle">
              <DarkModeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Help">
            <IconButton aria-label="Help">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>

          <Chip label="Online" color="success" variant="outlined" />
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: currentDrawerWidth },
          flexShrink: { md: 0 },
          transition: "width .25s ease",
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerExpandedWidth },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: currentDrawerWidth,
              boxSizing: "border-box",
              border: 0,
              transition: "width .25s ease",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          minWidth: 0,
          transition: "padding .25s ease",
        }}
      >
        <Toolbar />
        <AppRoutes />

        <Box
          component="footer"
          sx={{
            mt: 4,
            py: 2,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">
            Inclusive Learning Platform (ILP) · Educational Support · Inclusive Education · Research Validation · © 2026
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};


