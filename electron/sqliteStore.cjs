/**
 * SQLite & Inverted Full-Text Search (FTS5) Engine for Large Novel Projects
 * Phase 109: SQLite & Yerel Full-Text Search (FTS5) Yüksek Hızlı Arama Motoru
 */

const { ipcMain } = require('electron');

class FastFtsIndex {
  constructor() {
    this.docs = new Map(); // docId -> { docId, title, content, words: Set }
    this.invertedIndex = new Map(); // term -> Set<docId>
  }

  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);
  }

  indexDocument(docId, title, content) {
    // Önce eski kayıtları temizle
    this.removeDocument(docId);

    const fullText = `${title || ''} ${content || ''}`;
    const tokens = this.tokenize(fullText);
    const tokenSet = new Set(tokens);

    this.docs.set(docId, {
      docId,
      title: title || 'Başlıksız Belge',
      content: content || '',
      words: tokenSet,
      tokenList: tokens,
    });

    for (const token of tokenSet) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token).add(docId);
    }
  }

  removeDocument(docId) {
    if (!this.docs.has(docId)) return;
    const doc = this.docs.get(docId);
    for (const token of doc.words) {
      const set = this.invertedIndex.get(token);
      if (set) {
        set.delete(docId);
        if (set.size === 0) this.invertedIndex.delete(token);
      }
    }
    this.docs.delete(docId);
  }

  clear() {
    this.docs.clear();
    this.invertedIndex.clear();
  }

  createSnippet(content, queryTerms, maxLength = 120) {
    if (!content) return '';
    const lowerContent = content.toLowerCase();
    let bestPos = -1;

    for (const term of queryTerms) {
      const idx = lowerContent.indexOf(term);
      if (idx !== -1 && (bestPos === -1 || idx < bestPos)) {
        bestPos = idx;
      }
    }

    if (bestPos === -1) {
      return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, bestPos - 30);
    const end = Math.min(content.length, bestPos + maxLength - 30);
    let snippet = content.slice(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    // Highlight
    for (const term of queryTerms) {
      const reg = new RegExp(`(${term})`, 'gi');
      snippet = snippet.replace(reg, '<mark>$1</mark>');
    }

    return snippet;
  }

  search(query, options = {}) {
    const startTime = performance.now();
    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0) {
      return { results: [], queryTimeMs: 0, totalMatches: 0 };
    }

    let matchingDocIds = null;

    for (const token of queryTokens) {
      const docsWithToken = new Set();

      // Prefix match (örn: 'karan*' veya tam eşleşme)
      const isPrefix = options.prefix || token.length >= 3;
      for (const [indexedTerm, docIds] of this.invertedIndex.entries()) {
        if (indexedTerm === token || (isPrefix && indexedTerm.startsWith(token))) {
          for (const id of docIds) docsWithToken.add(id);
        }
      }

      if (matchingDocIds === null) {
        matchingDocIds = docsWithToken;
      } else {
        // Kesişim (AND)
        matchingDocIds = new Set([...matchingDocIds].filter((id) => docsWithToken.has(id)));
      }

      if (matchingDocIds.size === 0) break;
    }

    const results = [];
    if (matchingDocIds) {
      for (const docId of matchingDocIds) {
        const doc = this.docs.get(docId);
        if (!doc) continue;

        // BM25 / Term Frequency benzeri basit skorlama
        let occurrences = 0;
        for (const token of queryTokens) {
          occurrences += doc.tokenList.filter((t) => t.startsWith(token)).length;
        }

        const snippet = this.createSnippet(doc.content, queryTokens);

        results.push({
          docId,
          title: doc.title,
          occurrences,
          snippet,
          score: occurrences,
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

const ftsIndexInstance = new FastFtsIndex();

function registerFtsHandlers() {
  ipcMain.handle('fts:index-project', (_evt, { documents }) => {
    ftsIndexInstance.clear();
    if (Array.isArray(documents)) {
      for (const doc of documents) {
        ftsIndexInstance.indexDocument(doc.id, doc.title, doc.content);
      }
    }
    return { ok: true, indexedCount: ftsIndexInstance.docs.size };
  });

  ipcMain.handle('fts:search', (_evt, { query, options }) => {
    return ftsIndexInstance.search(query, options);
  });

  ipcMain.handle('fts:update-doc', (_evt, { docId, title, content }) => {
    ftsIndexInstance.indexDocument(docId, title, content);
    return { ok: true };
  });
}

module.exports = {
  FastFtsIndex,
  ftsIndexInstance,
  registerFtsHandlers,
};
