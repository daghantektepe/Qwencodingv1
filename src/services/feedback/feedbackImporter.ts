import { useSyncExternalStore } from 'react';

export interface FeedbackComment {
  id: string;
  readerName: string;
  documentId?: string;
  documentTitle?: string;
  quoteSnippet?: string;
  comment: string;
  rating?: number; // 1-5
  status: 'new' | 'reviewed' | 'applied' | 'rejected';
  createdAt: string;
  tags?: string[];
}

export interface BetaReaderProfile {
  id: string;
  name: string;
  email?: string;
  role?: 'alpha' | 'beta' | 'editor' | 'proofreader';
  totalFeedbackCount: number;
}

export interface FeedbackFilterOptions {
  searchQuery?: string;
  status?: FeedbackComment['status'] | 'all';
  documentId?: string | 'all';
  readerName?: string | 'all';
}

const STORAGE_KEY = 'openscriv_beta_feedback_data';

export const parseFeedbackText = (
  rawText: string,
  defaultReader: string = 'Anonim Okur',
  defaultDocId?: string,
  defaultDocTitle?: string
): Omit<FeedbackComment, 'id' | 'createdAt'>[] => {
  const results: Omit<FeedbackComment, 'id' | 'createdAt'>[] = [];
  const normalized = rawText.replace(/\r\n/g, '\n');

  // Split by common dividers like --- or numbered feedback (1., 2. or [Bölüm])
  const chunks = normalized.split(/\n(?=(?:---|\[Bölüm|\d+[\.)]|Feedback:|Geri Bildirim:))/i);

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed || trimmed === '---') continue;

    let readerName = defaultReader;
    let docId = defaultDocId;
    let docTitle = defaultDocTitle;
    let quote = '';
    let comment = trimmed;
    let rating: number | undefined;

    // Extract quote if marked with "..." or > quote
    const quoteMatch = trimmed.match(/(?:>|"|“)(.*?)(?:”|"|\n\n)/s);
    if (quoteMatch && quoteMatch[1]?.trim().length > 3) {
      quote = quoteMatch[1].trim();
      comment = trimmed.replace(quoteMatch[0], '').trim();
    }

    // Extract rating e.g. [5/5] or 4/5 or Puan: 5
    const ratingMatch = trimmed.match(/(?:Puan|Rating|Score)?[:\s]*([1-5])\s*\/\s*5/i);
    if (ratingMatch) {
      rating = parseInt(ratingMatch[1], 10);
    }

    // Extract reader name if format Okur: Ayşe or From: John
    const readerMatch = trimmed.match(/(?:Okur|Reader|From|Gönderen):\s*([^\n\r]+)/i);
    if (readerMatch) {
      readerName = readerMatch[1].trim();
    }

    // Extract doc title or chapter if [Bölüm 1] or Bölüm: 1
    const chapterMatch = trimmed.match(/(?:\[|\b)(?:Bölüm|Chapter|Sahne|Scene)\s*([0-9a-zA-Z\s]+?)(?:\]|\n|$)/i);
    if (chapterMatch) {
      docTitle = `Bölüm ${chapterMatch[1].trim()}`;
    }

    results.push({
      readerName,
      documentId: docId,
      documentTitle: docTitle,
      quoteSnippet: quote || undefined,
      comment: comment || trimmed,
      rating,
      status: 'new',
      tags: ['import']
    });
  }

  // Fallback if no delimiter caught multiple paragraphs
  if (results.length === 0 && rawText.trim().length > 0) {
    results.push({
      readerName: defaultReader,
      documentId: defaultDocId,
      documentTitle: defaultDocTitle,
      comment: rawText.trim(),
      status: 'new',
      tags: ['manual']
    });
  }

  return results;
};

export interface FeedbackSnapshot {
  comments: FeedbackComment[];
  readers: BetaReaderProfile[];
  activeFilter: FeedbackFilterOptions;
}

