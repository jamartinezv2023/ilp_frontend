import { beforeEach, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { StudentServiceStatusAlert } from '../../src/components/StudentServiceStatusAlert';
import { markStudentServiceFailed, markStudentServiceReady, markStudentServiceStarting } from '../../src/services/studentServiceStatus';
beforeEach(() => { markStudentServiceReady(); });
it.each(['es', 'en'] as const)('shows startup, authentication and recovery in %s', locale => {
 localStorage.setItem('ilp.locale', locale);
 render(<I18nProvider><StudentServiceStatusAlert /></I18nProvider>);
 expect(screen.queryByRole('alert')).toBeNull();
 act(() => markStudentServiceStarting({ attempt: 1, maxAttempts: 3, delayMs: 1000 }));
 expect(screen.getByRole('alert').textContent).toContain(locale === 'es' ? 'El servicio está iniciando' : 'The service is starting');
 act(() => markStudentServiceFailed('authentication'));
 expect(screen.getByRole('alert').textContent).toContain(locale === 'es' ? 'Autenticación requerida' : 'Authentication required');
 act(() => markStudentServiceFailed('authorization'));
 expect(screen.getByRole('alert').textContent).toContain(locale === 'es' ? 'Su cuenta no tiene autorización' : 'Your account is not authorized');
 act(() => markStudentServiceReady());
 expect(screen.queryByRole('alert')).toBeNull();
});
