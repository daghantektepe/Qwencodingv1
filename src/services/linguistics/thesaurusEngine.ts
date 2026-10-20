/**
 * Thesaurus Engine Service
 * Provides synonym lookup and word suggestions for writing assistance
 * Optimized for performance with caching and fast lookups
 */

import trEnThesaurusData from './dictionaries/tr_en_thesaurus.json';

export interface ThesaurusEntry {
  word: string;
  synonyms: string[];
  antonyms?: string[];
  category?: string;
}

export interface ThesaurusResult {
  word: string;
  synonyms: string[];
  antonyms: string[];
  category: string;
  confidence: number;
}

export type Language = 'tr' | 'en';

// Parse and cache the dictionary at module load time for faster lookups
const dictionary: Record<string, ThesaurusEntry[]> = trEnThesaurusData as Record<string, ThesaurusEntry[]>;

// Pre-compute categories for instant access
const allCategories: string[] = (() => {
  const categories = new Set<string>();
  Object.values(dictionary).forEach((entries) => {
    entries.forEach((entry) => {
      if (entry.category) {
        categories.add(entry.category);
      }
    });
  });
  return Array.from(categories).sort();
})();

// In-memory cache for faster lookups
const cache = new Map<string, ThesaurusResult[]>();
const CACHE_MAX_SIZE = 1000;

/**
 * Normalize word for lookup (lowercase, trim, remove all non-alphabetic characters)
 * Supports Turkish and English characters
 */
function normalizeWord(word: string): string {
  // Convert to lowercase and trim
  let normalized = word.toLowerCase().trim();
  
  // Remove all non-alphabetic characters (keep Turkish and English letters only)
  // This regex matches any character that is NOT:
  // - a-z (English lowercase letters)
  // - çğıöşü (Turkish lowercase letters)
  // - whitespace (will be trimmed)
  normalized = normalized.replace(/[^a-zçğıöşü]/g, '');
  
  return normalized;
}

/**
 * Calculate confidence score based on number of synonyms
 */
function calculateConfidence(synonymCount: number): number {
  if (synonymCount === 0) return 0;
  if (synonymCount < 3) return 0.5;
  if (synonymCount < 6) return 0.7;
  if (synonymCount < 10) return 0.85;
  return 1.0;
}

/**
 * Find synonyms for a given word (optimized for performance)
 */
export function findSynonyms(
  word: string,
  language: Language = 'tr',
  maxResults: number = 10
): ThesaurusResult[] {
  const startTime = performance.now();
  
  const normalizedWord = normalizeWord(word);
  
  if (!normalizedWord) {
    return [];
  }

  // Check cache first (O(1) lookup)
  const cacheKey = `${language}:${normalizedWord}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    const result = cached.slice(0, maxResults);
    const endTime = performance.now();
    if (endTime - startTime > 50) {
      console.warn(`findSynonyms took ${endTime - startTime}ms for "${word}" (cached)`);
    }
    return result;
  }

  // Direct dictionary lookup (O(1))
  const entries = dictionary[normalizedWord];
  
  if (!entries || entries.length === 0) {
    const endTime = performance.now();
    if (endTime - startTime > 50) {
      console.warn(`findSynonyms took ${endTime - startTime}ms for "${word}" (not found)`);
    }
    return [];
  }

  // Map entries to results
  const results: ThesaurusResult[] = entries.map((entry) => ({
    word: entry.word,
    synonyms: entry.synonyms.slice(0, maxResults),
    antonyms: entry.antonyms || [],
    category: entry.category || 'general',
    confidence: calculateConfidence(entry.synonyms.length),
  }));

  // Cache results with size limit
  if (cache.size >= CACHE_MAX_SIZE) {
    // Remove oldest entry (first key in Map)
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }
  cache.set(cacheKey, results);

  const endTime = performance.now();
  if (endTime - startTime > 50) {
    console.warn(`findSynonyms took ${endTime - startTime}ms for "${word}"`);
  }

  return results.slice(0, maxResults);
}

/**
 * Check if a word exists in the thesaurus (O(1) lookup)
 */
export function wordExists(word: string, language: Language = 'tr'): boolean {
  const normalizedWord = normalizeWord(word);
  return normalizedWord in dictionary;
}

/**
 * Get all categories available in the thesaurus (pre-computed, O(1))
 */
export function getCategories(language: Language = 'tr'): string[] {
  // Return pre-computed categories (instant access)
  return allCategories;
}

/**
 * Find words by category (optimized with early exit)
 */
export function findByCategory(
  category: string,
  language: Language = 'tr',
  maxResults: number = 20
): ThesaurusResult[] {
  const results: ThesaurusResult[] = [];

  // Iterate through dictionary with early exit when maxResults reached
  for (const [word, entries] of Object.entries(dictionary)) {
    if (results.length >= maxResults) {
      break;
    }

    for (const entry of entries) {
      if (entry.category === category) {
        results.push({
          word: entry.word,
          synonyms: entry.synonyms,
          antonyms: entry.antonyms || [],
          category: entry.category,
          confidence: calculateConfidence(entry.synonyms.length),
        });

        if (results.length >= maxResults) {
          break;
        }
      }
    }
  }

  return results;
}

/**
 * Get random synonyms for inspiration (optimized)
 */
export function getRandomSynonyms(
  count: number = 5,
  language: Language = 'tr'
): ThesaurusResult[] {
  const keys = Object.keys(dictionary);
  const results: ThesaurusResult[] = [];
  const usedIndices = new Set<number>();

  while (results.length < count && usedIndices.size < keys.length) {
    const randomIndex = Math.floor(Math.random() * keys.length);
    
    if (usedIndices.has(randomIndex)) {
      continue;
    }
    
    usedIndices.add(randomIndex);
    const randomKey = keys[randomIndex];
    const entries = dictionary[randomKey];

    if (entries && entries.length > 0) {
      const entry = entries[0];
      results.push({
        word: entry.word,
        synonyms: entry.synonyms,
        antonyms: entry.antonyms || [],
        category: entry.category || 'general',
        confidence: calculateConfidence(entry.synonyms.length),
      });
    }
  }

  return results;
}

/**
 * Clear the cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return cache.size;
}

/**
 * Get dictionary size (for debugging/testing)
 */
export function getDictionarySize(): number {
  return Object.keys(dictionary).length;
}

/**
 * Warm up cache with common words (optional performance optimization)
 */
export function warmupCache(commonWords: string[] = ['güzel', 'büyük', 'küçük', 'mutlu', 'üzgün']): void {
  commonWords.forEach(word => {
    findSynonyms(word, 'tr');
  });
}
