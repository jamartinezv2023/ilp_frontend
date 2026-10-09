import { describe, expect, it } from 'vitest';
import { requireCompleteInstrument } from '../../src/services/localizedInstrument';
import type { AssessmentRendererModel } from '../../src/types/assessmentRenderer';
const fixture = (language: 'es' | 'en'): AssessmentRendererModel => ({
  code: 'SYNTHETIC', version: 'test-1', title: 'Synthetic test', description: '', instructions: 'Synthetic instructions',
  metadata: { code: 'SYNTHETIC', name: 'Synthetic', author: 'Test', version: 'test-1', instrumentType: 'CUSTOM', language, contentComplete: true, publicationStatus: 'APPROVED', sourceEdition: 'Synthetic test edition', expectedQuestionCount: 1, estimatedMinutes: 1, objective: 'Test', copyrightNotice: 'Synthetic fixture' },
  questions: [{ id: 'Q1', code: 'Q1', text: 'Synthetic question', dimension: 'TEST', questionType: 'SINGLE', required: true, orderIndex: 1, options: [{ id: 'O1', code: 'A', text: 'Synthetic option', dimension: 'TEST', numericValue: 1, weight: 1, orderIndex: 1 }] }],
});
describe('Complete instrument locale boundary', () => {
  for (const language of ['es', 'en'] as const) {
    it(`preserves a complete ${language} edition unchanged`, () => {
      const model = fixture(language);
      expect(requireCompleteInstrument(model, 'SYNTHETIC', language)).toBe(model);
    });
  }
  it.each(['language', 'count', 'complete', 'edition', 'status', 'version', 'text', 'code'])('rejects invalid %s without fallback', failure => {
    const model = fixture('es');
    if (failure === 'language') model.metadata.language = 'en';
    if (failure === 'count') model.metadata.expectedQuestionCount = 2;
    if (failure === 'complete') model.metadata.contentComplete = false;
    if (failure === 'edition') model.metadata.sourceEdition = '';
    if (failure === 'status') model.metadata.publicationStatus = 'DRAFT';
    if (failure === 'version') model.version = 'other';
    if (failure === 'text') model.questions[0].text = '';
    if (failure === 'code') model.code = 'OTHER';
    expect(() => requireCompleteInstrument(model, 'SYNTHETIC', 'es')).toThrow('INSTRUMENT_LOCALE_UNAVAILABLE');
  });
});
