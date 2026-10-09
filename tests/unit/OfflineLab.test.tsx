import { expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { OfflineLab } from '../../src/features/offline/OfflineLab';
import { prepareOfflineLab } from '../../src/features/offline/prepareOfflineLab';
vi.mock('../../src/features/offline/prepareOfflineLab', () => ({ prepareOfflineLab: vi.fn() }));
const scope = { ownerId: 'synthetic', tenantId: 'tenant', assignmentId: 'assignment', instrumentVersion: 'v1' };
for (const locale of ['es', 'en'] as const) {
  it(`does not announce offline readiness before verification in ${locale}`, async () => {
    localStorage.setItem('ilp.locale', locale);
    let finish!: (value: 'ready') => void;
    vi.mocked(prepareOfflineLab).mockReturnValue(new Promise(resolve => { finish = resolve; }));
    render(<I18nProvider><OfflineLab scope={scope} /></I18nProvider>);
    expect(screen.getByTestId('offline-preparation').textContent).toBe(locale === 'es' ? 'Preparando reapertura sin conexión…' : 'Preparing offline reopening…');
    await act(async () => finish('ready'));
    expect(screen.getByTestId('offline-preparation').textContent).toBe(locale === 'es' ? 'Laboratorio preparado para reabrir sin conexión en este navegador.' : 'Laboratory ready to reopen offline in this browser.');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: locale === 'es' ? 'en' : 'es' } });
    expect(screen.getByTestId('offline-preparation').textContent).toBe(locale === 'es' ? 'Laboratory ready to reopen offline in this browser.' : 'Laboratorio preparado para reabrir sin conexión en este navegador.');
  });
  it(`reports unavailable preparation in ${locale}`, async () => {
    localStorage.setItem('ilp.locale', locale);
    vi.mocked(prepareOfflineLab).mockResolvedValue('unavailable');
    render(<I18nProvider><OfflineLab scope={scope} /></I18nProvider>);
    await screen.findByText(locale === 'es' ? 'No se pudo preparar la reapertura sin conexión. Mantenga la conexión.' : 'Offline reopening could not be prepared. Keep the connection available.');
  });
}
