/**
 * paginationLayout.ts — Faz 52: Matbaa Dizgi Geometrisi, Ayna Kenar Boşlukları ve Sayfalama
 */

export type PageFormat = 'trade-pb' | 'pocket' | 'a5' | 'a4';

export interface PageDimensions {
  widthMm: number;
  heightMm: number;
  name: string;
}

export const PAGE_SIZES: Record<PageFormat, PageDimensions> = {
  'trade-pb': { widthMm: 152.4, heightMm: 228.6, name: 'Trade Paperback (6x9 in)' },
  pocket: { widthMm: 127.0, heightMm: 203.2, name: 'Pocket Book (5x8 in)' },
  a5: { widthMm: 148.0, heightMm: 210.0, name: 'A5 (148 x 210 mm)' },
  a4: { widthMm: 210.0, heightMm: 297.0, name: 'A4 (210 x 297 mm)' },
};

export interface MarginConfig {
  topMm: number;
  bottomMm: number;
  insideMm: number; // Cilt payı (Gutter)
  outsideMm: number;
}

export interface PrintChapterInput {
  id: string;
  title: string;
  content: string;
}

export interface PrintPage {
  pageIndex: number;
  pageNumber: number;
  pageNumberFormatted: string;
  isLeftPage: boolean; // false = recto (sağ), true = verso (sol)
  headerText: string;
  paragraphs: string[];
  isChapterStart?: boolean;
  chapterTitle?: string;
}

export interface PaginationOptions {
  format?: PageFormat;
  margins?: Partial<MarginConfig>;
  bookTitle?: string;
  authorName?: string;
  wordsPerPage?: number;
  numberingStyle?: 'arabic' | 'roman-lower' | 'roman-upper';
  startPageNumber?: number;
}

export function toRoman(num: number, uppercase = false): string {
  if (num <= 0) return '';
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let roman = '';
  let n = num;
  for (let i = 0; i < val.length; i++) {
    while (n >= val[i]) {
      roman += syms[i];
      n -= val[i];
    }
  }
  return uppercase ? roman : roman.toLowerCase();
}

export function formatPageNumber(num: number, style: 'arabic' | 'roman-lower' | 'roman-upper' = 'arabic'): string {
  if (style === 'roman-lower') return toRoman(num, false);
  if (style === 'roman-upper') return toRoman(num, true);
  return String(num);
}

/**
 * Metni sayfalara böler, ayna boşlukları ve tek/çift sayfa üstbilgilerini (running headers) hesaplar.
 */
export function calculatePagination(
  chapters: PrintChapterInput[],
  options: PaginationOptions = {}
): PrintPage[] {
  const wordsPerPage = options.wordsPerPage || 260; // Standart roman sayfa yoğunluğu
  const startNum = options.startPageNumber || 1;
  const bookTitle = options.bookTitle || 'Kitap Başlığı';
  const authorName = options.authorName || 'Yazar';
  const style = options.numberingStyle || 'arabic';

  const pages: PrintPage[] = [];
  let currentPageNumber = startNum;
  let pageIndex = 0;

  chapters.forEach((chapter) => {
    const rawParagraphs = chapter.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let currentBatch: string[] = [];
    let currentWords = 0;
    let isFirstPageOfChapter = true;

    // Bölümler geleneksel olarak sağ sayfada (tek sayı) başlamalıdır
    if (pages.length > 0 && currentPageNumber % 2 === 0) {
      // Sol sayfada kaldıysa boş bir geçiş sayfası (blank verso) ekle
      pages.push({
        pageIndex,
        pageNumber: currentPageNumber,
        pageNumberFormatted: '',
        isLeftPage: true,
        headerText: '',
        paragraphs: [],
      });
      pageIndex++;
      currentPageNumber++;
    }

    rawParagraphs.forEach((para) => {
      const wordsInPara = para.split(/\s+/).length;
      if (currentWords + wordsInPara > wordsPerPage && currentBatch.length > 0) {
        const isLeft = currentPageNumber % 2 === 0;
        pages.push({
          pageIndex,
          pageNumber: currentPageNumber,
          pageNumberFormatted: formatPageNumber(currentPageNumber, style),
          isLeftPage: isLeft,
          headerText: isLeft ? authorName : bookTitle,
          paragraphs: currentBatch,
          isChapterStart: isFirstPageOfChapter,
          chapterTitle: isFirstPageOfChapter ? chapter.title : undefined,
        });

        pageIndex++;
        currentPageNumber++;
        currentBatch = [para];
        currentWords = wordsInPara;
        isFirstPageOfChapter = false;
      } else {
        currentBatch.push(para);
        currentWords += wordsInPara;
      }
    });

    if (currentBatch.length > 0) {
      const isLeft = currentPageNumber % 2 === 0;
      pages.push({
        pageIndex,
        pageNumber: currentPageNumber,
        pageNumberFormatted: formatPageNumber(currentPageNumber, style),
        isLeftPage: isLeft,
        headerText: isLeft ? authorName : bookTitle,
        paragraphs: currentBatch,
        isChapterStart: isFirstPageOfChapter,
        chapterTitle: isFirstPageOfChapter ? chapter.title : undefined,
      });
      pageIndex++;
      currentPageNumber++;
    }
  });

  return pages;
}
