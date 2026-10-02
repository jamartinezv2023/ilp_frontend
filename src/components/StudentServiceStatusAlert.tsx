import { useSyncExternalStore } from "react";
import { Alert, AlertTitle } from "@mui/material";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

import {
  getStudentServiceStatus,
  subscribeStudentServiceStatus,
} from "../services/studentServiceStatus";

const failureMessages: Record<string, MessageKey> = {
  authentication: "studentService.authentication",
  authorization: "studentService.authorization",
  "not-found": "studentService.notFound",
  unavailable: "studentService.unavailable",
  network: "studentService.network",
  unexpected: "studentService.unexpected",
};

export const StudentServiceStatusAlert = () => {
  const { t } = useI18n();
  const state = useSyncExternalStore(
    subscribeStudentServiceStatus,
    getStudentServiceStatus,
    getStudentServiceStatus,
  );

  if (state.phase === "starting") {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>{t("studentService.startingTitle")}</AlertTitle>
        {t("studentService.startingPrefix")} {state.attempt + 1}{" "}
        {t("studentService.startingMiddle")} {state.maxAttempts}
        {t("studentService.startingSuffix")}
      </Alert>
    );
  }

  if (state.phase === "failed") {
    const authenticationFailure = state.failureKind === "authentication";

    return (
      <Alert severity={authenticationFailure ? "warning" : "error"} sx={{ mb: 3 }}>
        <AlertTitle>
          {t(authenticationFailure ? "studentService.authTitle" : "studentService.unavailableTitle")}
        </AlertTitle>
        {t(failureMessages[state.failureKind])}
      </Alert>
    );
  }

  return null;
};
