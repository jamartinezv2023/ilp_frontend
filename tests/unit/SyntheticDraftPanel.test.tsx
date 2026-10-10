import { expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { SyntheticDraftPanel } from '../../src/features/offline/SyntheticDraftPanel';
import type { DraftStore, SyntheticDraft } from '../../src/features/offline/syntheticDraftStore';
const scope = { ownerId: 'synthetic', tenantId: 'tenant', assignmentId: 'assignment', instrumentVersion: 'v1' };
const draft: SyntheticDraft = { schema: 1, kind: 'SYNTHETIC_P02', scope, administrationId: '11111111-1111-4111-8111-111111111111', revision: 1, answer: 'A', createdAt: '2026-10-09T00:00:00Z', updatedAt: '2026-10-09T00:00:00Z' };
for (const locale of ['es', 'en'] as const) {
  const saveLabel = locale === 'es' ? 'Guardar en este dispositivo' : 'Save on this device';
  it(`recovers identity and preserves answer across locale changes in ${locale}`, async () => {
    localStorage.setItem('ilp.locale', locale);
    const store = { load: vi.fn().mockResolvedValue(draft), save: vi.fn() };
    render(<I18nProvider><SyntheticDraftPanel scope={scope} store={store} /></I18nProvider>);
    await waitFor(() => expect((screen.getAllByRole('radio')[0] as HTMLInputElement).checked).toBe(true));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: locale === 'es' ? 'en' : 'es' } });
    expect(screen.getByTestId('attempt').textContent).toBe(draft.administrationId);
    expect(store.load).toHaveBeenCalledTimes(1);
    expect(store.save).not.toHaveBeenCalled();
  });
  it(`confirms save only after committed store promise in ${locale}`, async () => {
    localStorage.setItem('ilp.locale', locale);
    let finish!: (value: SyntheticDraft) => void;
    const store: DraftStore = { load: vi.fn().mockResolvedValue(undefined), save: vi.fn(() => new Promise<SyntheticDraft>(resolve => { finish = resolve; })) };
    render(<I18nProvider><SyntheticDraftPanel scope={scope} store={store} /></I18nProvider>);
    await waitFor(() => expect((screen.getByRole('button', { name: saveLabel }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByRole('button', { name: saveLabel }));
    expect(screen.queryByText(locale === 'es' ? 'Guardado en este dispositivo. No enviado.' : 'Saved on this device. Not submitted.')).toBeNull();
    await act(async () => finish(draft));
    expect(screen.getByText(locale === 'es' ? 'Guardado en este dispositivo. No enviado.' : 'Saved on this device. Not submitted.')).toBeTruthy();
  });
  it(`retains response after failed storage and permits retry in ${locale}`, async () => {
    localStorage.setItem('ilp.locale', locale);
    const store = { load: vi.fn().mockResolvedValue(draft), save: vi.fn().mockRejectedValueOnce(new Error('quota')).mockResolvedValue({ ...draft, revision: 2, answer: 'B' }) };
    render(<I18nProvider><SyntheticDraftPanel scope={scope} store={store} /></I18nProvider>);
    await waitFor(() => expect((screen.getByRole('button', { name: saveLabel }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(screen.getByRole('button', { name: saveLabel }));
    await screen.findByRole('alert');
    expect((screen.getAllByRole('radio')[1] as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: saveLabel }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(store.save).toHaveBeenLastCalledWith(scope, 1, 'B');
  });
}
it('allows retry after unavailable recovery without inventing a saved state', async () => {
  const store = { load: vi.fn().mockRejectedValueOnce(new Error()).mockResolvedValue(draft), save: vi.fn() };
  render(<I18nProvider><SyntheticDraftPanel scope={scope} store={store} /></I18nProvider>);
  await screen.findByRole('alert');
  fireEvent.click(screen.getByText('Reintentar recuperación'));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(screen.getByTestId('attempt').textContent).toBe(draft.administrationId);
});
