import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../../src/i18n/I18nProvider';
const api = vi.hoisted(() => ({ fetchStudents: vi.fn(), fetchKolbAssessmentHistory: vi.fn() }));
vi.mock('../../src/services/studentApi', () => ({ fetchStudents: api.fetchStudents }));
vi.mock('../../src/services/assessmentApi', () => ({ fetchKolbAssessmentHistory: api.fetchKolbAssessmentHistory }));
import { AssessmentCenterPage } from '../../src/pages/assessment/AssessmentCenterPage';
beforeEach(() => { vi.resetAllMocks(); });
describe.each(['es','en'])('Legacy boundary in %s', locale => {
  const read = locale === 'en' ? 'Read history without submitting' : 'Consultar historial sin enviar';
  function mount() {
    localStorage.setItem('ilp.locale',locale);
    api.fetchStudents.mockResolvedValue([{id:'ST-001',fullName:'Synthetic High'}]);
    render(<MemoryRouter><I18nProvider><AssessmentCenterPage /></I18nProvider></MemoryRouter>);
  }
  it('explains the block and exposes no submit action', async () => {
    mount(); await screen.findByRole('button',{name:read});
    expect(screen.queryByRole('button',{name:/^(Aplicar|Submit real)/i})).toBeNull();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/research/authorized');
    expect(api.fetchKolbAssessmentHistory).not.toHaveBeenCalled();
  });
  it('distinguishes failed history from a valid empty history', async () => {
    api.fetchKolbAssessmentHistory.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    mount(); fireEvent.click(await screen.findByRole('button',{name:read}));
    await screen.findByText(locale === 'en' ? /This is not an empty history/ : /Esto no equivale/);
    await waitFor(() => expect(screen.getByRole('button',{name:read}).hasAttribute('disabled')).toBe(false));
    fireEvent.click(screen.getByRole('button',{name:read}));
    await screen.findByText(locale === 'en' ? /No legacy Kolb assessments were returned/ : /No se devolvieron evaluaciones/);
    expect(screen.queryByText(locale === 'en' ? /This is not an empty history/ : /Esto no equivale/)).toBeNull();
  });
});
