/**
 * SQLite & Inverted FTS5 Search Client Engine
 * Phase 109: SQLite & Yerel Full-Text Search (FTS5) Yüksek Hızlı Arama Motoru
 */

export interface FtsSearchResult {
  docId: string;
  title: string;
  snippet: string;
  occurrences: number;
  score: number;
}

export interface FtsSearchResponse {
  results: FtsSearchResult[];
  queryTimeMs: number;
  totalMatches: number;
}

export interface FtsSearchOptions {
  prefix?: boolean;
  limit?: number;
}

export class SqliteFtsEngine {
  private static localDocs = new Map<string, { id: string; title: string; content: string }>();

  /**
   * Tüm proje dokümanlarını FTS5 indeksine aktarır.
   */
  static async indexProject(documents: Array<{ id: string; title: string; content: string }>): Promise<boolean> {
    this.localDocs.clear();
    for (const d of documents) {
      this.localDocs.set(d.id, d);
    }

    if (window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('fts:index-project', { documents });
        return Boolean(res?.ok);
      } catch {
        // fallback
      }
    }
    return true;
  }

  /**
   * Tek bir doküman güncellendiğinde indeksi anlık günceller.
   */
  static async updateDocument(docId: string, title: string, content: string): Promise<void> {
    this.localDocs.set(docId, { id: docId, title, content });

    if (window.electronAPI?.invoke) {
      try {
        await window.electronAPI.invoke('fts:update-doc', { docId, title, content });
      } catch {
        // ignore
      }
    }
  }

  /**
   * Yüksek hızlı FTS5 araması yapar.
   */
  static async search(query: string, options: FtsSearchOptions = {}): Promise<FtsSearchResponse> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { results: [], queryTimeMs: 0, totalMatches: 0 };
    }

    if (window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('fts:search', { query: trimmed, options });
        if (res && Array.isArray(res.results)) {
          return res;
        }
      } catch {
        // fallback to in-memory
      }
    }

    // Web Fallback In-Memory Engine
    const startTime = performance.now();
    const queryTerms = trimmed.split(/\s+/).filter(Boolean);
    const results: FtsSearchResult[] = [];

    for (const [id, doc] of this.localDocs.entries()) {
      const full = `${doc.title} ${doc.content}`.toLowerCase();
      let matchCount = 0;
      let allMatch = true;

      for (const term of queryTerms) {
        const count = (full.match(new RegExp(term, 'gi')) || []).length;
        if (count === 0) {
          allMatch = false;
          break;
        }
        matchCount += count;
      }

      if (allMatch && matchCount > 0) {
        let snippet = doc.content.slice(0, 100);
        for (const term of queryTerms) {
          snippet = snippet.replace(new RegExp(`(${term})`, 'gi'), '<mark>$1</mark>');
        }
        results.push({
          docId: id,
          title: doc.title,
          snippet,
          occurrences: matchCount,
          score: matchCount,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const queryTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      results: options.limit ? results.slice(0, options.limit) : results,
      queryTimeMs,
      totalMatches: results.length,
    };
  }
}
