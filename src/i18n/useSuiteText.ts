import { useCallback } from "react";
import { useI18n } from "./I18nProvider";
import { suiteMessages } from "./suiteMessages";
/** Exact lookup for declared interface text only. Never pass personal API data. */
export const useSuiteText = () => {
 const { locale } = useI18n();
 return useCallback((source: string) => suiteMessages[source]?.[locale] ?? source, [locale]);
};
