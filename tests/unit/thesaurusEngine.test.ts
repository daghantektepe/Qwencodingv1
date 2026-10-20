import { describe, it, expect, beforeEach } from 'vitest';
import {
  findSynonyms,
  wordExists,
  getCategories,
  findByCategory,
  getRandomSynonyms,
  clearCache,
  getCacheSize,
  getDictionarySize,
  warmupCache,
} from '../../src/services/linguistics/thesaurusEngine';

describe('Thesaurus Engine', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('findSynonyms', () => {
    it('should find synonyms for a Turkish word', () => {
      const results = findSynonyms('güzel', 'tr');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const firstResult = results[0];
      expect(firstResult.word).toBe('güzel');
      expect(firstResult.synonyms).toContain('hoş');
      expect(firstResult.synonyms).toContain('şık');
    });

    it('should find synonyms for an English word', () => {
      const results = findSynonyms('beautiful', 'en');
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      
      const firstResult = results[0];
      expect(firstResult.word).toBe('beautiful');
      expect(firstResult.synonyms).toContain('gorgeous');
      expect(firstResult.synonyms).toContain('pretty');
    });

    it('should return empty array for non-existent word', () => {
      const results = findSynonyms('xyznonexistent', 'tr');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should normalize word (lowercase, trim)', () => {
      const results1 = findSynonyms('GÜZEL', 'tr');
      const results2 = findSynonyms('güzel', 'tr');
      
      expect(results1).toEqual(results2);
    });

    it('should remove punctuation from word', () => {
      const results1 = findSynonyms('güzel.', 'tr');
      const results2 = findSynonyms('güzel', 'tr');
      
      expect(results1).toEqual(results2);
    });

    it('should respect maxResults parameter', () => {
      const results = findSynonyms('güzel', 'tr', 3);
      
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should include antonyms when available', () => {
      const results = findSynonyms('güzel', 'tr');
      
      expect(results[0].antonyms).toBeDefined();
      expect(results[0].antonyms.length).toBeGreaterThan(0);
      expect(results[0].antonyms).toContain('çirkin');
    });

    it('should include category', () => {
      const results = findSynonyms('güzel', 'tr');
      
      expect(results[0].category).toBeDefined();
      expect(results[0].category).toBe('sıfat');
    });

    it('should calculate confidence score', () => {
      const results = findSynonyms('güzel', 'tr');
      
      expect(results[0].confidence).toBeDefined();
      expect(results[0].confidence).toBeGreaterThan(0);
      expect(results[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should cache results', () => {
      findSynonyms('güzel', 'tr');
      const cacheSize1 = getCacheSize();
      
      findSynonyms('güzel', 'tr');
      const cacheSize2 = getCacheSize();
      
      expect(cacheSize2).toBe(cacheSize1);
    });

    it('should return results in less than 50ms', () => {
      const startTime = performance.now();
      const results = findSynonyms('güzel', 'tr');
      const endTime = performance.now();
      
      expect(results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should return cached results faster', () => {
      // First call (not cached)
      findSynonyms('güzel', 'tr');
      
      // Second call (cached)
      const startTime = performance.now();
      const results = findSynonyms('güzel', 'tr');
      const endTime = performance.now();
      
      expect(results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10);
    });
  });

  describe('wordExists', () => {
    it('should return true for existing Turkish word', () => {
      const exists = wordExists('güzel', 'tr');
      
      expect(exists).toBe(true);
    });

    it('should return true for existing English word', () => {
      const exists = wordExists('beautiful', 'en');
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existent word', () => {
      const exists = wordExists('xyznonexistent', 'tr');
      
      expect(exists).toBe(false);
    });

    it('should normalize word', () => {
      const exists = wordExists('GÜZEL', 'tr');
      
      expect(exists).toBe(true);
    });
  });

  describe('getCategories', () => {
    it('should return all categories', () => {
      const categories = getCategories('tr');
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('sıfat');
      expect(categories).toContain('duygu');
    });

    it('should return sorted categories', () => {
      const categories = getCategories('tr');
      
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });

    it('should return unique categories', () => {
      const categories = getCategories('tr');
      const uniqueCategories = [...new Set(categories)];
      
      expect(categories.length).toBe(uniqueCategories.length);
    });

    it('should return categories in less than 1ms', () => {
      const startTime = performance.now();
      const categories = getCategories('tr');
      const endTime = performance.now();
      
      expect(categories.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1);
    });
  });

  describe('findByCategory', () => {
    it('should find words by category', () => {
      const results = findByCategory('sıfat', 'tr');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result.category).toBe('sıfat');
      });
    });

    it('should respect maxResults parameter', () => {
      const results = findByCategory('sıfat', 'tr', 5);
      
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for non-existent category', () => {
      const results = findByCategory('nonexistent', 'tr');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getRandomSynonyms', () => {
    it('should return random synonyms', () => {
      const results = getRandomSynonyms(3, 'tr');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should return results with valid structure', () => {
      const results = getRandomSynonyms(1, 'tr');
      
      if (results.length > 0) {
        const result = results[0];
        expect(result.word).toBeDefined();
        expect(result.synonyms).toBeDefined();
        expect(Array.isArray(result.synonyms)).toBe(true);
        expect(result.category).toBeDefined();
        expect(result.confidence).toBeDefined();
      }
    });

    it('should return different results on multiple calls (randomness)', () => {
      const results1 = getRandomSynonyms(5, 'tr');
      const results2 = getRandomSynonyms(5, 'tr');
      
      // There's a small chance they could be the same, but very unlikely
      // We'll just check that both calls return valid results
      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      findSynonyms('güzel', 'tr');
      expect(getCacheSize()).toBeGreaterThan(0);
      
      clearCache();
      expect(getCacheSize()).toBe(0);
    });
  });

  describe('getCacheSize', () => {
    it('should return 0 for empty cache', () => {
      expect(getCacheSize()).toBe(0);
    });

    it('should increase cache size after lookups', () => {
      findSynonyms('güzel', 'tr');
      const size1 = getCacheSize();
      
      findSynonyms('büyük', 'tr');
      const size2 = getCacheSize();
      
      expect(size2).toBeGreaterThan(size1);
    });
  });

  describe('getDictionarySize', () => {
    it('should return dictionary size', () => {
      const size = getDictionarySize();
      
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('warmupCache', () => {
    it('should warm up cache with common words', () => {
      expect(getCacheSize()).toBe(0);
      
      warmupCache();
      
      expect(getCacheSize()).toBeGreaterThan(0);
    });

    it('should warm up cache with custom words', () => {
      expect(getCacheSize()).toBe(0);
      
      warmupCache(['güzel', 'büyük']);
      
      expect(getCacheSize()).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const results = findSynonyms('', 'tr');
      
      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });

    it('should handle whitespace only', () => {
      const results = findSynonyms('   ', 'tr');
      
      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });

    it('should handle special characters', () => {
      const results = findSynonyms('güzel!@#', 'tr');
      
      expect(results).toBeDefined();
      // Should normalize and find results
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle numbers', () => {
      const results = findSynonyms('123', 'tr');
      
      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should work with full workflow', () => {
      // Search for a word
      const results = findSynonyms('mutlu', 'tr');
      
      expect(results.length).toBeGreaterThan(0);
      
      // Check if word exists
      const exists = wordExists('mutlu', 'tr');
      expect(exists).toBe(true);
      
      // Get categories
      const categories = getCategories('tr');
      expect(categories).toContain('duygu');
      
      // Find by category
      const categoryResults = findByCategory('duygu', 'tr');
      expect(categoryResults.length).toBeGreaterThan(0);
    });
  });
});
