import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar, Badge, Box, Button, Chip, CssBaseline, Divider, Drawer,
  FormControl, IconButton, InputAdornment, InputLabel, List, ListItemButton,
  ListItemIcon, ListItemText, MenuItem, Select, Stack, TextField, Toolbar,
  Tooltip, Typography,
  useMediaQuery, useTheme,
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
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import SecurityIcon from "@mui/icons-material/Security";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LanguageIcon from "@mui/icons-material/Language";
import { AppRoutes } from "../routes/AppRoutes";
import { useAppDispatch } from "../store/hooks";
import { logout } from "../features/auth/store/authSlice";
import { useI18n } from "../i18n/I18nProvider";
import { messages, type MessageKey } from "../i18n/messages";

const expandedWidth = 288;
const collapsedWidth = 80;

type NavItem = { key: MessageKey; icon: ReactNode; path: string };
const navigation: NavItem[] = [
  { key: "nav.institutional", icon: <SchoolIcon />, path: "/institutional" },
  { key: "nav.teacher", icon: <GroupsIcon />, path: "/teacher" },
  { key: "nav.students", icon: <PsychologyIcon />, path: "/students" },
  { key: "nav.inclusion", icon: <Diversity3Icon />, path: "/inclusion" },
  { key: "nav.family", icon: <FamilyRestroomIcon />, path: "/family" },
  { key: "nav.assessments", icon: <AssignmentTurnedInIcon />, path: "/assessments" },
  { key: "nav.forms", icon: <DynamicFormIcon />, path: "/assessment-definition-preview" },
  { key: "nav.adaptive", icon: <AutoAwesomeIcon />, path: "/adaptive" },
  { key: "nav.research", icon: <ScienceIcon />, path: "/research" },
  { key: "nav.security", icon: <SecurityIcon />, path: "/security/mfa" },
  { key: "nav.administration", icon: <AdminPanelSettingsIcon />, path: "/administration" },
];