export class FeedbackStore {
  private comments: FeedbackComment[] = [];
  private readers: BetaReaderProfile[] = [];
  private activeFilter: FeedbackFilterOptions = {
    status: 'all',
    documentId: 'all',
    readerName: 'all',
    searchQuery: ''
  };
  private cachedSnapshot: FeedbackSnapshot;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.cachedSnapshot = {
      comments: this.comments,
      readers: this.readers,
      activeFilter: this.activeFilter
    };
    this.loadFromStorage();
    this.updateSnapshot();
  }

  private updateSnapshot() {
    this.cachedSnapshot = {
      comments: this.comments,
      readers: this.readers,
      activeFilter: this.activeFilter
    };
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.comments)) this.comments = parsed.comments;
          if (Array.isArray(parsed.readers)) this.readers = parsed.readers;
        }
      }
    } catch {
      // Ignore
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ comments: this.comments, readers: this.readers })
        );
      }
    } catch {
      // Ignore
    }
    this.updateSnapshot();
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): FeedbackSnapshot => {
    return this.cachedSnapshot;
  };

  public getState() {
    return {
      ...this.getSnapshot(),
      addComment: this.addComment.bind(this),
      updateCommentStatus: this.updateCommentStatus.bind(this),
      deleteComment: this.deleteComment.bind(this),
      importFromText: this.importFromText.bind(this),
      importFromJson: this.importFromJson.bind(this),
      exportToJson: this.exportToJson.bind(this),
      setFilter: this.setFilter.bind(this),
      clearAll: this.clearAll.bind(this)
    };
  }

  public addComment(commentData: Omit<FeedbackComment, 'id' | 'createdAt'>): FeedbackComment {
    const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newComment: FeedbackComment = {
      ...commentData,
      id,
      createdAt: new Date().toISOString()
    };

    this.comments = [newComment, ...this.comments];

    // Update reader profile
    const existingIndex = this.readers.findIndex(
      (r) => r.name.toLowerCase() === newComment.readerName.toLowerCase()
    );

    if (existingIndex >= 0) {
      this.readers[existingIndex] = {
        ...this.readers[existingIndex],
        totalFeedbackCount: this.readers[existingIndex].totalFeedbackCount + 1
      };
    } else {
      this.readers.push({
        id: `reader_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        name: newComment.readerName,
        totalFeedbackCount: 1,
        role: 'beta'
      });
    }

    this.saveToStorage();
    return newComment;
  }

  public updateCommentStatus(id: string, status: FeedbackComment['status']) {
    this.comments = this.comments.map((c) => (c.id === id ? { ...c, status } : c));
    this.saveToStorage();
  }

  public deleteComment(id: string) {
    this.comments = this.comments.filter((c) => c.id !== id);
    this.saveToStorage();
  }

  public importFromText(rawContent: string, defaultReader: string, defaultDocId?: string): FeedbackComment[] {
    const parsed = parseFeedbackText(rawContent, defaultReader, defaultDocId);
    const added: FeedbackComment[] = [];
    for (const item of parsed) {
      added.push(this.addComment(item));
    }
    return added;
  }

  public importFromJson(jsonString: string): number {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) return 0;
      let count = 0;
      for (const item of data) {
        if (item.comment && item.readerName) {
          this.addComment({
            readerName: item.readerName,
            documentId: item.documentId,
            documentTitle: item.documentTitle,
            quoteSnippet: item.quoteSnippet,
            comment: item.comment,
            rating: item.rating,
            status: item.status || 'new',
            tags: item.tags || []
          });
          count++;
        }
      }
      return count;
    } catch {
      return 0;
    }
  }

  public exportToJson(): string {
    return JSON.stringify(this.comments, null, 2);
  }

  public setFilter(filter: Partial<FeedbackFilterOptions>) {
    this.activeFilter = { ...this.activeFilter, ...filter };
    this.updateSnapshot();
    this.notify();
  }

  public clearAll() {
    this.comments = [];
    this.readers = [];
    this.saveToStorage();
  }
}

export const feedbackStore = new FeedbackStore();

/**
 * React hook using useSyncExternalStore for zero-dependency reactivity
 */
export function useFeedbackStore() {
  const snapshot = useSyncExternalStore(
    feedbackStore.subscribe,
    feedbackStore.getSnapshot,
    feedbackStore.getSnapshot
  );

  return {
    ...snapshot,
    addComment: feedbackStore.addComment.bind(feedbackStore),
    updateCommentStatus: feedbackStore.updateCommentStatus.bind(feedbackStore),
    deleteComment: feedbackStore.deleteComment.bind(feedbackStore),
    importFromText: feedbackStore.importFromText.bind(feedbackStore),
    importFromJson: feedbackStore.importFromJson.bind(feedbackStore),
    exportToJson: feedbackStore.exportToJson.bind(feedbackStore),
    setFilter: feedbackStore.setFilter.bind(feedbackStore),
    clearAll: feedbackStore.clearAll.bind(feedbackStore)
  };
}

// Helper for non-react test access
useFeedbackStore.getState = () => feedbackStore.getState();
