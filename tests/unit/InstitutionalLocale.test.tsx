import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from '../../src/i18n/I18nProvider';
import { InstitutionalOverviewPage } from '../../src/pages/institutional/InstitutionalOverviewPage';
function Switch() {
  const { locale, setLocale } = useI18n();
  return <button onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}>Switch</button>;
}
describe('Explicit institutional localization', () => {
  it.each(['es', 'en'])('updates all institutional labels from %s without a DOM translator', initial => {
    localStorage.setItem('ilp.locale', initial);
    render(<I18nProvider><Switch /><InstitutionalOverviewPage /></I18nProvider>);
    const spanish = ['Panorama institucional de inclusión', 'Vista de la comunidad educativa', 'Prioridades educativas', 'Familias vinculadas'];
    const english = ['Institutional Inclusion Overview', 'Educational Community View', 'Educational priorities', 'Participating families'];
    const assertLocale = (locale: string) => {
      for (const text of locale === 'es' ? spanish : english) expect(screen.getByText(text)).toBeTruthy();
      for (const text of locale === 'es' ? english : spanish) expect(screen.queryByText(text)).toBeNull();
      expect(screen.getAllByText('—')).toHaveLength(4);
    };
    assertLocale(initial);
    fireEvent.click(screen.getByText('Switch'));
    assertLocale(initial === 'es' ? 'en' : 'es');
    fireEvent.click(screen.getByText('Switch'));
    assertLocale(initial);
  });
});
