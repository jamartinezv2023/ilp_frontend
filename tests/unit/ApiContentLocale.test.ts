import { describe, expect, it } from 'vitest';
import catalog from '../../src/i18n/apiContentCatalog.json';
import { resolveApiText } from '../../src/i18n/useApiText';
describe('Explicit API content localization', () => {
  it('provides both languages for every declared label', () => {
    for (const text of Object.values(catalog)) {
      expect(text.es.trim()).not.toBe('');
      expect(text.en.trim()).not.toBe('');
    }
  });
  it('uses API labels while preserving the original payload across language changes', () => {
    const payload = { id: 'UNCHANGED-ID', fullName: 'Visual learning support', learningProfile: 'CUSTOM', answers: ['A'], localizedContent: { CUSTOM: { es: 'Perfil autorizado', en: 'Authorized profile' } } };
    const before = JSON.stringify(payload);
    expect(resolveApiText(payload.learningProfile, 'es', payload)).toBe('Perfil autorizado');
    expect(resolveApiText(payload.learningProfile, 'en', payload)).toBe('Authorized profile');
    expect(resolveApiText(payload.learningProfile, 'es', payload)).toBe('Perfil autorizado');
    expect(JSON.stringify(payload)).toBe(before);
    expect(payload.fullName).toBe('Visual learning support');
  });
  it('does not publish unknown content in a different language', () => {
    expect(resolveApiText('Unknown English paragraph', 'es')).toBe('Contenido sin traducción disponible en español.');
    expect(resolveApiText('UNKNOWN', 'en')).toBe('Content has no available English translation.');
  });
});
