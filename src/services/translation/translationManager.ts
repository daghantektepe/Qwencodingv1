/**
 * translationManager.ts — Faz 59: Çoklu Dil Çeviri ve Yerelleştirme Yöneticisi
 */

import {
  TranslationSession,
  TranslationParagraph,
  GlossaryTerm,
  TranslationProgress,
  TranslationStatus
} from '../../types/translation';

export class TranslationManager {
  private sessions = new Map<string, TranslationSession>();

  public createSession(
    sourceDocId: string,
    sourceDocTitle: string,
    sourceContent: string,
    sourceLang: string = 'en',
    targetLang: string = 'tr'
  ): TranslationSession {
    const rawParagraphs = sourceContent
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const paragraphs: TranslationParagraph[] = (
      rawParagraphs.length > 0 ? rawParagraphs : [sourceContent.trim() || '']
    ).map((text, idx) => ({
      id: `p-${idx + 1}-${Date.now()}`,
      sourceText: text,
      targetText: '',
      status: 'empty',
    }));

    const session: TranslationSession = {
      id: `tsess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sourceDocId,
      sourceDocTitle,
      sourceLang,
      targetLang,
      paragraphs,
      glossary: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  public getSession(id: string): TranslationSession | undefined {
    return this.sessions.get(id);
  }

  public updateTargetParagraph(
    sessionId: string,
    paragraphId: string,
    targetText: string,
    status?: TranslationStatus
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Çeviri oturumu bulunamadı');

    const p = session.paragraphs.find((para) => para.id === paragraphId);
    if (!p) throw new Error('Paragraf bulunamadı');

    p.targetText = targetText;
    if (status) {
      p.status = status;
    } else {
      p.status = targetText.trim().length > 0 ? 'draft' : 'empty';
    }
    session.updatedAt = new Date().toISOString();
  }

  public approveParagraph(sessionId: string, paragraphId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Çeviri oturumu bulunamadı');

    const p = session.paragraphs.find((para) => para.id === paragraphId);
    if (!p) throw new Error('Paragraf bulunamadı');

    p.status = 'approved';
    session.updatedAt = new Date().toISOString();
  }

  public addGlossaryTerm(
    sessionId: string,
    sourceWord: string,
    targetWord: string,
    notes?: string,
    caseSensitive: boolean = false
  ): GlossaryTerm {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Çeviri oturumu bulunamadı');

    const term: GlossaryTerm = {
      id: `term-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sourceWord: sourceWord.trim(),
      targetWord: targetWord.trim(),
      notes,
      caseSensitive,
    };

    session.glossary.push(term);
    session.updatedAt = new Date().toISOString();
    return term;
  }

  public removeGlossaryTerm(sessionId: string, termId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.glossary = session.glossary.filter((t) => t.id !== termId);
    session.updatedAt = new Date().toISOString();
  }

  public findGlossaryMatches(sessionId: string, text: string): GlossaryTerm[] {
    const session = this.sessions.get(sessionId);
    if (!session || !text) return [];

    return session.glossary.filter((term) => {
      if (term.caseSensitive) {
        return text.includes(term.sourceWord);
      }
      return text.toLowerCase().includes(term.sourceWord.toLowerCase());
    });
  }

  public getProgress(sessionId: string): TranslationProgress {
    const session = this.sessions.get(sessionId);
    if (!session || session.paragraphs.length === 0) {
      return { totalParagraphs: 0, translatedCount: 0, approvedCount: 0, percentage: 0 };
    }

    const total = session.paragraphs.length;
    let translated = 0;
    let approved = 0;

    for (const p of session.paragraphs) {
      if (p.status === 'approved') {
        approved++;
        translated++;
      } else if (p.targetText.trim().length > 0) {
        translated++;
      }
    }

    const percentage = Math.round((translated / total) * 100);
    return {
      totalParagraphs: total,
      translatedCount: translated,
      approvedCount: approved,
      percentage,
    };
  }

  public exportTargetDocument(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Çeviri oturumu bulunamadı');

    return session.paragraphs
      .map((p) => p.targetText.trim())
      .filter((t) => t.length > 0)
      .join('\n\n');
  }

  public exportSessionJson(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Çeviri oturumu bulunamadı');
    return JSON.stringify(session, null, 2);
  }

  public clear(): void {
    this.sessions.clear();
  }
}

export const translationManager = new TranslationManager();
export default translationManager;
