/**
 * textDiffEngine.ts — Faz 43: Görsel Versiyon Karşılaştırma ve Metin Farkı Motoru.
 *
 * Sağlanan Yetenekler:
 * 1) Kelime ve satır düzeyinde yüksek performanslı diff hesaplama (LCS tabanlı)
 * 2) Inline ve Split (yan yana) diff formatı oluşturma
 * 3) Paragraf tabanlı görselleştirme ve diff istatistikleri
 * 4) Seçmeli geri alma (Selective Rollback): Belirli bir paragraf veya bloğu eski versiyondan tek tıkla geri getirme
 */

export type DiffType = 'equal' | 'insert' | 'delete';

export interface DiffChange {
  type: DiffType;
  value: string;
}

export interface DiffLine {
  type: DiffType;
  oldLineNumber?: number;
  newLineNumber?: number;
  text: string;
  wordChanges?: DiffChange[];
}

export interface SplitDiffRow {
  oldLineNumber?: number;
  oldText?: string;
  oldType?: DiffType;
  newLineNumber?: number;
  newText?: string;
  newType?: DiffType;
  type: 'equal' | 'modify' | 'insert' | 'delete';
}

export interface ParagraphDiff {
  id: string;
  oldIndex?: number;
  newIndex?: number;
  oldContent?: string;
  newContent?: string;
  type: 'equal' | 'modify' | 'insert' | 'delete';
  wordChanges: DiffChange[];
}

export interface DiffStats {
  addedWords: number;
  deletedWords: number;
  unchangedWords: number;
  addedChars: number;
  deletedChars: number;
  similarityRatio: number; // 0.0 to 1.0 (1.0 = identical)
}

/**
 * Tokenize a text into words, whitespace, and punctuation for granular word-level diffing.
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  // Tokenize preserving words and whitespace/punctuation
  const tokens = text.match(/[\p{L}\p{N}_]+|[^\p{L}\p{N}_\s]+|\s+/gu);
  return tokens || [];
}

/**
 * General LCS (Longest Common Subsequence) diff generator for generic token arrays.
 */
export function computeLcsDiff<T>(
  oldTokens: T[],
  newTokens: T[],
  equals: (a: T, b: T) => boolean = (a, b) => a === b
): { type: DiffType; item: T }[] {
  const n = oldTokens.length;
  const m = newTokens.length;

  if (n === 0 && m === 0) return [];
  if (n === 0) {
    return newTokens.map((item) => ({ type: 'insert', item }));
  }
  if (m === 0) {
    return oldTokens.map((item) => ({ type: 'delete', item }));
  }

  // Optimize: Check for equality
  if (n === m && oldTokens.every((t, i) => equals(t, newTokens[i]))) {
    return oldTokens.map((item) => ({ type: 'equal', item }));
  }

  // Dynamic programming table for LCS
  // For memory safety with very large text, we limit matrix or use classic 2D table for standard drafts
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (equals(oldTokens[i], newTokens[j])) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to find the diff path
  const result: { type: DiffType; item: T }[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && equals(oldTokens[i - 1], newTokens[j - 1])) {
      result.unshift({ type: 'equal', item: oldTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', item: newTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'delete', item: oldTokens[i - 1] });
      i--;
    }
  }

  return result;
}

/**
 * Computes word-level diff between two text strings.
 */
export function computeWordDiff(oldText: string, newText: string): DiffChange[] {
  if (oldText === newText) {
    return oldText ? [{ type: 'equal', value: oldText }] : [];
  }
  if (!oldText) {
    return newText ? [{ type: 'insert', value: newText }] : [];
  }
  if (!newText) {
    return oldText ? [{ type: 'delete', value: oldText }] : [];
  }

  const oldWords = tokenizeWords(oldText);
  const newWords = tokenizeWords(newText);

  const rawDiff = computeLcsDiff(oldWords, newWords);

  // Group adjacent identical types for cleaner output
  const grouped: DiffChange[] = [];
  for (const part of rawDiff) {
    const last = grouped[grouped.length - 1];
    if (last && last.type === part.type) {
      last.value += part.item;
    } else {
      grouped.push({ type: part.type, value: part.item });
    }
  }

  return grouped;
}

/**
 * Computes line-level inline diff.
 */
export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  const raw = computeLcsDiff(oldLines, newLines);

  const result: DiffLine[] = [];
  let oldLineCounter = 1;
  let newLineCounter = 1;

  for (const item of raw) {
    if (item.type === 'equal') {
      result.push({
        type: 'equal',
        oldLineNumber: oldLineCounter++,
        newLineNumber: newLineCounter++,
        text: item.item,
      });
    } else if (item.type === 'delete') {
      result.push({
        type: 'delete',
        oldLineNumber: oldLineCounter++,
        text: item.item,
      });
    } else if (item.type === 'insert') {
      result.push({
        type: 'insert',
        newLineNumber: newLineCounter++,
        text: item.item,
      });
    }
  }

  return result;
}

/**
 * Computes Split (Side-by-Side) Diff Rows.
 */
