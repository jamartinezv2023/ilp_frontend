import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { ResearchCenterPage } from '../../src/pages/research/ResearchCenterPage';
const api = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('../../src/services/researchApi', () => ({ fetchResearchSignals: api.fetch }));
const signals = [
 { title: 'Gobernanza de IA educativa', endpoint: '/synthetic/governance', category: 'governance', status: 'HIGH', summary: 'Raw untranslated summary', evidence: ['synthetic'], payload: { governanceLevel: 'HIGH' } },
 { title: 'Ética de investigación', endpoint: '/synthetic/ethics', category: 'ethics', status: 'NO DISPONIBLE', summary: 'HTTP 403', evidence: [] },
 { title: 'Validación por expertos', endpoint: '/synthetic/research', category: 'research', status: 'NO DISPONIBLE', summary: 'Network failure', evidence: [] },
];
beforeEach(() => { api.fetch.mockReset().mockResolvedValue(signals); });
it.each(['es', 'en'] as const)('localizes available evidence and unavailable responses in %s without replacing raw payloads', async locale => {
 localStorage.setItem('ilp.locale', locale);
 const before = JSON.stringify(signals);
 render(<I18nProvider><ResearchCenterPage /></I18nProvider>);
 expect(await screen.findByText('/synthetic/governance')).toBeTruthy();
 expect(screen.queryByText('Raw untranslated summary')).toBeNull();
 expect(screen.getAllByText(locale === 'es' ? 'Nivel de gobernanza: Alto' : 'Governance level: High')).toHaveLength(2);
 expect(screen.getByText(/HTTP 403/)).toBeTruthy();
 expect(screen.getAllByText(locale === 'es' ? 'Sin respuesta del servicio; no se muestran evidencias sustitutivas.' : 'No service response; no substitute evidence is displayed.')).toHaveLength(2);
 fireEvent.click(screen.getByRole('button', { name: locale === 'es' ? 'Gobernanza' : 'Governance' }));
 expect(screen.getByText('/synthetic/governance')).toBeTruthy();
 expect(screen.queryByText('/synthetic/ethics')).toBeNull();
 expect(JSON.stringify(signals)).toBe(before);
 fireEvent.click(screen.getByRole('button', { name: locale === 'es' ? 'Actualizar evidencias' : 'Refresh evidence' }));
 await waitFor(() => expect(api.fetch).toHaveBeenCalledTimes(2));
});
