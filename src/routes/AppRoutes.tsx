import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { UsersPage } from "../pages/users/UsersPage";
import { RolesPage } from "../pages/roles/RolesPage";
import { PermissionsPage } from "../pages/permissions/PermissionsPage";
import { MfaPage } from "../pages/security/MfaPage";
import { ResearchCenterPage } from "../pages/research/ResearchCenterPage";
import { InstitutionalOverviewPage } from "../pages/institutional/InstitutionalOverviewPage";
import { TeacherWorkspacePage } from "../pages/teacher/TeacherWorkspacePage";
import { StudentSupportPage } from "../pages/students/StudentSupportPage";
import { InclusionPiarPage } from "../pages/inclusion/InclusionPiarPage";
import { FamilyEngagementPage } from "../pages/family/FamilyEngagementPage";
import { AdministrationPage } from "../pages/administration/AdministrationPage";
import { AdaptiveIntelligencePage } from "../pages/adaptive/AdaptiveIntelligencePage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/institutional" replace />} />
      <Route path="/institutional" element={<InstitutionalOverviewPage />} />
      <Route path="/teacher" element={<TeacherWorkspacePage />} />
      <Route path="/students" element={<StudentSupportPage />} />
      <Route path="/inclusion" element={<InclusionPiarPage />} />
      <Route path="/family" element={<FamilyEngagementPage />} />
      <Route path="/adaptive" element={<AdaptiveIntelligencePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/research" element={<ResearchCenterPage />} />
      <Route path="/security/mfa" element={<MfaPage />} />
      <Route path="/administration" element={<AdministrationPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/roles" element={<RolesPage />} />
      <Route path="/permissions" element={<PermissionsPage />} />
    </Routes>
  );
};

