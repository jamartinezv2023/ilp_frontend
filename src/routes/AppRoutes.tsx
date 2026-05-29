import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { UsersPage } from "../pages/users/UsersPage";
import { RolesPage } from "../pages/roles/RolesPage";
import { PermissionsPage } from "../pages/permissions/PermissionsPage";
import { MfaPage } from "../pages/security/MfaPage";
import { ResearchCenterPage } from "../pages/research/ResearchCenterPage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/roles" element={<RolesPage />} />
      <Route path="/permissions" element={<PermissionsPage />} />
      <Route path="/security/mfa" element={<MfaPage />} />
      <Route path="/research" element={<ResearchCenterPage />} />
    </Routes>
  );
};
