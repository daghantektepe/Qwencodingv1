import { describe, it, expect } from 'vitest';
import { plainToHtml, docToHtml } from '../../src/components/RichText.jsx';
import { updateDocContent } from '../../src/state/tree.js';

describe('rich text content model', () => {
  it('turns each plain-text line into an escaped paragraph', () => {
    expect(plainToHtml('Bir <b>\n\nİki & üç')).toBe('<p>Bir &lt;b&gt;</p><p></p><p>İki &amp; üç</p>');
    expect(docToHtml({ content: 'düz', contentHtml: '<p><em>zengin</em></p>' })).toBe('<p><em>zengin</em></p>');
  });

  it('keeps html from the editor and drops stale html on plain-text writes', () => {
    const tree = [{ id: 'd1', type: 'doc', content: 'eski', contentHtml: '<p><strong>eski</strong></p>' }];

    const fromEditor = updateDocContent(tree, 'd1', 'yeni', '<p><em>yeni</em></p>');
    expect(fromEditor[0]).toMatchObject({ content: 'yeni', contentHtml: '<p><em>yeni</em></p>' });

    // Snapshot geri yükleme / not defteri gibi düz metin yazanlar
    const fromPlain = updateDocContent(fromEditor, 'd1', 'geri yüklendi');
    expect(fromPlain[0].content).toBe('geri yüklendi');
    expect(fromPlain[0]).not.toHaveProperty('contentHtml');
  });
});
