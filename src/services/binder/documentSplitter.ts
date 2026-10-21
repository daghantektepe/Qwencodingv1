/**
 * documentSplitter.ts — Faz 65: Doküman Parçalama ve Sahneye Bölme Motoru
 */

export interface SplitChunk {
  title: string;
  content: string;
  wordCount: number;
}

export type SplitPatternType = 'chapters' | 'scenes' | 'custom';

export class DocumentSplitter {
  /**
   * İmleç konumundan dokümanı ikiye böler
   */
  public splitAtCursor(
    fullText: string,
    cursorOffset: number,
    originalTitle: string = 'Belge',
    secondTitle?: string
  ): [SplitChunk, SplitChunk] {
    const safeOffset = Math.max(0, Math.min(fullText.length, cursorOffset));

    const firstContent = fullText.slice(0, safeOffset).trim();
    const secondContent = fullText.slice(safeOffset).trim();

    const title2 = secondTitle && secondTitle.trim().length > 0
      ? secondTitle.trim()
      : `${originalTitle} (Kısım 2)`;

    return [
      {
        title: originalTitle,
        content: firstContent,
        wordCount: this.countWords(firstContent),
      },
      {
        title: title2,
        content: secondContent,
        wordCount: this.countWords(secondContent),
      },
    ];
  }

  /**
   * Özel ayraç kalıplarına (Bölüm başlıkları, *** ayraçları veya regex) göre tek hamlede çoklu parçalama
   */
  public splitByPattern(
    fullText: string,
    patternType: SplitPatternType = 'chapters',
    customRegexStr?: string,
    baseTitle: string = 'Bölüm'
  ): SplitChunk[] {
    if (!fullText || fullText.trim().length === 0) return [];

    let regex: RegExp;
    if (patternType === 'scenes') {
      // *** veya ### veya --- veya * * * sahne kırılımları
      regex = /^\s*(?:\*\*\*|###|---|\*\s\*\s\*)\s*$/gm;
    } else if (patternType === 'custom' && customRegexStr) {
      regex = new RegExp(customRegexStr, 'gmi');
    } else {
      // Bölüm 1, Chapter 2, Kısım III vb.
      regex = /^(?:Bölüm|Chapter|Kısım)\s+([0-9IVXLCDM]+|[A-Za-zÇĞİÖŞÜçğıöşü]+).*$/gmi;
    }

    const matches: Array<{ index: number; title: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(fullText)) !== null) {
      matches.push({
        index: match.index,
        title: match[0].trim(),
      });
    }

    if (matches.length === 0) {
      // Kalıp eşleşmediyse tek parça olarak döner
      return [
        {
          title: baseTitle,
          content: fullText.trim(),
          wordCount: this.countWords(fullText),
        },
      ];
    }

    const chunks: SplitChunk[] = [];

    // İlk eşleşmeden önce bir giriş metni varsa ekle
    if (matches[0].index > 0) {
      const prologue = fullText.substring(0, matches[0].index).trim();
      if (prologue.length > 0) {
        chunks.push({
          title: patternType === 'scenes' ? 'Sahne 1' : 'Giriş / Önsöz',
          content: prologue,
          wordCount: this.countWords(prologue),
        });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const nextIndex = i < matches.length - 1 ? matches[i + 1].index : fullText.length;
      const rawSection = fullText.substring(current.index, nextIndex).trim();

      // Başlık satırını içerikten arındır veya ilk satırı başlık olarak al
      const lines = rawSection.split('\n');
      const title = patternType === 'scenes' ? `Sahne ${chunks.length + 1}` : lines[0].trim();
      const content = patternType === 'scenes' ? lines.slice(1).join('\n').trim() : rawSection;

      chunks.push({
        title,
        content: content || rawSection,
        wordCount: this.countWords(content || rawSection),
      });
    }

    return chunks;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
}

export const documentSplitter = new DocumentSplitter();
export default documentSplitter;
