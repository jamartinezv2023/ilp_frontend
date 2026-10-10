import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider, useI18n } from '../../src/i18n/I18nProvider';
import { AssessmentDefinitionPreviewPage } from '../../src/pages/assessment-definition-preview/AssessmentDefinitionPreviewPage';
import type { AssessmentRendererModel } from '../../src/types/assessmentRenderer';
const api = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('../../src/services/assessmentRendererApi', () => ({ fetchAssessmentRenderer: api.fetch }));
function Switch() { const { setLocale } = useI18n(); return <button onClick={() => setLocale('en')}>Switch locale</button>; }
const fixture = (code: string, language: 'es' | 'en'): AssessmentRendererModel => ({
 code, version: 'synthetic-1', title: `Synthetic ${language}`, description: 'Synthetic preview only', instructions: 'Synthetic instructions',
 metadata: { originalEvidence: { editionId: 'Synthetic edition', publisher: 'Synthetic test publisher', language, instrumentVersion: 'synthetic-1', formSha256: 'a'.repeat(64), manualSha256: 'b'.repeat(64), scoringManualSha256: 'b'.repeat(64), scoringVersion: 'Synthetic scoring', authorizationReference: 'Synthetic fixture only', validationReference: 'Synthetic fixture only', validationPopulation: 'Synthetic fixture only', populationReviewReference: 'Synthetic fixture only', reviewReference: 'Synthetic fixture only', normApplicability: 'NOT_NORM_REFERENCED' }, code, name: 'Synthetic', author: 'Test', version: 'synthetic-1', instrumentType: 'CUSTOM', language, contentComplete: true, publicationStatus: 'APPROVED', sourceEdition: 'Synthetic edition', expectedQuestionCount: 1, estimatedMinutes: 1, objective: 'Test', copyrightNotice: 'Test fixture' },
 questions: [{ id: 'Q1', code: 'Q1', text: `Question ${language}`, dimension: 'TEST', questionType: 'IPSATIVE', required: true, orderIndex: 1,
 options: [1, 2, 3, 4].map(n => ({ id: `O${n}`, code: `O${n}`, text: `Option ${n}`, dimension: 'TEST', numericValue: n, weight: 1, orderIndex: n })) }],
});
beforeEach(() => { api.fetch.mockReset(); localStorage.setItem('ilp.locale', 'es'); });
function mount() { return render(<I18nProvider><Switch /><AssessmentDefinitionPreviewPage /></I18nProvider>); }
it('requests the selected edition and hides old content while changing language', async () => {
 api.fetch.mockImplementation((code, language) => Promise.resolve(fixture(code, language)));
 mount();
 expect(await screen.findByText('Synthetic es')).toBeTruthy();
 fireEvent.change(screen.getByRole('combobox', { name: 'Instrumento' }), { target: { value: 'KUDER_V1' } });
 await waitFor(() => expect(api.fetch).toHaveBeenLastCalledWith('KUDER_V1', 'es'));
 expect(await screen.findByText('Question es', { exact: false })).toBeTruthy();
 fireEvent.click(screen.getByText('Switch locale'));
 expect(screen.queryByText('Synthetic es')).toBeNull();
 expect(await screen.findByText('Synthetic en')).toBeTruthy();
 expect(api.fetch).toHaveBeenLastCalledWith('KUDER_V1', 'en');
 fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
 await waitFor(() => expect(api.fetch).toHaveBeenCalledTimes(4));
});
it.each(['es', 'en'] as const)('blocks incomplete %s content and recovers only after a successful retry', async language => {
 localStorage.setItem('ilp.locale', language);
 api.fetch.mockResolvedValueOnce({ ...fixture('KOLB_V1', language), questions: [] }).mockResolvedValue(fixture('KOLB_V1', language));
 mount();
 expect((await screen.findByRole('alert')).textContent).toContain(language === 'es' ? 'No hay una versión completa aprobada' : 'No complete approved English version');
 expect(screen.queryByText(`Synthetic ${language}`)).toBeNull();
 fireEvent.click(screen.getByRole('button', { name: language === 'es' ? 'Reintentar' : 'Retry' }));
 expect(await screen.findByText(`Synthetic ${language}`)).toBeTruthy();
});
it.each(['resolve', 'reject'] as const)('ignores a stale request that later %ss', async outcome => {
 let resolve!: (model: AssessmentRendererModel) => void;
 let reject!: (error: Error) => void;
 api.fetch.mockReturnValueOnce(new Promise<AssessmentRendererModel>((ok, fail) => { resolve = ok; reject = fail; })).mockResolvedValue(fixture('FELDER_SILVERMAN_V1', 'es'));
 mount();
 fireEvent.change(screen.getByRole('combobox', { name: 'Instrumento' }), { target: { value: 'FELDER_SILVERMAN_V1' } });
 expect(await screen.findByText('Synthetic es')).toBeTruthy();
 if (outcome === 'resolve') resolve(fixture('KOLB_V1', 'es')); else reject(new Error('Stale error'));
 await waitFor(() => expect(screen.getByText('FELDER_SILVERMAN_V1')).toBeTruthy());
 expect(screen.queryByText(/No hay una versión completa aprobada/)).toBeNull();
});
