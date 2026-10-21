/**
 * wordDiffEngine.ts — Faz 64: Kelime ve Karakter Seviyesinde Görsel Fark Motoru
 */

export type DiffChangeType = 'equal' | 'added' | 'removed';

export interface DiffToken {
  type: DiffChangeType;
  value: string;
}

export interface DiffLineComparison {
  lineIndex: number;
  leftText: string;
  rightText: string;
  status: 'unchanged' | 'modified' | 'added' | 'removed';
  leftTokens: DiffToken[];
  rightTokens: DiffToken[];
}

export interface DiffSummary {
  additions: number;
  deletions: number;
  unchanged: number;
  similarityRatio: number;
}

export class WordDiffEngine {
  /**
   * Kelime bazlı LCS (Longest Common Subsequence) algoritması
   */
  public computeWordDiff(oldText: string, newText: string): DiffToken[] {
    const oldWords = this.tokenize(oldText);
    const newWords = this.tokenize(newText);

    const m = oldWords.length;
    const n = newWords.length;

    // LCS Matrisi
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (oldWords[i] === newWords[j]) {
          dp[i + 1][j + 1] = dp[i][j] + 1;
        } else {
          dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    // Geriye doğru izleme (Backtrack)
    const result: DiffToken[] = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
        result.unshift({ type: 'equal', value: oldWords[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ type: 'added', value: newWords[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        result.unshift({ type: 'removed', value: oldWords[i - 1] });
        i--;
      }
    }

    return this.mergeAdjacentTokens(result);
  }

  private tokenize(text: string): string[] {
    if (!text) return [];
    // Kelimeleri ve boşluk/noktalama işaretlerini ayrı ayrı koru
    const tokens: string[] = [];
    const regex = /\s+|[^\s]+/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  }

  private mergeAdjacentTokens(tokens: DiffToken[]): DiffToken[] {
    if (tokens.length <= 1) return tokens;

    const merged: DiffToken[] = [];
    let current = { ...tokens[0] };

    for (let idx = 1; idx < tokens.length; idx++) {
      const next = tokens[idx];
      if (next.type === current.type) {
        current.value += next.value;
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
    return merged;
  }

  public computeLineByLineDiff(oldText: string, newText: string): DiffLineComparison[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const maxLines = Math.max(oldLines.length, newLines.length);

    const comparisons: DiffLineComparison[] = [];

    for (let i = 0; i < maxLines; i++) {
      const left = oldLines[i] !== undefined ? oldLines[i] : '';
      const right = newLines[i] !== undefined ? newLines[i] : '';

      let status: 'unchanged' | 'modified' | 'added' | 'removed' = 'unchanged';
      let leftTokens: DiffToken[] = [];
      let rightTokens: DiffToken[] = [];

      if (i >= oldLines.length) {
        status = 'added';
        rightTokens = [{ type: 'added', value: right }];
      } else if (i >= newLines.length) {
        status = 'removed';
        leftTokens = [{ type: 'removed', value: left }];
      } else if (left === right) {
        status = 'unchanged';
        leftTokens = [{ type: 'equal', value: left }];
        rightTokens = [{ type: 'equal', value: right }];
      } else {
        status = 'modified';
        const wordDiff = this.computeWordDiff(left, right);
        leftTokens = wordDiff.filter((t) => t.type !== 'added');
        rightTokens = wordDiff.filter((t) => t.type !== 'removed');
      }

      comparisons.push({
        lineIndex: i + 1,
        leftText: left,
        rightText: right,
        status,
        leftTokens,
        rightTokens,
      });
    }

    return comparisons;
  }

  public getDiffSummary(oldText: string, newText: string): DiffSummary {
    const diff = this.computeWordDiff(oldText, newText);
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    for (const t of diff) {
      const words = t.value.trim().split(/\s+/).filter(Boolean).length;
      if (t.type === 'added') additions += words;
      else if (t.type === 'removed') deletions += words;
      else unchanged += words;
    }

    const total = additions + deletions + unchanged;
    const similarityRatio = total > 0 ? Math.round((unchanged / (unchanged + additions + deletions)) * 100) / 100 : 1;

    return { additions, deletions, unchanged, similarityRatio };
  }
}

export const wordDiffEngine = new WordDiffEngine();
export default wordDiffEngine;
