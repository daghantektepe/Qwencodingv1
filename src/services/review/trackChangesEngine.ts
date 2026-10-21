/**
 * trackChangesEngine.ts — Faz 63: Profesyonel Değişiklikleri İzle ve Öneri Motoru
 */

export type TrackedChangeType = 'insert' | 'delete' | 'replace';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface ChangeSuggestion {
  id: string;
  docId: string;
  type: TrackedChangeType;
  startOffset: number;
  originalLength: number;
  originalText: string;
  suggestedText: string;
  author: string;
  createdAt: string;
  status: SuggestionStatus;
}

export interface MarkupSegment {
  text: string;
  type: 'normal' | 'inserted' | 'deleted';
  author?: string;
  suggestionId?: string;
}

export class TrackChangesEngine {
  private isTracking: boolean = true;
  private suggestions: Map<string, ChangeSuggestion[]> = new Map();

  public setTrackingEnabled(enabled: boolean): void {
    this.isTracking = enabled;
  }

  public isTrackingEnabled(): boolean {
    return this.isTracking;
  }

  public proposeInsert(
    docId: string,
    offset: number,
    insertedText: string,
    author: string = 'Öneri Sahibi'
  ): ChangeSuggestion {
    const suggestion: ChangeSuggestion = {
      id: `sug-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      docId,
      type: 'insert',
      startOffset: offset,
      originalLength: 0,
      originalText: '',
      suggestedText: insertedText,
      author,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.addSuggestion(docId, suggestion);
    return suggestion;
  }

  public proposeDelete(
    docId: string,
    offset: number,
    deletedText: string,
    author: string = 'Öneri Sahibi'
  ): ChangeSuggestion {
    const suggestion: ChangeSuggestion = {
      id: `sug-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      docId,
      type: 'delete',
      startOffset: offset,
      originalLength: deletedText.length,
      originalText: deletedText,
      suggestedText: '',
      author,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.addSuggestion(docId, suggestion);
    return suggestion;
  }

  public proposeReplace(
    docId: string,
    offset: number,
    originalText: string,
    suggestedText: string,
    author: string = 'Öneri Sahibi'
  ): ChangeSuggestion {
    const suggestion: ChangeSuggestion = {
      id: `sug-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      docId,
      type: 'replace',
      startOffset: offset,
      originalLength: originalText.length,
      originalText,
      suggestedText,
      author,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.addSuggestion(docId, suggestion);
    return suggestion;
  }

  private addSuggestion(docId: string, suggestion: ChangeSuggestion): void {
    if (!this.suggestions.has(docId)) {
      this.suggestions.set(docId, []);
    }
    this.suggestions.get(docId)!.push(suggestion);
  }

  public getSuggestions(docId: string): ChangeSuggestion[] {
    return this.suggestions.get(docId) || [];
  }

  public getPendingSuggestions(docId: string): ChangeSuggestion[] {
    return (this.suggestions.get(docId) || []).filter((s) => s.status === 'pending');
  }

  public acceptSuggestion(docId: string, suggestionId: string, baseText: string): string {
    const list = this.suggestions.get(docId) || [];
    const sug = list.find((s) => s.id === suggestionId);
    if (!sug || sug.status !== 'pending') return baseText;

    sug.status = 'accepted';

    // Metne uygula
    let result = baseText;
    if (sug.type === 'insert') {
      result = baseText.slice(0, sug.startOffset) + sug.suggestedText + baseText.slice(sug.startOffset);
    } else if (sug.type === 'delete') {
      result = baseText.slice(0, sug.startOffset) + baseText.slice(sug.startOffset + sug.originalLength);
    } else if (sug.type === 'replace') {
      result = baseText.slice(0, sug.startOffset) + sug.suggestedText + baseText.slice(sug.startOffset + sug.originalLength);
    }

    return result;
  }

  public rejectSuggestion(docId: string, suggestionId: string, baseText: string): string {
    const list = this.suggestions.get(docId) || [];
    const sug = list.find((s) => s.id === suggestionId);
    if (!sug || sug.status !== 'pending') return baseText;

    sug.status = 'rejected';
    // Reddedildiği için orijinal baseText aynen kalır
    return baseText;
  }

  public acceptAll(docId: string, baseText: string): string {
    const pending = this.getPendingSuggestions(docId).sort((a, b) => b.startOffset - a.startOffset);
    let result = baseText;

    for (const sug of pending) {
      result = this.acceptSuggestion(docId, sug.id, result);
    }
    return result;
  }

  public rejectAll(docId: string, baseText: string): string {
    const pending = this.getPendingSuggestions(docId);
    for (const sug of pending) {
      sug.status = 'rejected';
    }
    return baseText;
  }

  public renderMarkupSegments(docId: string, baseText: string): MarkupSegment[] {
    const pending = this.getPendingSuggestions(docId).sort((a, b) => a.startOffset - b.startOffset);
    if (pending.length === 0) {
      return [{ text: baseText, type: 'normal' }];
    }

    const segments: MarkupSegment[] = [];
    let currentIdx = 0;

    for (const sug of pending) {
      if (sug.startOffset > currentIdx) {
        segments.push({
          text: baseText.substring(currentIdx, sug.startOffset),
          type: 'normal',
        });
      }

      if (sug.type === 'insert') {
        segments.push({
          text: sug.suggestedText,
          type: 'inserted',
          author: sug.author,
          suggestionId: sug.id,
        });
        currentIdx = sug.startOffset;
      } else if (sug.type === 'delete') {
        segments.push({
          text: sug.originalText,
          type: 'deleted',
          author: sug.author,
          suggestionId: sug.id,
        });
        currentIdx = sug.startOffset + sug.originalLength;
      } else if (sug.type === 'replace') {
        segments.push({
          text: sug.originalText,
          type: 'deleted',
          author: sug.author,
          suggestionId: sug.id,
        });
        segments.push({
          text: sug.suggestedText,
          type: 'inserted',
          author: sug.author,
          suggestionId: sug.id,
        });
        currentIdx = sug.startOffset + sug.originalLength;
      }
    }

    if (currentIdx < baseText.length) {
      segments.push({
        text: baseText.substring(currentIdx),
        type: 'normal',
      });
    }

    return segments;
  }

  public clear(): void {
    this.suggestions.clear();
  }
}

export const trackChangesEngine = new TrackChangesEngine();
export default trackChangesEngine;
