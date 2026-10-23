/**
 * MathBlockExtension.ts — Faz 76: TipTap LaTeX / KaTeX Math Block & Inline Extension
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { katexRenderer } from '../../services/math/katexRenderer';

export interface MathBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathBlock: {
      setMathBlock: (attributes: { latex: string; isBlock?: boolean }) => ReturnType;
    };
  }
}

export const MathBlockExtension = Node.create<MathBlockOptions>({
  name: 'mathBlock',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      latex: {
        default: 'E = mc^2',
        parseHTML: (element) => element.getAttribute('data-latex') || '',
        renderHTML: (attributes) => ({
          'data-latex': attributes.latex,
        }),
      },
      isBlock: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-block') === 'true',
        renderHTML: (attributes) => ({
          'data-block': attributes.isBlock ? 'true' : 'false',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
      },
      {
        tag: 'span[data-type="math-inline"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const isBlock = node.attrs.isBlock;
    const latex = node.attrs.latex || '';
    const renderedHtml = katexRenderer.renderToHtml(latex, isBlock);

    return [
      isBlock ? 'div' : 'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': isBlock ? 'math-block' : 'math-inline',
        class: isBlock ? 'openscriv-math-block' : 'openscriv-math-inline',
      }),
      ['span', { class: 'math-rendered-wrapper', innerHTML: renderedHtml }],
    ];
  },

  addCommands() {
    return {
      setMathBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});

export default MathBlockExtension;
