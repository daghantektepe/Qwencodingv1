import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { splitTree, mergeTree, sanitizeFileName } = require('../../electron/projectIpc.cjs');

describe('.opscriv package layout', () => {
  const tree = [
    {
      id: 'folder-1',
      type: 'folder',
      title: 'Taslak',
      metadata: { status: 'Taslak' },
      children: [
        { id: 'doc-1', type: 'doc', title: 'Bölüm 1', content: 'Düz metin', contentHtml: '<p><strong>Düz</strong> metin</p>', metadata: { labels: ['Mavi'] } },
        { id: 'doc-2', type: 'doc', title: 'Bölüm 2', content: 'Yalnız düz' },
      ],
    },
  ];

  it('keeps text out of binder.json and round-trips content, formatting and metadata', () => {
    const { binder, docs } = splitTree(tree);
    expect(JSON.stringify(binder)).not.toContain('Düz metin');
    expect(binder[0].children[0]).toEqual({ id: 'doc-1', type: 'doc', title: 'Bölüm 1', metadata: { labels: ['Mavi'] } });
    expect(docs).toEqual([
      { id: 'doc-1', content: 'Düz metin', contentHtml: '<p><strong>Düz</strong> metin</p>' },
      { id: 'doc-2', content: 'Yalnız düz', contentHtml: undefined },
    ]);

    const texts = { 'doc-1': 'Düz metin', 'doc-2': 'Yalnız düz' };
    const htmls = { 'doc-1': '<p><strong>Düz</strong> metin</p>' };
    const merged = mergeTree(binder, texts, htmls);
    expect(merged).toEqual(tree);
    expect(merged[0].children[1]).not.toHaveProperty('contentHtml');
  });

  it('keeps Turkish project names and strips only characters the file system forbids', () => {
    expect(sanitizeFileName('Kış Masalı')).toBe('Kış Masalı');
    expect(sanitizeFileName('a:b/c?')).toBe('c_');
    expect(sanitizeFileName('Roman. ')).toBe('Roman');
  });
});
