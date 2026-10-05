import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
const transport = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('axios', async importOriginal => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: () => ({ get: transport.get }),
    },
  };
});
vi.mock('../../src/components/StudentServiceStatusAlert', () => ({
  StudentServiceStatusAlert: () => null,
}));
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { InclusionPiarPage } from '../../src/pages/inclusion/InclusionPiarPage';
const profiles = [
  { id: 'SYNTHETIC-HIGH', fullName: 'Synthetic High', supportLevel: 'HIGH' },
  { id: 'SYNTHETIC-LOW', fullName: 'Synthetic Low', supportLevel: 'LOW' },
];
const renderPage = () =>
  render(<I18nProvider><InclusionPiarPage /></I18nProvider>);
const errorMessage = /No fue posible cargar/;
beforeEach(() => {
  transport.get.mockReset();
  localStorage.setItem('ilp.locale', 'es');
});
describe.each(['es', 'en'])('Inclusion response boundary in %s', locale => {
  const emptyMessage = locale === 'es'
    ? 'No hay estudiantes disponibles en la respuesta del servicio.'
    : 'No students are available in the service response.';
  const retryName = locale === 'es' ? 'Reintentar' : 'Retry';
  beforeEach(() => {
    localStorage.setItem('ilp.locale', locale);
  });
  it.each([
    ['null', null],
    ['missing envelope', {}],
    ['invalid collection', { content: 'invalid' }],
    ['invalid member', [{ fullName: 'Missing identity' }]],
    ['partial invalid collection', [...profiles, null]],
  ])('shows an error for %s instead of an empty result', async (_name, data) => {
    transport.get.mockResolvedValue({ data });
    renderPage();
    await screen.findByText(errorMessage);
    expect(screen.queryByText(emptyMessage)).toBeNull();
    expect(screen.queryByText('Synthetic High')).toBeNull();
    expect(screen.queryByText('50%')).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(transport.get).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['array', []],
    ['value', { value: [] }],
    ['content', { content: [] }],
    ['data', { data: [] }],
  ])('shows a valid empty state for %s', async (_name, data) => {
    transport.get.mockResolvedValue({ data });
    renderPage();
    expect(await screen.findByText(emptyMessage)).toBeTruthy();
    expect(screen.queryByText(errorMessage)).toBeNull();
    expect(screen.queryByRole('button', { name: retryName })).toBeNull();
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.queryByText('0%')).toBeNull();
    expect(transport.get).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403])('does not publish indicators after HTTP %s', async status => {
    const denied = new axios.AxiosError('Synthetic access denial');
    denied.response = {
      status,
      statusText: 'Denied',
      data: {},
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
    };
    transport.get.mockRejectedValue(denied);
    renderPage();
    await screen.findByText(errorMessage);
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('50%')).toBeNull();
    expect(screen.queryByText(emptyMessage)).toBeNull();
    expect(transport.get).toHaveBeenCalledTimes(1);
  });
  it('restores data only after a successful retry', async () => {
    let resolveRetry: ((value: { data: typeof profiles }) => void) | undefined;
    transport.get
      .mockResolvedValueOnce({ data: {} })
      .mockImplementationOnce(() => new Promise(resolve => {
        resolveRetry = resolve;
      }));
    renderPage();
    await screen.findByText(errorMessage);
    fireEvent.click(screen.getByRole('button', { name: retryName }));
    await waitFor(() => expect(transport.get).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(errorMessage)).toBeNull();
    expect(screen.queryByText(emptyMessage)).toBeNull();
    expect(screen.queryByText('Synthetic High')).toBeNull();
    expect(screen.queryByText('50%')).toBeNull();
    if (!resolveRetry) throw new Error('Retry request did not start');
    resolveRetry({ data: profiles });
    expect(await screen.findByText('50%')).toBeTruthy();
    expect(screen.getByText('Synthetic High')).toBeTruthy();
    expect(screen.queryByText(errorMessage)).toBeNull();
    expect(screen.queryByText(emptyMessage)).toBeNull();
    expect(screen.queryByRole('button', { name: retryName })).toBeNull();
  });
  it('keeps indicators unavailable when retry is also malformed', async () => {
    transport.get
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { content: null } });
    renderPage();
    await screen.findByText(errorMessage);
    fireEvent.click(screen.getByRole('button', { name: retryName }));
    await waitFor(() => expect(transport.get).toHaveBeenCalledTimes(2));
    await screen.findByText(errorMessage);
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText(emptyMessage)).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('50%')).toBeNull();
  });
});