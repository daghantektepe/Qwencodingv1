/**
 * linkGraphEngine.ts — Faz 55: Wiki Tarzı [[Çift Yönlü Bağlantılar]] ve Backlinks Graf Motoru
 */

export interface LinkReference {
  raw: string; // e.g. "[[Karakter Adı]]" or "[[doc-1|Özel İsim]]"
  target: string; // "Karakter Adı" or "doc-1"
  alias?: string; // "Özel İsim"
  sourceDocId: string;
  sourceDocTitle?: string;
  contextSnippet: string;
  position: number;
}

export interface DocumentLinkState {
  docId: string;
  title: string;
  outgoingLinks: LinkReference[];
}

export class LinkGraphEngine {
  private documentLinks = new Map<string, DocumentLinkState>();
  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  /**
   * Metin içindeki tüm [[Hedef]] veya [[Hedef|Görünen İsim]] bağlantılarını ayrıştırır.
   */
  public parseLinks(content: string, sourceDocId: string, sourceDocTitle = ''): LinkReference[] {
    const regex = /\[\[([^[\]|]+)(?:\|([^[\]|]+))?\]\]/g;
    const links: LinkReference[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const target = match[1].trim();
      const alias = match[2]?.trim();
      const pos = match.index;

      // Bağlantının etrafındaki 40 karakterlik bağlam alıntısını (context snippet) çıkar
      const start = Math.max(0, pos - 30);
      const end = Math.min(content.length, pos + match[0].length + 30);
      const snippet = '...' + content.substring(start, end).replace(/\n/g, ' ') + '...';

      links.push({
        raw: match[0],
        target,
        alias,
        sourceDocId,
        sourceDocTitle,
        contextSnippet: snippet,
        position: pos,
      });
    }

    return links;
  }

  /**
   * Doküman güncellendiğinde graf düğümünü ve bağlantılarını günceller.
   */
  public updateDocument(docId: string, title: string, content: string): void {
    const outgoing = this.parseLinks(content, docId, title);
    this.documentLinks.set(docId, {
      docId,
      title,
      outgoingLinks: outgoing,
    });
    this.notify();
  }

  public removeDocument(docId: string): void {
    this.documentLinks.delete(docId);
    this.notify();
  }

  /**
   * Belirtilen dokümandan dışarı giden bağlantıları listeler.
   */
  public getOutgoingLinks(docId: string): LinkReference[] {
    return this.documentLinks.get(docId)?.outgoingLinks || [];
  }

  /**
   * Belirtilen başlığa veya ID'ye referans veren tüm diğer dokümanları (Geri Bağlantılar / Backlinks) bulur.
   */
  public getBacklinks(targetTitleOrId: string, currentDocId?: string): LinkReference[] {
    const targetNormalized = targetTitleOrId.toLowerCase().trim();
    const backlinks: LinkReference[] = [];

    this.documentLinks.forEach((state) => {
      // Kendi kendine bağlantı hariç tutulabilir
      if (currentDocId && state.docId === currentDocId) return;

      state.outgoingLinks.forEach((link) => {
        if (
          link.target.toLowerCase() === targetNormalized ||
          state.title.toLowerCase() === targetNormalized ||
          state.docId === targetTitleOrId
        ) {
          backlinks.push(link);
        }
      });
    });

    return backlinks;
  }

  /**
   * Bir dokümanın başlığı değiştiğinde diğer tüm dokümanlardaki [[Eski Başlık]] referanslarını otomatik günceller.
   */
  public refactorLinkTitles(
    oldTitle: string,
    newTitle: string,
    documents: { id: string; content: string }[]
  ): { id: string; content: string; updated: boolean }[] {
    if (!oldTitle.trim() || !newTitle.trim() || oldTitle === newTitle) {
      return documents.map((d) => ({ ...d, updated: false }));
    }

    // [[Eski Başlık]] veya [[Eski Başlık|Alias]] yakalama regexi
    const escapedOld = oldTitle.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\[\\[${escapedOld}(\\|[^\\]]+)?\\]\\]`, 'g');

    return documents.map((doc) => {
      if (regex.test(doc.content)) {
        const newContent = doc.content.replace(regex, (match, aliasPart) => {
          return `[[${newTitle}${aliasPart || ''}]]`;
        });
        return {
          id: doc.id,
          content: newContent,
          updated: true,
        };
      }
      return {
        id: doc.id,
        content: doc.content,
        updated: false,
      };
    });
  }

  public clear(): void {
    this.documentLinks.clear();
    this.notify();
  }
}

export const linkGraphEngine = new LinkGraphEngine();
export default linkGraphEngine;
