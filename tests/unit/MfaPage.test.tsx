import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
const transport = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('axios', () => ({ default: { create: () => transport } }));
import reducer, { authenticationSucceeded, authenticationFailed } from '../../src/features/auth/store/authSlice';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { MfaPage } from '../../src/pages/security/MfaPage';
const identity = { accessToken: 'SYNTHETIC_TOKEN', email: 'synthetic@example.test', mfaRequired: false };
const setup = { secret: 'SYNTHETIC_SETUP_KEY', qrProvisioningUri: 'otpauth://totp/TEST_ONLY' };
const headers = { Authorization: 'Bearer SYNTHETIC_TOKEN', 'X-Tenant-Id': '11111111-1111-4111-8111-111111111111' };
function mount(locale: 'es' | 'en', credentials = identity) {
  localStorage.setItem('ilp.locale', locale);
  const store = configureStore({ reducer: { auth: reducer } });
  store.dispatch(authenticationSucceeded(credentials));
  return { ...render(<Provider store={store}><I18nProvider><MfaPage /></I18nProvider></Provider>), store };
}
function start(locale: 'es' | 'en') {
  fireEvent.click(screen.getByRole('button', { name: locale === 'es' ? 'Configurar MFA' : 'Set up MFA' }));
}
beforeEach(() => { transport.post.mockReset(); });
describe('MFA setup and verification boundary with synthetic credentials', () => {
  it.each(['es', 'en'] as const)('sets up and enables MFA only after server confirmation in %s', async locale => {
    mount(locale); transport.post.mockResolvedValueOnce({ data: setup }); start(locale);
    const key = await screen.findByLabelText(locale === 'es' ? 'Clave de configuración' : 'Setup key');
    expect((key as HTMLInputElement).value).toBe(setup.secret);
    expect((key as HTMLInputElement).readOnly).toBe(true);
    expect(transport.post).toHaveBeenLastCalledWith('/auth/mfa/setup', { email: identity.email }, { headers });
    const input = screen.getByLabelText(locale === 'es' ? 'Código de verificación' : 'Verification code', { exact: false });
    const button = screen.getByRole('button', { name: locale === 'es' ? 'Verificar y activar' : 'Verify and enable' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(input, { target: { value: '12x3' } });
    expect((input as HTMLInputElement).value).toBe('123');
    expect(screen.getByText(locale === 'es' ? 'Ingrese seis dígitos.' : 'Enter six digits.')).toBeTruthy();
    fireEvent.click(button); expect(transport.post).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: '01234567' } });
    expect((input as HTMLInputElement).value).toBe('012345');
    transport.post.mockResolvedValueOnce({ data: true }); fireEvent.click(button);
    await screen.findByText(locale === 'es' ? 'MFA quedó activada correctamente.' : 'MFA was enabled successfully.');
    expect(transport.post).toHaveBeenLastCalledWith('/auth/mfa/verify', { email: identity.email, code: 12345 }, { headers });
    expect(screen.queryByLabelText(locale === 'es' ? 'Clave de configuración' : 'Setup key')).toBeNull();
    expect(screen.queryByRole('button', { name: locale === 'es' ? 'Configurar MFA' : 'Set up MFA' })).toBeNull();
  });
  it.each(['es', 'en'] as const)('shows a localized setup failure and permits retry in %s', async locale => {
    mount(locale); transport.post.mockRejectedValueOnce(new Error('Synthetic offline')); start(locale);
    await screen.findByText(locale === 'es'
      ? 'No fue posible iniciar la configuración MFA. Puede que ya esté configurada.'
      : 'MFA setup could not be started. It may already be configured.');
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false);
    transport.post.mockResolvedValueOnce({ data: setup }); start(locale);
    await screen.findByLabelText(locale === 'es' ? 'Clave de configuración' : 'Setup key');
    expect(screen.queryByText(locale === 'es'
      ? 'No fue posible iniciar la configuración MFA. Puede que ya esté configurada.'
      : 'MFA setup could not be started. It may already be configured.')).toBeNull();
    expect(transport.post).toHaveBeenCalledTimes(2);
  });
  it.each([
    { locale: 'es' as const, rejected: false }, { locale: 'en' as const, rejected: false },
    { locale: 'es' as const, rejected: true }, { locale: 'en' as const, rejected: true },
  ])('does not enable MFA on verification failure: $locale, rejected=$rejected', async ({ locale, rejected }) => {
    mount(locale); transport.post.mockResolvedValueOnce({ data: setup }); start(locale);
    const input = await screen.findByLabelText(locale === 'es' ? 'Código de verificación' : 'Verification code', { exact: false });
    fireEvent.change(input, { target: { value: '123456' } });
    if (rejected) transport.post.mockRejectedValueOnce(new Error('Synthetic rejected'));
    else transport.post.mockResolvedValueOnce({ data: false });
    fireEvent.click(screen.getByRole('button', { name: locale === 'es' ? 'Verificar y activar' : 'Verify and enable' }));
    await screen.findByText(locale === 'es' ? 'El código no fue válido o ya expiró.' : 'The code was invalid or expired.');
    expect((input as HTMLInputElement).value).toBe('123456');
    expect(screen.getByLabelText(locale === 'es' ? 'Clave de configuración' : 'Setup key')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });
  it.each([
    { name: 'missing token', credentials: { ...identity, accessToken: '' } },
    { name: 'missing email', credentials: { ...identity, email: '' } },
  ])('does not request setup with $name', ({ credentials }) => {
    mount('es', credentials); const button = screen.getByRole('button', { name: 'Configurar MFA' });
    expect((button as HTMLButtonElement).disabled).toBe(true); fireEvent.click(button);
    expect(transport.post).not.toHaveBeenCalled();
  });
  it('blocks duplicate setup and verification while each request is pending', async () => {
    mount('es'); let finishSetup!: (value: { data: typeof setup }) => void;
    transport.post.mockReturnValueOnce(new Promise(resolve => { finishSetup = resolve; }));
    start('es'); start('es'); expect(transport.post).toHaveBeenCalledTimes(1);
    await act(async () => { finishSetup({ data: setup }); });
    fireEvent.change(screen.getByLabelText('Código de verificación', { exact: false }), { target: { value: '123456' } });
    let finishVerify!: (value: { data: boolean }) => void;
    transport.post.mockReturnValueOnce(new Promise(resolve => { finishVerify = resolve; }));
    const button = screen.getByRole('button', { name: 'Verificar y activar' });
    fireEvent.click(button); fireEvent.click(button); expect(transport.post).toHaveBeenCalledTimes(2);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { finishVerify({ data: true }); });
    await screen.findByText('MFA quedó activada correctamente.');
  });
  it('does not verify after the authenticated identity disappears', async () => {
    const { store } = mount('es'); transport.post.mockResolvedValueOnce({ data: setup }); start('es');
    const input = await screen.findByLabelText('Código de verificación', { exact: false });
    fireEvent.change(input, { target: { value: '123456' } });
    act(() => { store.dispatch(authenticationFailed('Synthetic expired session')); });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar y activar' }));
    await waitFor(() => expect(transport.post).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
