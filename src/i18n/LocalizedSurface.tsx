import { useEffect, useRef, type PropsWithChildren } from "react";
import { useI18n } from "./I18nProvider";

const translatableAttributes = ["aria-label", "placeholder", "title"] as const;

export const LocalizedSurface = ({ children }: PropsWithChildren) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { locale, translateLegacyText } = useI18n();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const localizeAttributes = (element: HTMLElement) => {
      for (const attribute of translatableAttributes) {
        const current = element.getAttribute(attribute);
        if (!current) continue;
        const translated = translateLegacyText(current);
        if (translated !== current) element.setAttribute(attribute, translated);
      }
    };
    const localize = (node: Node) => {
      const element = node instanceof Element ? node : node.parentElement;
      if (element?.closest('[translate="no"]')) return;
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const translated = translateLegacyText(node.textContent);
        if (translated !== node.textContent) node.textContent = translated;
      }

      if (node instanceof HTMLElement) localizeAttributes(node);

      for (const child of Array.from(node.childNodes)) localize(child);
    };

    localize(root);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") localize(mutation.target);
        for (const node of Array.from(mutation.addedNodes)) localize(node);
        if (mutation.type === "attributes") localize(mutation.target);
      }
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: [...translatableAttributes],
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [locale, translateLegacyText]);

  return (
    <div ref={rootRef} data-ilp-language={locale} style={{ minWidth: 0 }}>
      {children}
    </div>
  );
};
