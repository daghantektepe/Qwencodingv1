// Text analysis utilities

import { WordFrequency } from '../types/analytics';

// Common stop words to exclude from frequency analysis
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for',
  'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or',
  'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they',
  'this', 'to', 'was', 'will', 'with', 'i', 'you', 'he', 'she',
  'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
  'his', 'its', 'our', 'am', 'been', 'being', 'do', 'does', 'did',
  'doing', 'have', 'has', 'had', 'having', 'can', 'could', 'should',
  'would', 'may', 'might', 'must', 'shall', 'need', 'dare', 'ought',
  'used', 'who', 'whom', 'whose', 'which', 'what', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'any', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'because', 'about', 'above', 'after', 'again', 'against',
  'before', 'below', 'between', 'during', 'from', 'here', 'once',
  'only', 'over', 'under', 'until', 'up', 'down', 'off', 'out'
]);

/**
 * Calculate word frequency from text
 */
export function calculateWordFrequency(text: string, includeStopWords: boolean = false): WordFrequency[] {
  const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
  
  if (words.length === 0) return [];
  
  const filteredWords = includeStopWords 
    ? words 
    : words.filter(word => !STOP_WORDS.has(word));
  
  const frequency: Record<string, number> = {};
  
  filteredWords.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  const totalWords = filteredWords.length;
  
  return Object.entries(frequency)
    .map(([word, count]) => ({
      word,
      count,
      percentage: (count / totalWords) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get overused words (words that appear more than a threshold percentage)
 */
export function getOverusedWords(text: string, threshold: number = 3): WordFrequency[] {
  const frequencies = calculateWordFrequency(text);
  return frequencies.filter(f => f.percentage > threshold);
}

/**
 * Count total words in text
 */
export function countWords(text: string): number {
  const words = text.match(/\b\S+\b/g);
  return words ? words.length : 0;
}

/**
 * Count total characters in text
 */
export function countCharacters(text: string, includeSpaces: boolean = true): number {
  return includeSpaces ? text.length : text.replace(/\s/g, '').length;
}

/**
 * Count total sentences in text
 */
export function countSentences(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

/**
 * Count total paragraphs in text
 */
export function countParagraphs(text: string): number {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  return paragraphs.length;
}

/**
 * Calculate average words per sentence
 */
export function calculateAvgWordsPerSentence(text: string): number {
  const words = countWords(text);
  const sentences = countSentences(text);
  return sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0;
}

/**
 * Calculate reading time in minutes (average 200-250 wpm)
 */
export function calculateReadingTime(text: string, wpm: number = 225): number {
  const words = countWords(text);
  return Math.ceil(words / wpm);
}

/**
 * Get text statistics summary
 */
export function getTextStats(text: string) {
  return {
    words: countWords(text),
    characters: countCharacters(text),
    charactersNoSpaces: countCharacters(text, false),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    avgWordsPerSentence: calculateAvgWordsPerSentence(text),
    readingTime: calculateReadingTime(text),
  };
}

/**
 * Calculate WPM (words per minute) for a session
 */
export function calculateWPM(wordsWritten: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  const minutes = durationSeconds / 60;
  return Math.round(wordsWritten / minutes);
}

/**
 * Get top N most frequent words
 */
export function getTopWords(text: string, n: number = 10): WordFrequency[] {
  return calculateWordFrequency(text).slice(0, n);
}
