import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { SyntheticDraftPanel } from './SyntheticDraftPanel';
import type { DraftScope } from './syntheticDraftStore';
import { prepareOfflineLab } from './prepareOfflineLab';
const labels = {
  es: { loading: 'Preparando reapertura sin conexión…', ready: 'Laboratorio preparado para reabrir sin conexión en este navegador.', unavailable: 'No se pudo preparar la reapertura sin conexión. Mantenga la conexión.', boundary: 'Solo laboratorio sintético. El acceso a cuentas y la sincronización no están habilitados.' },
  en: { loading: 'Preparing offline reopening…', ready: 'Laboratory ready to reopen offline in this browser.', unavailable: 'Offline reopening could not be prepared. Keep the connection available.', boundary: 'Synthetic laboratory only. Account access and synchronization are not enabled.' },
};
type PreparationStatus = 'loading' | 'ready' | 'unavailable';
export function OfflineLab({ scope }: Readonly<{ scope: DraftScope }>) {
  const { locale } = useI18n();
  const [status, setStatus] = useState<PreparationStatus>('loading');
  useEffect(() => {
    let active = true;
    prepareOfflineLab().then(value => { if (active) setStatus(value); });
    return () => { active = false; };
  }, []);
  return <>
    <section aria-label={locale === 'es' ? 'Disponibilidad local' : 'Local availability'} style={{ padding: 16 }}>
      <p role="status" data-testid="offline-preparation">{labels[locale][status]}</p>
      <p>{labels[locale].boundary}</p>
    </section>
    <SyntheticDraftPanel scope={scope} />
  </>;
}
