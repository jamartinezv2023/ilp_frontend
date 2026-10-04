import { describe, it, expect } from 'vitest';
import { render, renderHook, act, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider, useI18n } from '../../src/i18n/I18nProvider';
import { LocalizedSurface } from '../../src/i18n/LocalizedSurface';
import { messages, legacyTextPairs } from '../../src/i18n/messages';
import { repairUtf8Mojibake, normalizeUtf8Text } from '../../src/utils/utf8Text';
describe('bilingual persistence and accessible localization', () => {
  it('requires its provider', () => { expect(() => renderHook(() => useI18n())).toThrow('within I18nProvider'); });
  it.each(['es','en-GB','invalid'])('restores %s and translates both directions with whitespace intact', stored => {
    localStorage.setItem('ilp.locale', stored);
    const { result } = renderHook(() => useI18n(), { wrapper:I18nProvider });
    expect(result.current.locale).toBe(stored.startsWith('en')?'en':'es');
    for (const locale of ['es','en'] as const) {
      act(() => result.current.setLocale(locale));
      expect(document.documentElement.lang).toBe(locale); expect(document.documentElement.dir).toBe('ltr');
      expect(document.title).toBe(messages[locale]['shell.platform']);expect(localStorage.getItem('ilp.locale')).toBe(locale);
      for (const [english,spanish] of legacyTextPairs.slice(0,20)) {
        expect(result.current.translateLegacyText(`  ${locale==='es'?english:spanish}  `)).toBe(`  ${locale==='es'?spanish:english}  `);
      }
      expect(result.current.translateLegacyText('  unknown value  ')).toBe('  unknown value  ');
      expect(result.current.translateLegacyText(`prefix: ${locale==='es'?'Reload':'Recargar'}`)).toBe(`prefix: ${locale==='es'?'Recargar':'Reload'}`);
      for (const empty of [undefined,null,'']) expect(result.current.translateBackendValue(empty)).toBe('');
      expect(result.current.translateBackendValue(' high ')).toBe(messages[locale]['status.high']);
      expect(result.current.translateBackendValue('NOT AVAILABLE')).toBe(messages[locale]['status.notAvailable']);
      expect(result.current.translateBackendValue('unknown_value')).toBe('unknown value');
      expect(result.current.t('shell.platform')).toBe(messages[locale]['shell.platform']);
    }
  });
  it('translates text and attributes including later DOM mutations and locale changes', async () => {
    function Switch() { const {setLocale}=useI18n();return <button onClick={()=>setLocale('en')}>switch</button>; }
    const {container,getByText,unmount}=render(<I18nProvider><Switch/><LocalizedSurface><input title="Reload" placeholder="Reload" aria-label="Reload"/><span>Reload</span></LocalizedSurface></I18nProvider>);
    const input=container.querySelector('input');if(!input)throw new Error('missing fixture');
    expect(input.title).toBe('Recargar'); expect(input.placeholder).toBe('Recargar');
    fireEvent.click(getByText('switch'));
    await waitFor(()=>expect(input.title).toBe('Reload'));
    const span=container.querySelector('[data-ilp-language] span');if(!span)throw new Error('missing fixture');
    span.textContent='Recargar';input.title='Recargar';
    const added=document.createElement('span');added.textContent='Recargar';span.appendChild(added);
    await waitFor(()=>{expect(input.title).toBe('Reload');expect(added.textContent).toBe('Reload');});
    unmount();
  });
});
describe('UTF-8 preservation',()=>{
  it('repairs Latin-1 mojibake without damaging valid or unsupported text',()=>{
    expect(repairUtf8Mojibake('EducaciÃ³n')).toBe('Educación');
    for(const text of ['Educación','Ãx','Ã³😀','plain'])expect(repairUtf8Mojibake(text)).toBe(text);
    expect(normalizeUtf8Text({ label:'EducaciÃ³n', nested:['EducaciÃ³n',null,4] })).toEqual({label:'Educación',nested:['Educación',null,4]});
  });
});
