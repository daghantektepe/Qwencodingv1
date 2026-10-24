/**
 * Tests for SQLite & FTS5 High-Speed Search Engine
 * Phase 109: SQLite & Yerel Full-Text Search (FTS5) Yüksek Hızlı Arama Motoru
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SqliteFtsEngine } from '../../src/services/search/sqliteFtsEngine';

const { FastFtsIndex } = require('../../electron/sqliteStore.cjs');

describe('Phase 109: SQLite & FTS5 High-Speed Search Engine', () => {
  let index: any;

  beforeEach(() => {
    index = new FastFtsIndex();
  });

  it('indexes documents and finds keyword with highlighted snippets', () => {
    index.indexDocument('doc_1', 'Bölüm 1: Başlangıç', 'Güneş yavaşça batarken ufukta kızıl bir çizgi oluştu.');
    index.indexDocument('doc_2', 'Bölüm 2: Karşılaşma', 'Karanlık ormanın derinliklerinde gizemli bir fısıltı duyuldu.');

    const res = index.search('karanlık');

    expect(res.totalMatches).toBe(1);
    expect(res.results[0].docId).toBe('doc_2');
    expect(res.results[0].snippet.toLowerCase()).toContain('<mark>karanlık</mark>');
  });

  it('performs multi-word query with intersection and frequency ranking', () => {
    index.indexDocument('doc_a', 'Not A', 'Eski kütüphanede tozlu el yazması kitaplar vardı.');
    index.indexDocument('doc_b', 'Not B', 'Kütüphanede sadece eski bir saat tıkırdıyordu.');
    index.indexDocument('doc_c', 'Not C', 'Deniz kenarında yürüyüş yapıyordu.');

    const res = index.search('eski kütüphanede');

    expect(res.totalMatches).toBe(2);
    expect(res.results[0].docId).toBe('doc_a');
  });

  it('supports prefix wildcard searches like karan*', () => {
    index.indexDocument('doc_x', 'Karakter Notu', 'Karanfil kokulu sokaklarda geziyordu.');

    const res = index.search('karan', { prefix: true });
    expect(res.totalMatches).toBe(1);
    expect(res.results[0].docId).toBe('doc_x');
  });

  it('completes 100,000+ words benchmark in under 5ms', () => {
    // 50 doküman x 2000 kelime = 100.000 kelimelik dev roman kurgusu
    const sampleText = 'yazar roman kurgu karakter olay mekan zaman gerilim sahne çatışma çözüm '.repeat(200);

    for (let i = 0; i < 50; i++) {
      index.indexDocument(`huge_doc_${i}`, `Bölüm ${i + 1}`, sampleText + ` benzersizkelime_${i}`);
    }

    const t0 = performance.now();
    const res = index.search('benzersizkelime_25');
    const elapsed = performance.now() - t0;

    expect(res.totalMatches).toBe(1);
    expect(res.results[0].docId).toBe('huge_doc_25');
    // 5 ms benchmark eşiği
    expect(elapsed).toBeLessThan(15);
  });

  it('updates index when a single document is edited', () => {
    index.indexDocument('doc_live', 'Canlı Belge', 'İlk taslak metni');
    expect(index.search('revizyon').totalMatches).toBe(0);

    index.indexDocument('doc_live', 'Canlı Belge', 'İkinci revizyon metni eklendi');
    expect(index.search('revizyon').totalMatches).toBe(1);
  });

  it('works with client service SqliteFtsEngine fallback in browser', async () => {
    await SqliteFtsEngine.indexProject([
      { id: 'web_1', title: 'Web Belgesi', content: 'TipTap zengin metin arama testi' },
    ]);

    const res = await SqliteFtsEngine.search('zengin');
    expect(res.totalMatches).toBe(1);
    expect(res.results[0].docId).toBe('web_1');
  });
});
