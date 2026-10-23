/**
 * AutoCapitalizeExtension.ts — Faz 86: Otomatik Cümle Başı Büyük Harf Uzantısı
 */

import { Extension } from '@tiptap/core';

export interface AutoCapitalizeOptions {
  enabled: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    autoCapitalize: {
      toggleAutoCapitalize: () => ReturnType;
      setAutoCapitalize: (enabled: boolean) => ReturnType;
    };
  }
}

/**
 * Cümle başlarındaki ilk harfleri otomatik büyük harfe dönüştürür (Türkçe İ / I desteğiyle)
 */
export function capitalizeSentences(text: string): string {
  if (!text) return text;

  const capitalizeChar = (ch: string): string => {
    if (ch === 'i') return 'İ';
    if (ch === 'ı') return 'I';
    return ch.toLocaleUpperCase('tr-TR');
  };

  // 1. Metin başındaki ilk harf
  let result = text.replace(/^(\s*)([a-zçğıöşü])/i, (_, space, char) => `${space}${capitalizeChar(char)}`);

  // 2. Nokta, ünlem, soru işareti veya elipsis sonrasındaki ilk harf
  result = result.replace(
    /([.!?…]\s+)([a-zçğıöşü])/gi,
    (_, punct, char) => `${punct}${capitalizeChar(char)}`
  );

  // 3. Yeni satır başındaki ilk harf
  result = result.replace(
    /(\n\s*)([a-zçğıöşü])/gi,
    (_, newline, char) => `${newline}${capitalizeChar(char)}`
  );

  return result;
}

export const AutoCapitalizeExtension = Extension.create<AutoCapitalizeOptions>({
  name: 'autoCapitalize',

  addOptions() {
    return {
      enabled: true,
    };
  },

  addCommands() {
    return {
      toggleAutoCapitalize:
        () =>
        () => {
          this.options.enabled = !this.options.enabled;
          return true;
        },

      setAutoCapitalize:
        (enabled: boolean) =>
        () => {
          this.options.enabled = enabled;
          return true;
        },
    };
  },
});

export default AutoCapitalizeExtension;
