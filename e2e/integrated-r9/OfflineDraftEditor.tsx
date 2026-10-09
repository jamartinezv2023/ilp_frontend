import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../src/i18n/I18nProvider';
import { unlockPreparedDraft, saveLocallyUnlockedDraft, lockPreparedDraft } from '../../src/features/offline/preparedDraftAccess';
import { institutionalOfflineConfigured } from '../../src/features/offline/institutionalOfflineAccess';
import { type SyntheticDraft } from '../../src/features/offline/syntheticDraftStore';
export function OfflineDraftEditor() {
  const { locale } = useI18n();
  const en = locale === 'en';
  const [passphrase, setPassphrase] = useState('');
  const [fixtureKey] = useState(() => new URLSearchParams(location.search).get('fixture') ?? 'es360');
  const [draft, setDraft] = useState<SyntheticDraft>();
  const currentDraft = useRef<SyntheticDraft | undefined>(undefined);
  currentDraft.current = draft;
  useEffect(() => () => lockPreparedDraft(currentDraft.current), []);
  const [choice, setChoice] = useState<'A' | 'B'>('A');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  async function unlock() {
    setBusy(true); setError(false);
    try {
      const value = await unlockPreparedDraft(fixtureKey, passphrase);
      setDraft(value); setChoice(value.answer === 'B' ? 'B' : 'A');
    } catch { setError(true); }
    finally { setPassphrase(''); setBusy(false); }
  }
  async function save() {
    if (!draft) return;
    setBusy(true); setError(false); setSaved(false);
    try { setDraft(await saveLocallyUnlockedDraft(fixtureKey, draft, choice)); setSaved(true); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return <section aria-label={en ? 'Local draft access' : 'Acceso local al borrador'}>
    <p>{en ? 'Local unlocking only. Reconnect and sign in online before synchronization.'
      : 'Solo desbloqueo local. Recupere la conexión e inicie sesión en línea antes de sincronizar.'}</p>
    {draft ? <>
      {institutionalOfflineConfigured() && <output data-testid="institutional-offline-identity">{en ? 'Prepared institutional identity verified for local editing. Online authorization is required to submit.' : 'Identidad institucional preparada verificada para edición local. El envío requiere autorización en línea.'}</output>}
      <p data-testid="offline-attempt" translate="no">{draft.administrationId}</p>
      <p translate="no">{draft.scope.assignmentId} · {draft.scope.instrumentVersion}</p>
      <fieldset disabled={busy}>
        <legend>{en ? 'Edit the synthetic draft' : 'Editar el borrador sintético'}</legend>
        {(['A', 'B'] as const).map(value => <label key={value} style={{ display: 'block' }}>
          <input type="radio" name="offline-response" checked={choice === value} onChange={() => { setChoice(value); setSaved(false); }} />
          {en ? `Local response ${value}` : `Respuesta local ${value}`}
        </label>)}
      </fieldset>
      <button disabled={busy} onClick={() => void save()}>{en ? 'Save local edit' : 'Guardar edición local'}</button>
      <button disabled={busy} onClick={() => { lockPreparedDraft(draft); setDraft(undefined); setSaved(false); setError(false); }}>{en ? 'Lock local draft' : 'Bloquear borrador local'}</button>
      {saved && <output>{en ? 'Local edit saved. Not submitted.' : 'Edición local guardada. No enviada.'}</output>}
    </> : <>
      <label>{en ? 'Device key' : 'Clave del dispositivo'}<input type="password" autoComplete="off" maxLength={128} value={passphrase}
        onChange={event => setPassphrase(event.target.value)} /></label>
      <button disabled={busy || passphrase.length < 12} onClick={() => void unlock()}>{en ? 'Unlock local draft' : 'Desbloquear borrador local'}</button>
    </>}
    {error && <p role="alert">{en ? 'Local access or saving failed. Your draft was preserved.' : 'Falló el acceso o guardado local. Se conservó su borrador.'}</p>}
  </section>;
}
