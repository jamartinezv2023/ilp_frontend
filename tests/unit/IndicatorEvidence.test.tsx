import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
const api = vi.hoisted(() => ({ fetchStudents: vi.fn() }));
vi.mock('../../src/services/studentApi', () => api);
vi.mock('../../src/components/StudentServiceStatusAlert', () => ({ StudentServiceStatusAlert: () => null }));
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { InclusionPiarPage } from '../../src/pages/inclusion/InclusionPiarPage';
import { InstitutionalOverviewPage } from '../../src/pages/institutional/InstitutionalOverviewPage';
const profiles = ['HIGH', 'MEDIUM', 'LOW', 'UNSPECIFIED'].map((supportLevel, index) => ({
  id: String(index), fullName: `Synthetic ${index}`, grade: 'TEST', age: null,
  learningProfile: 'Unassessed', vocationalInterest: 'Unassessed', supportLevel,
  inclusiveStrategies: [], pedagogicalRecommendations: [],
}));
beforeEach(() => { api.fetchStudents.mockReset(); });
describe('Indicators require evidence', () => {
  it.each(['es', 'en'])('does not publish fixed institutional figures in %s', locale => {
    localStorage.setItem('ilp.locale', locale);
    render(<I18nProvider><InstitutionalOverviewPage /></I18nProvider>);
    for (const value of ['128', '342', '86', '74', '82%', '78%', '69%', '61%']) {
      expect(screen.queryByText(value)).toBeNull();
    }
    expect(screen.getAllByText(locale === 'es' ? /Indicadores institucionales no disponibles/ : /Institutional indicators are unavailable/).length).toBeGreaterThan(0);
  });
  it.each(['es', 'en'])('labels the measured support share without asserting PIAR readiness in %s', async locale => {
    localStorage.setItem('ilp.locale', locale);
    api.fetchStudents.mockResolvedValue(profiles);
    render(<I18nProvider><InclusionPiarPage /></I18nProvider>);
    expect(await screen.findByText('50%')).toBeTruthy();
    expect(screen.getByText(locale === 'es' ? 'Proporción de perfiles con apoyo medio o alto' : 'Share of profiles with medium or high support')).toBeTruthy();
    expect(screen.getByText(locale === 'es' ? /La preparación PIAR no se ha medido/ : /PIAR readiness has not been measured/)).toBeTruthy();
    for (const value of ['82%', '74%', '68%']) expect(screen.queryByText(value)).toBeNull();
  });
  it('does not convert absent profiles into measured zero-percent readiness', async () => {
    api.fetchStudents.mockResolvedValue([]);
    render(<I18nProvider><InclusionPiarPage /></I18nProvider>);
    await screen.findAllByText('—');
    expect(screen.queryByText('0%')).toBeNull();
  });
  it('does not display zero counts as successful measurements after access denial', async () => {
    api.fetchStudents.mockImplementation(async () => { throw new Error('ACCESS_DENIED'); });
    render(<I18nProvider><InclusionPiarPage /></I18nProvider>);
    await screen.findByText(/No fue posible cargar/);
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('0%')).toBeNull();
  });
});
