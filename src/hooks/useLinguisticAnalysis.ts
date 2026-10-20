import { useState, useEffect, useCallback, useMemo } from 'react';
import { findSynonyms, wordExists, ThesaurusResult, Language } from '../services/linguistics/thesaurusEngine';
import { StyleIssue } from '../components/Linguistics/StyleCheckerPanel';

interface UseLinguisticAnalysisOptions {
  text: string;
  language?: Language;
  enableAutoAnalysis?: boolean;
  analysisDelay?: number;
}

interface UseLinguisticAnalysisReturn {
  // Thesaurus
  selectedWord: string | null;
  synonyms: ThesaurusResult[];
  isWordInThesaurus: boolean;
  searchSynonyms: (word: string) => void;
  clearSynonyms: () => void;
  
  // Style checking
  styleIssues: StyleIssue[];
  isAnalyzing: boolean;
  reanalyze: () => void;
  
  // Text statistics
  wordCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  readingTime: number;
  
  // Actions
  applySuggestion: (issue: StyleIssue) => string;
}

// Style analysis rules
const STYLE_RULES = {
  repeatedWords: {
    pattern: /\b(\w+)\s+\1\b/gi,
    message: 'Aynı kelime art arda kullanılmış',
    type: 'warning' as const,
  },
  passiveVoice: {
    pattern: /\b(edilgen|yapıldı|edildi|olundu)\b/gi,
    message: 'Edilgen çatı kullanılmış',
    type: 'info' as const,
  },
  fillerWords: {
    pattern: /\b(şey|yani|aslında|bence|sanırım|herhalde)\b/gi,
    message: 'Doldurma kelimesi kullanılmış',
    type: 'info' as const,
  },
  doubleSpaces: {
    pattern: /  +/g,
    message: 'Çift boşluk kullanılmış',
    type: 'error' as const,
  },
};

export function useLinguisticAnalysis({
  text,
  language = 'tr',
  enableAutoAnalysis = true,
  analysisDelay = 500,
}: UseLinguisticAnalysisOptions): UseLinguisticAnalysisReturn {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [synonyms, setSynonyms] = useState<ThesaurusResult[]>([]);
  const [styleIssues, setStyleIssues] = useState<StyleIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Check if word exists in thesaurus
  const isWordInThesaurus = useMemo(() => {
    if (!selectedWord) return false;
    return wordExists(selectedWord, language);
  }, [selectedWord, language]);

  // Search for synonyms
  const searchSynonyms = useCallback((word: string) => {
    setSelectedWord(word);
    const results = findSynonyms(word, language);
    setSynonyms(results);
  }, [language]);

  // Clear synonyms
  const clearSynonyms = useCallback(() => {
    setSelectedWord(null);
    setSynonyms([]);
  }, []);

  // Analyze text for style issues
  const analyzeText = useCallback(() => {
    if (!text || text.trim().length === 0) {
      setStyleIssues([]);
      return;
    }

    setIsAnalyzing(true);
    const issues: StyleIssue[] = [];

    // Check repeated words
    const repeatedMatches = text.matchAll(STYLE_RULES.repeatedWords.pattern);
    for (const match of repeatedMatches) {
      issues.push({
        id: `repeated-${match.index}`,
        type: 'warning',
        message: `${STYLE_RULES.repeatedWords.message}: "${match[1]}"`,
        word: match[1],
        position: {
          start: match.index || 0,
          end: (match.index || 0) + match[0].length,
        },
        suggestion: match[1],
      });
    }

    // Check passive voice
    const passiveMatches = text.matchAll(STYLE_RULES.passiveVoice.pattern);
    for (const match of passiveMatches) {
      issues.push({
        id: `passive-${match.index}`,
        type: 'info',
        message: STYLE_RULES.passiveVoice.message,
        word: match[0],
        position: {
          start: match.index || 0,
          end: (match.index || 0) + match[0].length,
        },
      });
    }

    // Check filler words
    const fillerMatches = text.matchAll(STYLE_RULES.fillerWords.pattern);
    for (const match of fillerMatches) {
      issues.push({
        id: `filler-${match.index}`,
        type: 'info',
        message: `${STYLE_RULES.fillerWords.message}: "${match[0]}"`,
        word: match[0],
        position: {
          start: match.index || 0,
          end: (match.index || 0) + match[0].length,
        },
        suggestion: 'Bu kelimeyi çıkarmayı düşünün',
      });
    }

    // Check double spaces
    const doubleSpaceMatches = text.matchAll(STYLE_RULES.doubleSpaces.pattern);
    for (const match of doubleSpaceMatches) {
      issues.push({
        id: `double-space-${match.index}`,
        type: 'error',
        message: STYLE_RULES.doubleSpaces.message,
        position: {
          start: match.index || 0,
          end: (match.index || 0) + match[0].length,
        },
        suggestion: ' ',
      });
    }

    setStyleIssues(issues);
    setIsAnalyzing(false);
  }, [text]);

  // Re-analyze text
  const reanalyze = useCallback(() => {
    analyzeText();
  }, [analyzeText]);

  // Auto-analyze on text change
  useEffect(() => {
    if (!enableAutoAnalysis) return;

    const timer = setTimeout(() => {
      analyzeText();
    }, analysisDelay);

    return () => clearTimeout(timer);
  }, [text, enableAutoAnalysis, analysisDelay, analyzeText]);

  // Text statistics
  const wordCount = useMemo(() => {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).length;
  }, [text]);

  const sentenceCount = useMemo(() => {
    if (!text || text.trim().length === 0) return 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length;
  }, [text]);

  const averageSentenceLength = useMemo(() => {
    if (sentenceCount === 0) return 0;
    return Math.round(wordCount / sentenceCount);
  }, [wordCount, sentenceCount]);

  const readingTime = useMemo(() => {
    // Average reading speed: 200-250 words per minute
    return Math.ceil(wordCount / 225);
  }, [wordCount]);

  // Apply suggestion to text
  const applySuggestion = useCallback((issue: StyleIssue): string => {
    if (!issue.suggestion || !issue.position) return text;

    const before = text.substring(0, issue.position.start);
    const after = text.substring(issue.position.end);
    
    return before + issue.suggestion + after;
  }, [text]);

  return {
    selectedWord,
    synonyms,
    isWordInThesaurus,
    searchSynonyms,
    clearSynonyms,
    styleIssues,
    isAnalyzing,
    reanalyze,
    wordCount,
    sentenceCount,
    averageSentenceLength,
    readingTime,
    applySuggestion,
  };
}
