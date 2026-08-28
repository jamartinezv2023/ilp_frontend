import { useSyncExternalStore } from "react";
import { Alert, AlertTitle } from "@mui/material";

import {
  getStudentServiceStatus,
  subscribeStudentServiceStatus,
} from "../services/studentServiceStatus";

const failureMessages = {
  authentication: "La sesión no fue aceptada por el servicio. Vuelva a autenticarse.",
  authorization: "Su cuenta no tiene autorización para consultar estudiantes.",
  "not-found": "La ruta de estudiantes no está disponible en esta versión del backend.",
  unavailable: "El servicio continúa temporalmente indisponible después de los reintentos.",
  network: "No fue posible establecer comunicación con el servicio de estudiantes.",
  unexpected: "Ocurrió un error inesperado al consultar el servicio de estudiantes.",
} as const;

export const StudentServiceStatusAlert = () => {
  const state = useSyncExternalStore(
    subscribeStudentServiceStatus,
    getStudentServiceStatus,
    getStudentServiceStatus,
  );

  if (state.phase === "starting") {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>El servicio está iniciando</AlertTitle>
        Render está reactivando el backend. Reintento {state.attempt + 1} de{" "}
        {state.maxAttempts}; sus datos y su sesión permanecen intactos.
      </Alert>
    );
  }

  if (state.phase === "failed") {
    const authenticationFailure = state.failureKind === "authentication";

    return (
      <Alert severity={authenticationFailure ? "warning" : "error"} sx={{ mb: 3 }}>
        <AlertTitle>
          {authenticationFailure ? "Autenticación requerida" : "Servicio no disponible"}
        </AlertTitle>
        {failureMessages[state.failureKind]}
      </Alert>
    );
  }

  return null;
};