export const AccessibleAppShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, setLocale, t } = useI18n();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const width = collapsed ? collapsedWidth : expandedWidth;
  const filteredNavigation = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    if (!query) return navigation;
    return navigation.filter((item) => t(item.key).toLocaleLowerCase(locale).includes(query));
  }, [locale, search, t]);

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  const openRoute = (path: string) => {
    void navigate(path);
    setSearch("");
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "var(--ilp-navy)", color: "#fff" }}>
      <Box sx={{ p: collapsed ? 1.5 : 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={collapsed ? "center" : "flex-start"}>
          <Box
            component="img"
            src="/brand/ILP_simbolo_negativo.svg"
            alt=""
            aria-hidden="true"
            sx={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0 }}
          />
          {!collapsed && <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={900} lineHeight={1.15}>{t("shell.platform")}</Typography>
            <Typography variant="caption" sx={{ color: "#dbeafe" }}>{t("shell.subtitle")}</Typography>
          </Box>}
        </Stack>
        {!collapsed && <Chip label={t("shell.product")} size="small" variant="outlined" sx={{ mt: 2, color: "#fff", borderColor: "#93c5fd" }} />}
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,.24)" }} />
      <List aria-label={t("shell.nav")} sx={{ flexGrow: 1, px: 1, py: 1.5 }}>
        {filteredNavigation.map((item) => {
          const label = t(item.key);
          const selected = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return <Tooltip key={item.path} title={collapsed ? label : ""} placement="right" arrow>
            <ListItemButton
              selected={selected}
              aria-label={label}
              aria-current={selected ? "page" : undefined}
              onClick={() => openRoute(item.path)}
              sx={{
                minHeight: 48, mb: 0.5, borderRadius: 2.5, color: "#fff",
                justifyContent: collapsed ? "center" : "flex-start",
                "&.Mui-selected": { bgcolor: "var(--ilp-blue)" },
                "&.Mui-selected:hover": { bgcolor: "#174DB8" },
                "&:hover": { bgcolor: "rgba(255,255,255,.14)" },
              }}
            >
              <ListItemIcon aria-hidden="true" sx={{ color: "inherit", minWidth: collapsed ? 0 : 42, justifyContent: "center" }}>{item.icon}</ListItemIcon>
              {!collapsed && <ListItemText primary={label} />}
            </ListItemButton>
          </Tooltip>;
        })}
        {filteredNavigation.length === 0 && !collapsed && (
          <Typography role="status" sx={{ px: 2, py: 1.5, color: "#dbeafe" }}>
            {t("shell.searchNoResults")}
          </Typography>
        )}
      </List>
      <Box sx={{ p: 1 }}>
        <Button
          fullWidth
          startIcon={!collapsed ? <LogoutIcon /> : undefined}
          onClick={() => dispatch(logout())}
          aria-label={t("shell.logout")}
          sx={{ minHeight: 46, minWidth: 0, color: "#fff", bgcolor: "rgba(255,255,255,.12)" }}
        >
          {collapsed ? <LogoutIcon /> : t("shell.logout")}
        </Button>
      </Box>
    </Box>
  );

  return <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
    <CssBaseline />
    <a className="ilp-skip-link" href="#main-content">{t("shell.skip")}</a>
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${width}px)` }, ml: { md: `${width}px` },
        bgcolor: "rgba(255,255,255,.97)", color: "var(--ilp-charcoal)", borderBottom: "1px solid var(--ilp-light)",
        transition: "width .2s ease, margin-left .2s ease",
      }}
    >
      <Toolbar sx={{ gap: { xs: 0.5, sm: 1.25 }, minHeight: { xs: 64, md: 72 } }}>
        <Tooltip title={collapsed ? t("shell.expand") : t("shell.collapse")}>
          <IconButton
            onClick={() => isMobile ? setMobileOpen((value) => !value) : setCollapsed((value) => !value)}
            aria-label={isMobile ? t("shell.open") : collapsed ? t("shell.expand") : t("shell.collapse")}
            aria-expanded={isMobile ? mobileOpen : !collapsed}
          >
            {isMobile || collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
        <Typography variant="h6" fontWeight={900} sx={{ display: { xs: "none", xl: "block" }, whiteSpace: "nowrap" }}>{t("shell.title")}</Typography>
        <TextField
          size="small"
          placeholder={t("shell.search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && filteredNavigation[0]) openRoute(filteredNavigation[0].path);
            if (event.key === "Escape") setSearch("");
          }}
          helperText={search ? t("shell.searchHint") : undefined}
          inputProps={{ "aria-label": t("shell.searchLabel"), "aria-controls": "primary-navigation-results" }}
          sx={{ display: "flex", flexGrow: 1, maxWidth: 620, minWidth: { xs: 80, sm: 120 }, bgcolor: "#fff", "& .MuiFormHelperText-root": { position: "absolute", top: "100%", bgcolor: "white", m: 0, p: 0.5 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon aria-hidden="true" /></InputAdornment> }}
        />
        <Box sx={{ flexGrow: { xs: 1, sm: 0 } }} />
        <FormControl size="small" sx={{ minWidth: { xs: 94, sm: 132 } }}>
          <InputLabel id="global-language-label">{t("language.label")}</InputLabel>
          <Select
            labelId="global-language-label"
            value={locale}
            label={t("language.label")}
            onChange={(event) => {
              const nextLocale = event.target.value as "es" | "en";
              setLocale(nextLocale);
              setAnnouncement(messages[nextLocale]["shell.languageChanged"]);
            }}
            inputProps={{ "aria-label": t("language.change") }}
            startAdornment={<LanguageIcon aria-hidden="true" sx={{ mr: 0.5 }} />}
          >
            <MenuItem value="es">{t("language.spanish")}</MenuItem>
            <MenuItem value="en">{t("language.english")}</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title={t("shell.notifications")}><IconButton aria-label={t("shell.notifications")} sx={{ display: { xs: "none", md: "inline-flex" } }}><Badge badgeContent={3} color="error"><NotificationsIcon /></Badge></IconButton></Tooltip>
        <Tooltip title={t("shell.help")}><IconButton aria-label={t("shell.help")} sx={{ display: { xs: "none", lg: "inline-flex" } }}><HelpOutlineIcon /></IconButton></Tooltip>
        <Chip label={t("shell.online")} variant="outlined" sx={{ display: { xs: "none", lg: "flex" }, color: "#166534", borderColor: "#15803d" }} />
      </Toolbar>
    </AppBar>

    <Box component="nav" aria-label={t("shell.nav")} sx={{ width: { md: width }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: "min(88vw, 320px)" } }}
      ><Box id="primary-navigation-results" sx={{ height: "100%" }}>{drawer}</Box></Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width, boxSizing: "border-box", border: 0, transition: "width .2s ease" } }}
      ><Box id="primary-navigation-results-desktop" sx={{ height: "100%" }}>{drawer}</Box></Drawer>
    </Box>

    <Box ref={mainRef} component="main" id="main-content" tabIndex={-1} sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, lg: 3 }, minWidth: 0, maxWidth: "100%" }}>
      <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }} />
      <AppRoutes />
      <Box className="ilp-visually-hidden" role="status" aria-live="polite" aria-atomic="true">{announcement}</Box>
      <Box component="footer" sx={{ mt: 4, py: 2, textAlign: "center", color: "#475569" }}>
        <Typography variant="body2">{t("shell.footer")}</Typography>
      </Box>
    </Box>
  </Box>;
};
