import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { I18nProvider } from '../../src/i18n/I18nProvider';
const api=vi.hoisted(()=>({fetchKolbQuestions:vi.fn(),fetchKolbAssessmentHistory:vi.fn(),submitKolbAssessmentWithConfirmation:vi.fn(),isAssessmentSubmissionInvalid:vi.fn(),isAssessmentSubmissionBlocked:vi.fn(),kolbTimestampMatches:(a:unknown,b:unknown)=>a===b}));
vi.mock('../../src/services/assessmentApi',()=>api);
import { KolbRealForm } from '../../src/pages/assessment/components/KolbRealForm';
const result={assessmentId:'synthetic-record',studentId:'student',instrumentVersion:'TEST_ONLY',createdAt:'2026-10-04',learningStyle:'SYNTHETIC',scoreCE:4,scoreRO:3,scoreAC:2,scoreAE:1};
const question={id:'synthetic-q',questionOrder:1,text:'Synthetic fixture',options:['CE','RO','AC','AE'],instrument:'KOLB',instrumentVersion:'TEST_ONLY',dimension:'synthetic'};
beforeEach(()=>{
 api.fetchKolbQuestions.mockReset().mockResolvedValue([question]);api.fetchKolbAssessmentHistory.mockReset().mockResolvedValue([]);
 api.isAssessmentSubmissionBlocked.mockReset().mockReturnValue(false);
 api.submitKolbAssessmentWithConfirmation.mockReset();api.isAssessmentSubmissionInvalid.mockReset().mockReturnValue(false);
});
function mount(){const completed=vi.fn();const view=render(<I18nProvider><KolbRealForm studentId="student" onCompleted={completed}/></I18nProvider>);return {...view,completed};}
async function fill(){
 await screen.findByText('Synthetic fixture',{exact:false});
 const selects=screen.getAllByRole('combobox');
 for(let index=0;index<selects.length;index++){
  fireEvent.mouseDown(selects[index]);fireEvent.click(await screen.findByRole('option',{name:String(4-index)}));
 }
}
describe('Kolb UI transaction safeguards with synthetic fixture',()=>{
 it('does not submit incomplete ranks and disables reused choices',async()=>{
  mount();await screen.findByText('Synthetic fixture',{exact:false});
  expect((screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);fireEvent.click(await screen.findByRole('option',{name:'4'}));
  fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);expect(screen.getByRole('option',{name:'4'}).getAttribute('aria-disabled')).toBe('true');
  expect(api.submitKolbAssessmentWithConfirmation).not.toHaveBeenCalled();
 });
 it('reports loading failure and never enables submission',async()=>{
  api.fetchKolbQuestions.mockRejectedValue(new Error('offline'));api.fetchKolbAssessmentHistory.mockRejectedValue(new Error('offline'));
  mount();await screen.findByText('No fue posible cargar las preguntas de Kolb.');
  expect((screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}) as HTMLButtonElement).disabled).toBe(true);
 });
 it('completes only after persisted confirmation',async()=>{
  api.submitKolbAssessmentWithConfirmation.mockResolvedValue({result,history:[result],confirmed:true});
  const {completed}=mount();await fill();fireEvent.click(screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}));
  await waitFor(()=>expect(completed).toHaveBeenCalledWith(result));
  expect(api.submitKolbAssessmentWithConfirmation).toHaveBeenCalledExactlyOnceWith('student',[4,3,2,1]);
  await screen.findByText(/Registro confirmado en historial/);
 });
 it('blocks repeat submission while pending and confirms with GET only',async()=>{
  api.submitKolbAssessmentWithConfirmation.mockResolvedValue({result,history:[],confirmed:false});
  const {completed}=mount();await fill();fireEvent.click(screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}));
  const check=await screen.findByRole('button',{name:'Comprobar historial sin volver a enviar'});
  expect(completed).not.toHaveBeenCalled();expect((screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}) as HTMLButtonElement).disabled).toBe(true);
  api.fetchKolbAssessmentHistory.mockResolvedValueOnce([]);fireEvent.click(check);
  await screen.findByText('El registro aún no aparece en el historial. No lo vuelva a enviar.');
  api.fetchKolbAssessmentHistory.mockRejectedValueOnce(new Error('offline'));fireEvent.click(check);
  await screen.findByText('No fue posible consultar el historial. No vuelva a enviar.');
  api.fetchKolbAssessmentHistory.mockResolvedValueOnce([result]);fireEvent.click(check);
  await waitFor(()=>expect(completed).toHaveBeenCalledWith(result));expect(api.submitKolbAssessmentWithConfirmation).toHaveBeenCalledTimes(1);
 });
 it('distinguishes correctable rejection from uncertain delivery',async()=>{
  api.submitKolbAssessmentWithConfirmation.mockRejectedValue(new Error('validation'));api.isAssessmentSubmissionInvalid.mockReturnValue(true);
  mount();await fill();fireEvent.click(screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}));
  await waitFor(()=>expect(api.isAssessmentSubmissionInvalid).toHaveBeenCalled());
  await waitFor(()=>expect((screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}) as HTMLButtonElement).disabled).toBe(false));
  cleanup();api.isAssessmentSubmissionInvalid.mockReturnValue(false);api.submitKolbAssessmentWithConfirmation.mockRejectedValue(new Error('network'));
  mount();await fill();fireEvent.click(screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}));
  await screen.findByText(/El estado del envío es incierto/);
  fireEvent.click(screen.getByRole('button',{name:'Consultar historial sin volver a enviar'}));
  expect((screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}) as HTMLButtonElement).disabled).toBe(true);
 });
});

it('shows explicit blocking instead of uncertain delivery on 410',async()=>{
 localStorage.setItem('ilp.locale','es');
 api.isAssessmentSubmissionBlocked.mockReturnValue(true);
 api.submitKolbAssessmentWithConfirmation.mockRejectedValue(new Error('410'));
 const {completed}=mount();await fill();fireEvent.click(screen.getByRole('button',{name:'Enviar respuestas reales Kolb'}));
 await screen.findByText(/El envío está deshabilitado/);
 expect(screen.queryByText(/El estado del envío es incierto/)).toBeNull();
 expect(completed).not.toHaveBeenCalled();
 expect(api.submitKolbAssessmentWithConfirmation).toHaveBeenCalledTimes(1);
});
