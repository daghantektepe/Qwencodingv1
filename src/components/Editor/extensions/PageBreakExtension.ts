/**
 * PageBreakExtension.ts — Faz 86: Yumuşak ve Kesin Sayfa Sonu (Page Break) Uzantısı
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface PageBreakOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreakExtension = Node.create<PageBreakOptions>({
  name: 'pageBreak',

  group: 'block',

  atom: true,

  selectable: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
      {
        tag: 'hr[data-page-break]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'page-break',
        class:
          'openscriv-page-break my-6 py-2 border-y border-dashed border-cyan-800/80 bg-cyan-950/20 text-center text-[11px] font-mono text-cyan-400 select-none cursor-pointer hover:bg-cyan-950/40 transition-colors',
      }),
      ['span', { class: 'page-break-label tracking-widest uppercase font-semibold' }, '— Sayfa Sonu (Page Break) —'],
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    };
  },
});

export default PageBreakExtension;
