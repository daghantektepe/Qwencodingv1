import { describe, it, expect, beforeEach } from 'vitest';
import { TaxonomyStore } from '../../src/services/taxonomy/taxonomyStore';

describe('Phase 72: Multi-Label Taxonomy & Color Badges (taxonomyStore)', () => {
  let store: TaxonomyStore;

  beforeEach(() => {
    store = new TaxonomyStore();
  });

  it('loads built-in default tags across categories', () => {
    const povTags = store.getTags('pov');
    expect(povTags.length).toBeGreaterThanOrEqual(2);
    expect(povTags.some((t) => t.name.includes('Sherlock'))).toBe(true);

    const locTags = store.getTags('location');
    expect(locTags.length).toBeGreaterThanOrEqual(2);
  });

  it('creates and deletes custom tags cleanly', () => {
    const newTag = store.createTag({
      name: 'Moriarty',
      category: 'pov',
      color: '#dc2626',
      description: 'Antagonist bakış açısı',
    });

    expect(newTag.id).toBeDefined();
    expect(store.getTag(newTag.id)?.name).toBe('Moriarty');

    store.assignTagsToDoc('doc-1', [newTag.id]);
    expect(store.getDocTags('doc-1')).toHaveLength(1);

    store.deleteTag(newTag.id);
    expect(store.getTag(newTag.id)).toBeUndefined();
    // Dokümandan da silinmiş olmalı
    expect(store.getDocTags('doc-1')).toHaveLength(0);
  });

  it('assigns multiple tags and styles to documents', () => {
    const tags = store.getTags();
    const tag1 = tags[0];
    const tag2 = tags[1];

    const mapping = store.assignTagsToDoc('doc-2', [tag1.id, tag2.id], 'background');

    expect(mapping.docId).toBe('doc-2');
    expect(mapping.colorStripStyle).toBe('background');
    expect(mapping.tagIds).toHaveLength(2);

    const docTags = store.getDocTags('doc-2');
    expect(docTags).toHaveLength(2);
    expect(docTags.map((t) => t.id)).toContain(tag1.id);
  });

  it('adds and removes single tags dynamically', () => {
    const tag = store.getTags()[0];

    store.addTagToDoc('doc-3', tag.id);
    expect(store.getDocTags('doc-3')).toHaveLength(1);

    store.removeTagFromDoc('doc-3', tag.id);
    expect(store.getDocTags('doc-3')).toHaveLength(0);
  });

  it('filters documents by category, specific tags, and search query', () => {
    const sherlockTag = store.getTags('pov')[0];
    const londonTag = store.getTags('location')[0];

    store.assignTagsToDoc('doc-A', [sherlockTag.id, londonTag.id]);
    store.assignTagsToDoc('doc-B', [sherlockTag.id]);
    store.assignTagsToDoc('doc-C', [londonTag.id]);

    const allDocIds = ['doc-A', 'doc-B', 'doc-C'];

    // Sadece hem Sherlock hem Londra olanlar
    const both = store.filterDocs(allDocIds, { tagIds: [sherlockTag.id, londonTag.id] });
    expect(both).toEqual(['doc-A']);

    // POV kategorisine sahip olanlar
    const povOnly = store.filterDocs(allDocIds, { category: 'pov' });
    expect(povOnly).toEqual(['doc-A', 'doc-B']);

    // Arama kelimesiyle filtreleme ("londra")
    const searchMatch = store.filterDocs(allDocIds, { searchQuery: 'londra' });
    expect(searchMatch).toEqual(['doc-A', 'doc-C']);
  });
});
