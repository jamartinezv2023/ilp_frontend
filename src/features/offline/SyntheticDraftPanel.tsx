import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { createSyntheticDraftStore, type DraftScope, type DraftStore, type SyntheticAnswer, type SyntheticDraft } from './syntheticDraftStore';
const defaultStore = createSyntheticDraftStore();
const copy = {
  es: {
    title: 'Borrador local sintético',
    boundary: 'Solo datos sintéticos. Aquí no se realiza inicio de sesión, autorización ni envío.',
    language: 'Idioma',
    question: 'Seleccione una respuesta sintética',
    save: 'Guardar en este dispositivo',
    checking: 'Comprobando almacenamiento local…',
    saved: 'Guardado en este dispositivo. No enviado.',
    recovered: 'Borrador local recuperado. No enviado.',
    unsaved: 'Cambios sin guardar.',
    error: 'No se pudo verificar el almacenamiento local. Su respuesta permanece en pantalla; no se confirmó el guardado.',
    retry: 'Reintentar recuperación',
    response: 'Respuesta sintética',
  },
  en: {
    title: 'Synthetic local draft',
    boundary: 'Synthetic data only. No login, authorization or submission is performed here.',
    language: 'Language',
    question: 'Choose a synthetic response',
    save: 'Save on this device',
    checking: 'Checking local storage…',
    saved: 'Saved on this device. Not submitted.',
    recovered: 'Local draft recovered. Not submitted.',
    unsaved: 'Changes not saved.',
    error: 'Local storage could not be verified. Your response remains on screen; no save was confirmed.',
    retry: 'Retry recovery',
    response: 'Synthetic response',
  },
};

type DraftStatus = 'unsaved' | 'saved' | 'recovered' | 'error';
type PanelProps = Readonly<{ scope: DraftScope; store?: DraftStore }>;
type SessionProps = Readonly<{ scope: DraftScope; store: DraftStore }>;
export function SyntheticDraftPanel({ scope, store = defaultStore }: PanelProps) {
  return <DraftSession key={JSON.stringify(scope)} scope={scope} store={store} />;
}
function DraftSession({ scope, store }: SessionProps) {
  const { locale, setLocale } = useI18n();
  const text = copy[locale];
  const [draft, setDraft] = useState<SyntheticDraft>();
  const [answer, setAnswer] = useState<SyntheticAnswer>('');
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<DraftStatus>('unsaved');
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
    <h1>{text.title}</h1>
    <p>{text.boundary}</p>
    <label>{text.language} <select aria-label={text.language} value={locale}
      onChange={event => setLocale(event.target.value === 'en' ? 'en' : 'es')}>
      <option value="es">Español</option><option value="en">English</option>
    </select></label>
    <p translate="no">SYNTHETIC_P02 · {scope.instrumentVersion}</p>
    <p data-testid="attempt" translate="no">{draft?.administrationId}</p>
    <fieldset disabled={busy || !ready}>
      <legend>{text.question}</legend>
      {(['A', 'B'] as const).map(value => <label key={value} style={{ display: 'block' }}>
        <input type="radio" name="synthetic-answer" value={value} checked={answer === value}
          onChange={() => { setAnswer(value); setStatus('unsaved'); }} />
        {text.response} {value}
      </label>)}
    </fieldset>
    <button disabled={busy || !ready} onClick={() => { save().catch(() => setStatus('error')); }}>
      {text.save}</button>
    {busy && <output>{text.checking}</output>}
    {status === 'saved' && <output>{text.saved}</output>}
    {status === 'recovered' && <output>{text.recovered}</output>}
    {status === 'unsaved' && !busy && <output>{text.unsaved}</output>}
    {status === 'error' && <p role="alert">{text.error}</p>}
    {!ready && !busy && <button onClick={() => { setBusy(true); setAttempt(value => value + 1); }}>
      {text.retry}</button>}
  </main>;
}
