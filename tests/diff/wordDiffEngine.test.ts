import { describe, it, expect, beforeEach } from 'vitest';
import { WordDiffEngine } from '../../src/services/diff/wordDiffEngine';

describe('Phase 64: Side-by-Side Visual Diff & Snapshot Comparator (wordDiffEngine)', () => {
  let engine: WordDiffEngine;

  beforeEach(() => {
    engine = new WordDiffEngine();
  });

  it('computes word diff with additions, deletions, and equalities', () => {
    const oldText = 'Hızlı kahverengi tilki.';
    const newText = 'Hızlı kızıl tilki koştu.';

    const diff = engine.computeWordDiff(oldText, newText);

    expect(diff.length).toBeGreaterThan(0);
    const removed = diff.find((d) => d.type === 'removed');
    const added = diff.find((d) => d.type === 'added');

    expect(removed?.value).toContain('kahverengi');
    expect(added?.value).toContain('kızıl');
  });

  it('handles identical texts and completely disjoint texts', () => {
    const identical = engine.computeWordDiff('Aynı metin burası.', 'Aynı metin burası.');
    expect(identical).toHaveLength(1);
    expect(identical[0].type).toBe('equal');

    const disjoint = engine.computeWordDiff('Elma', 'Armut');
    expect(disjoint.some((d) => d.type === 'removed')).toBe(true);
    expect(disjoint.some((d) => d.type === 'added')).toBe(true);
  });

  it('computes line-by-line diff with line numbers and modified status', () => {
    const textA = 'Satır bir\nEski satır iki\nSatır üç';
    const textB = 'Satır bir\nYeni satır iki\nSatır üç\nEklenen satır dört';

    const lines = engine.computeLineByLineDiff(textA, textB);

    expect(lines).toHaveLength(4);
    expect(lines[0].status).toBe('unchanged');
    expect(lines[1].status).toBe('modified');
    expect(lines[2].status).toBe('unchanged');
    expect(lines[3].status).toBe('added');
  });

  it('computes summary with additions, deletions, and similarity percentage', () => {
    const oldT = 'Bir iki üç dört.';
    const newT = 'Bir iki beş altı.';

    const summary = engine.getDiffSummary(oldT, newT);
    expect(summary.additions).toBeGreaterThan(0);
    expect(summary.deletions).toBeGreaterThan(0);
    expect(summary.similarityRatio).toBeGreaterThan(0);
    expect(summary.similarityRatio).toBeLessThan(1);
  });
});
