import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from '../../src/i18n/I18nProvider';
import { LocalizedSurface } from '../../src/i18n/LocalizedSurface';

function SwitchLanguage() {
  const { locale, setLocale } = useI18n();
  return <button onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}>switch</button>;
}

describe('API text preservation', () => {
  it.each(['es', 'en'] as const)('preserves nested data and mutations in %s', async locale => {
    localStorage.setItem('ilp.locale', locale);
    const { container } = render(
      <I18nProvider>
        <SwitchLanguage />
        <LocalizedSurface>
          <span data-testid="label">Reload</span>
          <div translate="no" data-testid="data">
            <span title="Synthetic High" aria-label="Synthetic High">Synthetic High</span>
          </div>
        </LocalizedSurface>
      </I18nProvider>,
    );
    const data = screen.getByTestId('data');
    const name = data.querySelector('span');
    if (!name) throw new Error('Missing name fixture');
    const assertData = () => {
      expect(name.textContent).toBe('Synthetic High');
      expect(name.title).toBe('Synthetic High');
      expect(name.getAttribute('aria-label')).toBe('Synthetic High');
    };
    assertData();
    const added = document.createElement('span');
    added.textContent = 'Synthetic Low';
    data.appendChild(added);
    name.textContent = 'Synthetic High';
    name.title = 'Synthetic High';
    for (const target of [locale === 'es' ? 'en' : 'es', locale]) {
      fireEvent.click(screen.getByText('switch'));
      await waitFor(() => {
        expect(container.querySelector('[data-ilp-language]')?.getAttribute('data-ilp-language')).toBe(target);
        expect(screen.getByTestId('label').textContent).toBe(target === 'es' ? 'Recargar' : 'Reload');
        assertData();
        expect(added.textContent).toBe('Synthetic Low');
      });
    }
  });
});
