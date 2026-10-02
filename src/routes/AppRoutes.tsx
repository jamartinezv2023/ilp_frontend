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
import { AssessmentCenterPage } from "../pages/assessment/AssessmentCenterPage";
import { AssessmentDefinitionPreviewPage } from "../pages/assessment-definition-preview/AssessmentDefinitionPreviewPage";
import { LocalizedSurface } from "../i18n/LocalizedSurface";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

const routeTitles: Record<string, MessageKey> = {
  "/": "nav.institutional",
  "/institutional": "nav.institutional",
  "/teacher": "nav.teacher",
  "/students": "nav.students",
  "/inclusion": "nav.inclusion",
  "/family": "nav.family",
  "/adaptive": "nav.adaptive",
  "/assessments": "nav.assessments",
  "/assessment-definition-preview": "nav.forms",
  "/dashboard": "route.dashboard",
  "/research": "nav.research",
  "/security/mfa": "nav.security",
  "/administration": "nav.administration",
  "/users": "route.users",
  "/roles": "route.roles",
  "/permissions": "route.permissions",
};

export const AppRoutes = () => {
  const location = useLocation();
  const { t } = useI18n();
  const titleKey = routeTitles[location.pathname] ?? "shell.title";

  return (
    <LocalizedSurface>
      <h1 className="ilp-visually-hidden">{t(titleKey)}</h1>
      <Routes>
      <Route path="/" element={<Navigate to="/institutional" replace />} />
      <Route path="/institutional" element={<InstitutionalOverviewPage />} />
      <Route path="/teacher" element={<TeacherWorkspacePage />} />
      <Route path="/students" element={<StudentSupportPage />} />
      <Route path="/inclusion" element={<InclusionPiarPage />} />
      <Route path="/family" element={<FamilyEngagementPage />} />
      <Route path="/adaptive" element={<AdaptiveIntelligencePage />} />
      <Route path="/assessments" element={<AssessmentCenterPage />} />
      <Route path="/assessment-definition-preview" element={<AssessmentDefinitionPreviewPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/research" element={<ResearchCenterPage />} />
      <Route path="/security/mfa" element={<MfaPage />} />
      <Route path="/administration" element={<AdministrationPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/roles" element={<RolesPage />} />
      <Route path="/permissions" element={<PermissionsPage />} />
      </Routes>
    </LocalizedSurface>
  );
};

