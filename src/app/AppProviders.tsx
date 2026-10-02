import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "../store";
import { I18nProvider } from "../i18n/I18nProvider";

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <I18nProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </I18nProvider>
  </Provider>
);

