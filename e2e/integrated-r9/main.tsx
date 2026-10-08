import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "../../src/app/AppProviders";
import { IntegratedLab } from "./IntegratedLab";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><AppProviders><IntegratedLab /></AppProviders></React.StrictMode>,
);
