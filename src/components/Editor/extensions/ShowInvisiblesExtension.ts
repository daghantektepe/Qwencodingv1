/**
 * ShowInvisiblesExtension.ts — Faz 86: Görünmez Karakterleri Göster (Show Invisibles)
 */

import { Extension } from '@tiptap/core';

export interface ShowInvisiblesOptions {
  enabled: boolean;
  spaceSymbol: string;
  hardBreakSymbol: string;
  paragraphSymbol: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    showInvisibles: {
      toggleShowInvisibles: () => ReturnType;
      setShowInvisibles: (enabled: boolean) => ReturnType;
    };
  }
}

/**
 * Görünmez boşluk, tab ve paragraf sonu işaretlerini sembolize eden yardımcı dönüştürücü
 */
export function formatInvisibleCharacters(
  text: string,
  options?: Partial<ShowInvisiblesOptions>
): string {
  const opts: ShowInvisiblesOptions = {
    enabled: true,
    spaceSymbol: '·',
    hardBreakSymbol: '↵',
    paragraphSymbol: '¶',
    ...options,
  };

  if (!opts.enabled || !text) return text;

  // Boşlukları nokta ile, yeni satırları paragraf simgesi ile işaretle
  return text
    .replace(/ /g, opts.spaceSymbol)
    .replace(/\n/g, `${opts.paragraphSymbol}\n`);
}

export const ShowInvisiblesExtension = Extension.create<ShowInvisiblesOptions>({
  name: 'showInvisibles',

  addOptions() {
    return {
      enabled: false,
      spaceSymbol: '·',
      hardBreakSymbol: '↵',
      paragraphSymbol: '¶',
    };
  },

  addCommands() {
    return {
      toggleShowInvisibles:
        () =>
        ({ editor, commands }) => {
          this.options.enabled = !this.options.enabled;
          editor.view.dom.classList.toggle('openscriv-show-invisibles', this.options.enabled);
          return true;
        },

      setShowInvisibles:
        (enabled: boolean) =>
        ({ editor }) => {
          this.options.enabled = enabled;
          editor.view.dom.classList.toggle('openscriv-show-invisibles', enabled);
          return true;
        },
    };
  },
});

export default ShowInvisiblesExtension;
