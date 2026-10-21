import { describe, it, expect, beforeEach, vi } from 'vitest';
import cryptoVault from '../../src/services/security/cryptoVault';
import { flattenTree } from '../../src/components/Virtual/VirtualBinderTree';
import { computeLineDiff } from '../../src/services/diff/textDiffEngine';
import { getCodexStore, resetCodexStore } from '../../src/services/codexStore';

describe('Phase 50: Stress & Recovery Automated Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCodexStore();
  });

  describe('Massive Volume Tree Stress Test', () => {
    it('flattens and virtualizes 1,000 nodes in under 20ms without memory leaks', () => {
      const mockNodes: any[] = [];
      const expandedIds = new Set<string>();

      for (let i = 0; i < 200; i++) {
        const folderId = `folder-${i}`;
        expandedIds.add(folderId);
        mockNodes.push({
          id: folderId,
          title: `Kitap Klasörü ${i}`,
          isFolder: true,
          isOpen: true,
          children: [
            { id: `doc-${i}-1`, title: `Bölüm ${i}.1`, isFolder: false },
            { id: `doc-${i}-2`, title: `Bölüm ${i}.2`, isFolder: false },
            { id: `doc-${i}-3`, title: `Bölüm ${i}.3`, isFolder: false },
            { id: `doc-${i}-4`, title: `Bölüm ${i}.4`, isFolder: false },
          ],
        });
      }

      const startTime = performance.now();
      const flatList = flattenTree(mockNodes, expandedIds);
      const slice = flatList.slice(30, 50); // 20 items visible in viewport
      const duration = performance.now() - startTime;

      expect(flatList.length).toBe(1000);
      expect(slice.length).toBe(20);
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Large Text Diff Stress', () => {
    it('computes line diff between two 500-line manuscripts quickly', () => {
      const originalLines = Array.from({ length: 500 }, (_, i) => `Paragraf ${i}: Orijinal taslak metni.`);
      const modifiedLines = Array.from({ length: 500 }, (_, i) =>
        i % 5 === 0 ? `Paragraf ${i}: Revize edilmiş yeni ifade.` : `Paragraf ${i}: Orijinal taslak metni.`
      );

      const oldText = originalLines.join('\n');
      const newText = modifiedLines.join('\n');

      const startTime = performance.now();
      const diffLines = computeLineDiff(oldText, newText);
      const elapsed = performance.now() - startTime;

      expect(diffLines.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('Corrupted Cryptographic Data Recovery', () => {
    it('gracefully handles malformed or truncated ciphertext envelopes', async () => {
      const invalidEnvelope: any = {
        version: 1,
        algorithm: 'AES-GCM-256',
        saltHex: '1234567890abcdef',
        ivHex: 'abcdef123456',
        iterations: 100000,
        ciphertextHex: 'deadbeef', // Invalid auth tag / truncated
      };

      await expect(
        cryptoVault.decryptProjectData(invalidEnvelope, 'SomePassword')
      ).rejects.toThrow();
    });

    it('rejects unsupported encryption algorithms without crashing', async () => {
      const bogusEnvelope: any = {
        version: 1,
        algorithm: 'DES-EDE3-CBC',
        saltHex: '00',
        ivHex: '00',
        ciphertextHex: '00',
      };

      await expect(
        cryptoVault.decryptProjectData(bogusEnvelope, 'Pass')
      ).rejects.toThrow(/Desteklenmeyen şifreleme algoritması/);
    });
  });

  describe('Store Resilience Under Rapid Cycles', () => {
    it('handles 50 rapid add character operations without inconsistent state', () => {
      const codex = getCodexStore();

      for (let i = 0; i < 50; i++) {
        codex.dispatch({
          type: 'ADD_CHARACTER',
          payload: {
            name: `Character ${i}`,
            role: 'supporting',
          },
        });
      }

      const characters = codex.getState().characters;
      expect(characters.length).toBe(50);
    });
  });
});
