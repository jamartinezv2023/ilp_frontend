import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '../../src/i18n/I18nProvider';
const fixture=vi.hoisted(()=>({ token:'synthetic-token' as string|null,history:vi.fn(),snapshot:vi.fn(),withdraw:vi.fn() }));
vi.mock('../../src/store/hooks',()=>({useAppSelector:()=>fixture.token}));
vi.mock('../../src/features/assessment-engine/services/authorizedScientificApi',()=>({authorizedScientificApi:()=>fixture}));
import { AuthorizedResearchPage } from '../../src/pages/research/AuthorizedResearchPage';
const observation={administrationId:'synthetic',assessmentCode:'SYNTHETIC',assessmentVersion:'TEST_ONLY',submittedAt:'2026-10-04',scores:[]};
const snapshot={csv:'synthetic,csv',manifest:{administrationId:'synthetic',consentEvidenceId:'evidence',sha256:'verified-hash'}};
beforeEach(()=>{fixture.token='synthetic-token';fixture.history.mockReset().mockResolvedValue([observation]);fixture.snapshot.mockReset().mockResolvedValue(snapshot);fixture.withdraw.mockReset().mockResolvedValue(undefined);});
function mount(locale:'es'|'en'='es'){localStorage.setItem('ilp.locale',locale);render(<I18nProvider><AuthorizedResearchPage/></I18nProvider>);}
async function load(en=false){fireEvent.change(screen.getByLabelText(en?'Institutional assignment ID':'Identificador de asignación institucional'),{target:{value:' assignment '}});fireEvent.click(screen.getByRole('button',{name:en?'Load history':'Consultar historial'}));await screen.findByRole('button',{name:en?'Verify dataset':'Verificar dataset'});}
describe('research UI authorization boundary',()=>{
 it.each(['es','en'] as const)('requires authentication with a single language in %s',locale=>{fixture.token=null;mount(locale);expect(screen.getByRole('status').textContent).toBe(locale==='es'?'Inicie sesión':'Sign in');expect(screen.queryByRole('textbox')).toBeNull();});
 it.each(['es','en'] as const)('reauthorizes every download and blocks a later rejection in %s',async locale=>{
  mount(locale);const en=locale==='en';await load(en);expect(fixture.history).toHaveBeenCalledWith('assignment');
  fireEvent.click(screen.getByRole('button',{name:en?'Verify dataset':'Verificar dataset'}));await screen.findByText('verified-hash');
  const create=vi.fn().mockReturnValue('blob:synthetic');const revoke=vi.fn();
  Object.defineProperty(URL,'createObjectURL',{value:create,configurable:true});Object.defineProperty(URL,'revokeObjectURL',{value:revoke,configurable:true});
  const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  fireEvent.click(screen.getByRole('button',{name:'CSV'}));await waitFor(()=>expect(click).toHaveBeenCalledTimes(1));
  expect(fixture.snapshot).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button',{name:en?'Manifest':'Manifiesto'}));await waitFor(()=>expect(click).toHaveBeenCalledTimes(2));
  expect(fixture.snapshot).toHaveBeenCalledTimes(3);expect(create).toHaveBeenCalledTimes(2);
  fixture.snapshot.mockRejectedValueOnce(new Error('withdrawn'));
  fireEvent.click(screen.getByRole('button',{name:'CSV'}));await screen.findByText(en?'Access denied or verification failed. No download is available.':'Acceso denegado o verificación fallida. No hay descarga disponible.');
  expect(click).toHaveBeenCalledTimes(2);expect(screen.queryByRole('button',{name:'CSV'})).toBeNull();
 });
 it('clears a verified snapshot when assignment changes',async()=>{
  mount();await load();fireEvent.click(screen.getByRole('button',{name:'Verificar dataset'}));await screen.findByText('verified-hash');
  fireEvent.change(screen.getByLabelText('Identificador de asignación institucional'),{target:{value:'other'}});
  expect(screen.queryByText('verified-hash')).toBeNull();expect(screen.queryByRole('button',{name:'Verificar dataset'})).toBeNull();
 });
 it.each(['es','en'] as const)('requires confirmation before withdrawing and clears access in %s',async locale=>{
  mount(locale);const en=locale==='en';await load(en);
  fireEvent.change(screen.getByLabelText(en?'Acceptance evidence ID':'Identificador de evidencia de aceptación'),{target:{value:' evidence '}});
  const confirm=vi.spyOn(window,'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  fireEvent.click(screen.getByRole('button',{name:en?'Withdraw consent':'Retirar consentimiento'}));expect(fixture.withdraw).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:en?'Withdraw consent':'Retirar consentimiento'}));await screen.findByText(en?'Consent withdrawn.':'Consentimiento retirado.');
  expect(fixture.withdraw).toHaveBeenCalledWith('evidence');expect(confirm).toHaveBeenCalledTimes(2);expect(screen.queryByRole('button',{name:en?'Verify dataset':'Verificar dataset'})).toBeNull();
 });
 it('shows denied history without leaving download controls',async()=>{
  fixture.history.mockRejectedValueOnce(new Error('403'));mount();fireEvent.change(screen.getByLabelText('Identificador de asignación institucional'),{target:{value:'assignment'}});fireEvent.click(screen.getByRole('button',{name:'Consultar historial'}));
  await screen.findByText('Acceso denegado o verificación fallida. No hay descarga disponible.');expect(screen.queryByRole('button',{name:'CSV'})).toBeNull();
 });
});