export function computeSplitDiff(oldText: string, newText: string): SplitDiffRow[] {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  const raw = computeLcsDiff(oldLines, newLines);
  const rows: SplitDiffRow[] = [];

  let oldIdx = 1;
  let newIdx = 1;

  let i = 0;
  while (i < raw.length) {
    const current = raw[i];

    if (current.type === 'equal') {
      rows.push({
        oldLineNumber: oldIdx++,
        oldText: current.item,
        oldType: 'equal',
        newLineNumber: newIdx++,
        newText: current.item,
        newType: 'equal',
        type: 'equal',
      });
      i++;
    } else if (current.type === 'delete') {
      // Lookahead: If next is an insert, pair them as 'modify'
      const next = raw[i + 1];
      if (next && next.type === 'insert') {
        rows.push({
          oldLineNumber: oldIdx++,
          oldText: current.item,
          oldType: 'delete',
          newLineNumber: newIdx++,
          newText: next.item,
          newType: 'insert',
          type: 'modify',
        });
        i += 2;
      } else {
        rows.push({
          oldLineNumber: oldIdx++,
          oldText: current.item,
          oldType: 'delete',
          type: 'delete',
        });
        i++;
      }
    } else if (current.type === 'insert') {
      rows.push({
        newLineNumber: newIdx++,
        newText: current.item,
        newType: 'insert',
        type: 'insert',
      });
      i++;
    }
  }

  return rows;
}

/**
 * Splits text into paragraphs separated by one or more blank lines.
 */
export function splitParagraphs(text: string): string[] {
  if (!text.trim()) return [];
  return text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
}

/**
 * Computes paragraph-level diff with word-level changes embedded for selective rollback.
 */
export function computeParagraphDiff(oldText: string, newText: string): ParagraphDiff[] {
  const oldParas = splitParagraphs(oldText);
  const newParas = splitParagraphs(newText);

  const raw = computeLcsDiff(oldParas, newParas);
  const result: ParagraphDiff[] = [];

  let oldIdx = 0;
  let newIdx = 0;
  let idCounter = 1;

  let i = 0;
  while (i < raw.length) {
    const current = raw[i];

    if (current.type === 'equal') {
      result.push({
        id: `p-diff-${idCounter++}`,
        oldIndex: oldIdx++,
        newIndex: newIdx++,
        oldContent: current.item,
        newContent: current.item,
        type: 'equal',
        wordChanges: [{ type: 'equal', value: current.item }],
      });
      i++;
    } else if (current.type === 'delete') {
      const next = raw[i + 1];
      if (next && next.type === 'insert') {
        // Paired as modify
        const words = computeWordDiff(current.item, next.item);
        result.push({
          id: `p-diff-${idCounter++}`,
          oldIndex: oldIdx++,
          newIndex: newIdx++,
          oldContent: current.item,
          newContent: next.item,
          type: 'modify',
          wordChanges: words,
        });
        i += 2;
      } else {
        result.push({
          id: `p-diff-${idCounter++}`,
          oldIndex: oldIdx++,
          oldContent: current.item,
          type: 'delete',
          wordChanges: [{ type: 'delete', value: current.item }],
        });
        i++;
      }
    } else if (current.type === 'insert') {
      result.push({
        id: `p-diff-${idCounter++}`,
        newIndex: newIdx++,
        newContent: current.item,
        type: 'insert',
        wordChanges: [{ type: 'insert', value: current.item }],
      });
      i++;
    }
  }

  return result;
}

/**
 * Rollback a specific paragraph from old version into the current text.
 * - If modified: replaces the modified paragraph with the old paragraph.
 * - If deleted in new: inserts the old paragraph back into position.
 * - If inserted in new: removes the inserted paragraph.
 */
export function rollbackParagraph(
  currentText: string,
  paragraphDiffs: ParagraphDiff[],
  targetDiffId: string
): string {
  const target = paragraphDiffs.find((d) => d.id === targetDiffId);
  if (!target || target.type === 'equal') {
    return currentText;
  }

  const currentParas = splitParagraphs(currentText);

  if (target.type === 'modify') {
    if (target.newIndex !== undefined && target.oldContent !== undefined) {
      if (target.newIndex >= 0 && target.newIndex < currentParas.length) {
        currentParas[target.newIndex] = target.oldContent;
      }
    }
  } else if (target.type === 'insert') {
    // Paragraph was added in current, rollback means removing it
    if (target.newIndex !== undefined && target.newIndex >= 0 && target.newIndex < currentParas.length) {
      currentParas.splice(target.newIndex, 1);
    }
  } else if (target.type === 'delete') {
    // Paragraph was deleted in current, rollback means re-inserting it
    if (target.oldContent !== undefined) {
      // Find insertion index based on surrounding diffs
      const diffIndex = paragraphDiffs.indexOf(target);
      let insertIndex = 0;
      for (let k = 0; k < diffIndex; k++) {
        const prev = paragraphDiffs[k];
        if (prev.newIndex !== undefined) {
          insertIndex = prev.newIndex + 1;
        }
      }
      currentParas.splice(insertIndex, 0, target.oldContent);
    }
  }

  return currentParas.join('\n\n');
}

/**
 * Calculates statistics (words added, deleted, unchanged, similarity ratio).
 */
export function getDiffStats(oldText: string, newText: string): DiffStats {
  const wordDiffs = computeWordDiff(oldText, newText);

  let addedWords = 0;
  let deletedWords = 0;
  let unchangedWords = 0;
  let addedChars = 0;
  let deletedChars = 0;

  for (const part of wordDiffs) {
    const words = part.value.trim().split(/\s+/).filter(Boolean).length;
    const chars = part.value.length;

    if (part.type === 'insert') {
      addedWords += words;
      addedChars += chars;
    } else if (part.type === 'delete') {
      deletedWords += words;
      deletedChars += chars;
    } else {
      unchangedWords += words;
    }
  }

  const totalWords = unchangedWords + Math.max(addedWords, deletedWords);
  const similarityRatio = totalWords === 0 ? 1.0 : Number((unchangedWords / totalWords).toFixed(3));

  return {
    addedWords,
    deletedWords,
    unchangedWords,
    addedChars,
    deletedChars,
    similarityRatio,
  };
}
