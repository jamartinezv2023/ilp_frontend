import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { createSyntheticDraftStore, type DraftScope, type DraftStore, type SyntheticAnswer, type SyntheticDraft } from './syntheticDraftStore';
const defaultStore = createSyntheticDraftStore();
export function SyntheticDraftPanel({ scope, store = defaultStore }: { scope: DraftScope; store?: DraftStore }) {
  return <DraftSession key={JSON.stringify(scope)} scope={scope} store={store} />;
}
function DraftSession({ scope, store }: { scope: DraftScope; store: DraftStore }) {
  const { locale, setLocale } = useI18n();
  const en = locale === 'en';
  const [draft, setDraft] = useState<SyntheticDraft>();
  const [answer, setAnswer] = useState<SyntheticAnswer>('');
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'unsaved' | 'saved' | 'recovered' | 'error'>('unsaved');
  useEffect(() => {
    let active = true;
    store.load(scope).then(value => {
      if (!active) return;
      setDraft(value); setAnswer(value?.answer ?? ''); setReady(true);
      setStatus(value ? 'recovered' : 'unsaved'); setBusy(false);
    }).catch(() => { if (active) { setStatus('error'); setBusy(false); } });
    return () => { active = false; };
  }, [scope, store, attempt]);
  async function save() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const value = await store.save(scope, draft?.revision ?? 0, answer);
      setDraft(value); setStatus('saved');
    } catch { setStatus('error'); }
    finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 800, margin: 'auto', padding: 16, overflowWrap: 'anywhere' }}>
    <h1>{en ? 'Synthetic local draft' : 'Borrador local sintético'}</h1>
    <p>{en ? 'Synthetic data only. No login, authorization or submission is performed here. Offline reopening is not yet enabled.'
      : 'Solo datos sintéticos. Aquí no se realiza inicio de sesión, autorización ni envío. La reapertura offline todavía no está habilitada.'}</p>
    <label>{en ? 'Language' : 'Idioma'} <select aria-label={en ? 'Language' : 'Idioma'} value={locale}
      onChange={event => setLocale(event.target.value === 'en' ? 'en' : 'es')}>
      <option value="es">Español</option><option value="en">English</option>
    </select></label>
    <p translate="no">SYNTHETIC_P02 · {scope.instrumentVersion}</p>
    <p data-testid="attempt" translate="no">{draft?.administrationId}</p>
    <fieldset disabled={busy || !ready}>
      <legend>{en ? 'Choose a synthetic response' : 'Seleccione una respuesta sintética'}</legend>
      {(['A', 'B'] as const).map(value => <label key={value} style={{ display: 'block' }}>
        <input type="radio" name="synthetic-answer" value={value} checked={answer === value}
          onChange={() => { setAnswer(value); setStatus('unsaved'); }} />
        {en ? `Synthetic response ${value}` : `Respuesta sintética ${value}`}
      </label>)}
    </fieldset>
    <button disabled={busy || !ready} onClick={() => { save().catch(() => setStatus('error')); }}>
      {en ? 'Save on this device' : 'Guardar en este dispositivo'}</button>
    {busy && <output>{en ? 'Checking local storage…' : 'Comprobando almacenamiento local…'}</output>}
    {status === 'saved' && <output>{en ? 'Saved on this device. Not submitted.' : 'Guardado en este dispositivo. No enviado.'}</output>}
    {status === 'recovered' && <output>{en ? 'Local draft recovered. Not submitted.' : 'Borrador local recuperado. No enviado.'}</output>}
    {status === 'unsaved' && !busy && <output>{en ? 'Changes not saved.' : 'Cambios sin guardar.'}</output>}
    {status === 'error' && <p role="alert">{en ? 'Local storage could not be verified. Your response remains on screen; no save was confirmed.'
      : 'No se pudo verificar el almacenamiento local. Su respuesta permanece en pantalla; no se confirmó el guardado.'}</p>}
    {!ready && !busy && <button onClick={() => { setBusy(true); setAttempt(value => value + 1); }}>
      {en ? 'Retry recovery' : 'Reintentar recuperación'}</button>}
  </main>;
}
