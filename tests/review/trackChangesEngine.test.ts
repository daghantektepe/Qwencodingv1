import { describe, it, expect, beforeEach } from 'vitest';
import { TrackChangesEngine } from '../../src/services/review/trackChangesEngine';

describe('Phase 63: Track Changes & Suggestion Mode (trackChangesEngine)', () => {
  let engine: TrackChangesEngine;

  beforeEach(() => {
    engine = new TrackChangesEngine();
  });

  it('proposes insertions and accepts them into base text', () => {
    const base = 'Hızlı tilki.';
    const sug = engine.proposeInsert('doc-1', 6, 'kızıl ', 'Editör');

    expect(sug.type).toBe('insert');
    expect(sug.status).toBe('pending');
    expect(engine.getPendingSuggestions('doc-1')).toHaveLength(1);

    const updated = engine.acceptSuggestion('doc-1', sug.id, base);
    expect(updated).toBe('Hızlı kızıl tilki.');
    expect(engine.getPendingSuggestions('doc-1')).toHaveLength(0);
  });

  it('proposes deletions and handles accept/reject', () => {
    const base = 'Dedektif yavaşça kapıyı açtı.';
    // "yavaşça " (offset 9, length 8)
    const sug = engine.proposeDelete('doc-1', 9, 'yavaşça ', 'Okur');

    // Reddetme testi
    const rejectedResult = engine.rejectSuggestion('doc-1', sug.id, base);
    expect(rejectedResult).toBe(base);

    // Yeni silme ve kabul testi
    const sug2 = engine.proposeDelete('doc-1', 9, 'yavaşça ', 'Okur');
    const acceptedResult = engine.acceptSuggestion('doc-1', sug2.id, base);
    expect(acceptedResult).toBe('Dedektif kapıyı açtı.');
  });

  it('proposes replacements and updates text correctly', () => {
    const base = 'Saat üçte buluştular.';
    // "üçte" yerine "beşte"
    const sug = engine.proposeReplace('doc-2', 5, 'üçte', 'beşte', 'Yazar');

    const updated = engine.acceptSuggestion('doc-2', sug.id, base);
    expect(updated).toBe('Saat beşte buluştular.');
  });

  it('accepts and rejects all pending suggestions in bulk', () => {
    const base = 'Bir iki üç.';
    engine.proposeInsert('doc-3', 4, 'buçuk ', 'A');
    engine.proposeDelete('doc-3', 8, 'üç', 'B');

    const allAccepted = engine.acceptAll('doc-3', base);
    expect(allAccepted).toBe('Bir buçuk iki .');
    expect(engine.getPendingSuggestions('doc-3')).toHaveLength(0);
  });

  it('renders markup segments with correct types and text slices', () => {
    const base = 'Merhaba dünya.';
    engine.proposeReplace('doc-4', 8, 'dünya', 'evren', 'C');

    const segments = engine.renderMarkupSegments('doc-4', base);
    expect(segments).toHaveLength(4);
    expect(segments[0]).toEqual({ text: 'Merhaba ', type: 'normal' });
    expect(segments[1].type).toBe('deleted');
    expect(segments[1].text).toBe('dünya');
    expect(segments[2].type).toBe('inserted');
    expect(segments[2].text).toBe('evren');
    expect(segments[3]).toEqual({ text: '.', type: 'normal' });
  });
});
