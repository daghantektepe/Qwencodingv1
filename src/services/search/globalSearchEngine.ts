/**
 * globalSearchEngine.ts — Faz 79: Zengin Arama ve Çoklu Dosyada Bul/Değiştir Motoru
 */

export interface SearchOptions {
  caseSensitive: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
  inDocumentTitle: boolean;
  inDocumentContent: boolean;
  inNotes: boolean;
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  caseSensitive: false,
  matchWholeWord: false,
  useRegex: false,
  inDocumentTitle: true,
  inDocumentContent: true,
  inNotes: false,
};

export interface SearchDocument {
  id: string;
  title: string;
  content?: string;
  notes?: string;
}

export interface SearchMatch {
  id: string;
  docId: string;
  docTitle: string;
  field: 'content' | 'title' | 'notes';
  line: number;
  startIndex: number;
  endIndex: number;
  matchText: string;
  contextBefore: string;
  contextAfter: string;
  proposedReplacement?: string;
  selected: boolean;
}

export interface SearchResult {
  matches: SearchMatch[];
  totalMatches: number;
  documentsWithMatchesCount: number;
  durationMs: number;
  regexError?: string;
}

export class GlobalSearchEngine {
  /**
   * Güvenli Regex nesnesi oluşturur
   */
  public buildRegex(query: string, options: SearchOptions): { regex?: RegExp; error?: string } {
    if (!query) return {};

    try {
      let pattern = options.useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let flags = options.caseSensitive ? 'g' : 'gi';
      if (options.matchWholeWord) {
        pattern = `(?<![\\p{L}\\p{N}_])${pattern}(?![\\p{L}\\p{N}_])`;
        flags += 'u';
      }
      return { regex: new RegExp(pattern, flags) };
    } catch (e: any) {
      return { error: e.message || 'Geçersiz Düzenli İfade (Regex)' };
    }
  }

  /**
   * Tüm projede veya verilen doküman listesinde arama yapar (<100ms)
   */
  public search(
    docs: SearchDocument[],
    query: string,
    opts?: Partial<SearchOptions>
  ): SearchResult {
    const startTime = performance.now();
    const options: SearchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...opts };

    if (!query.trim()) {
      return {
        matches: [],
        totalMatches: 0,
        documentsWithMatchesCount: 0,
        durationMs: 0,
      };
    }

    const { regex, error } = this.buildRegex(query, options);
    if (error || !regex) {
      return {
        matches: [],
        totalMatches: 0,
        documentsWithMatchesCount: 0,
        durationMs: performance.now() - startTime,
        regexError: error,
      };
    }

    const matches: SearchMatch[] = [];
    const matchedDocIds = new Set<string>();

    for (const doc of docs) {
      // 1. Başlıkta Ara
      if (options.inDocumentTitle && doc.title) {
        this.scanText(doc.id, doc.title, doc.title, 'title', regex, matches, matchedDocIds);
      }

      // 2. İçerikte Ara
      if (options.inDocumentContent && doc.content) {
        this.scanText(doc.id, doc.title, doc.content, 'content', regex, matches, matchedDocIds);
      }

      // 3. Notlarda Ara
      if (options.inNotes && doc.notes) {
        this.scanText(doc.id, doc.title, doc.notes, 'notes', regex, matches, matchedDocIds);
      }
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      matches,
      totalMatches: matches.length,
      documentsWithMatchesCount: matchedDocIds.size,
      durationMs,
    };
  }

  private scanText(
    docId: string,
    docTitle: string,
    text: string,
    field: 'content' | 'title' | 'notes',
    regex: RegExp,
    results: SearchMatch[],
    matchedDocIds: Set<string>
  ): void {
    // Regex lastIndex sıfırla
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      if (matchText.length === 0) {
        // Sonsuz döngüden kaçınmak için
        regex.lastIndex++;
        continue;
      }

      matchedDocIds.add(docId);
      const start = match.index;
      const end = start + matchText.length;

      // Satır numarasını bul
      const line = (text.substring(0, start).match(/\n/g) || []).length + 1;

      // Çevre bağlamı (Context window ~35 karakter)
      const ctxStart = Math.max(0, start - 35);
      const ctxEnd = Math.min(text.length, end + 35);

      const contextBefore = text.substring(ctxStart, start);
      const contextAfter = text.substring(end, ctxEnd);

      results.push({
        id: `match-${docId}-${field}-${start}`,
        docId,
        docTitle,
        field,
        line,
        startIndex: start,
        endIndex: end,
        matchText,
        contextBefore,
        contextAfter,
        selected: true,
      });
    }
  }

  /**
   * Değiştirme öncesi önizleme üretir
   */
  public previewReplace(matches: SearchMatch[], replacementText: string): SearchMatch[] {
    return matches.map((m) => ({
      ...m,
      proposedReplacement: replacementText,
    }));
  }

  /**
   * Seçilen eşleşmeleri tüm dokümanlarda atomik olarak değiştirir.
   * Dizin kaymasını önlemek için her dokümandaki eşleşmeler ters sırada (büyük indexten küçüğe) uygulanır.
   */
  public applyReplacements(
    docs: SearchDocument[],
    selectedMatches: SearchMatch[],
    replacementText: string
  ): { updatedDocs: SearchDocument[]; replacementsCount: number } {
    const activeMatches = selectedMatches.filter((m) => m.selected);
    if (activeMatches.length === 0) {
      return { updatedDocs: docs, replacementsCount: 0 };
    }

    // Doküman ve alana göre grupla
    const grouped = new Map<string, SearchMatch[]>();
    for (const m of activeMatches) {
      const key = `${m.docId}:${m.field}`;
      const list = grouped.get(key) || [];
      list.push(m);
      grouped.set(key, list);
    }

    let replacementsCount = 0;

    const updatedDocs = docs.map((doc) => {
      let title = doc.title;
      let content = doc.content || '';
      let notes = doc.notes || '';

      // Başlık değişimleri
      const titleMatches = grouped.get(`${doc.id}:title`);
      if (titleMatches) {
        title = this.replaceInString(title, titleMatches, replacementText);
        replacementsCount += titleMatches.length;
      }

      // İçerik değişimleri
      const contentMatches = grouped.get(`${doc.id}:content`);
      if (contentMatches) {
        content = this.replaceInString(content, contentMatches, replacementText);
        replacementsCount += contentMatches.length;
      }

      // Not değişimleri
      const notesMatches = grouped.get(`${doc.id}:notes`);
      if (notesMatches) {
        notes = this.replaceInString(notes, notesMatches, replacementText);
        replacementsCount += notesMatches.length;
      }

      return {
        ...doc,
        title,
        content,
        notes,
      };
    });

    return {
      updatedDocs,
      replacementsCount,
    };
  }

  private replaceInString(
    original: string,
    matches: SearchMatch[],
    replacement: string
  ): string {
    // Ters sırada sırala (büyük indexten küçüğe)
    const sorted = [...matches].sort((a, b) => b.startIndex - a.startIndex);
    let result = original;

    for (const m of sorted) {
      result = result.slice(0, m.startIndex) + replacement + result.slice(m.endIndex);
    }

    return result;
  }
}

export const globalSearchEngine = new GlobalSearchEngine();
export default globalSearchEngine;
