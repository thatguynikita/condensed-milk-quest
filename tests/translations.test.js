import { describe, it, expect } from 'vitest';
import { translations } from '../src/i18n/translations.js';

describe('translations', () => {
  it('has the same set of keys in ru and en', () => {
    const ruKeys = Object.keys(translations.ru).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(enKeys).toEqual(ruKeys);
  });

  it('has a non-empty value for every key in both languages', () => {
    for (const lang of ['ru', 'en']) {
      for (const [key, value] of Object.entries(translations[lang])) {
        expect(value, `${lang}.${key} should not be empty`).toBeTruthy();
      }
    }
  });
});
