import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';

export interface StyleIssue {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  suggestion?: string;
  position?: {
    start: number;
    end: number;
  };
  word?: string;
}

interface StyleCheckerPanelProps {
  text: string;
  onIssueClick?: (issue: StyleIssue) => void;
  onApplySuggestion?: (issue: StyleIssue) => void;
}

// Common style rules
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
  longSentences: {
    check: (text: string) => {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return sentences.filter(s => s.trim().split(/\s+/).length > 30);
    },
    message: 'Uzun cümle (30+ kelime)',
    type: 'warning' as const,
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

export const StyleCheckerPanel: React.FC<StyleCheckerPanelProps> = ({
  text,
  onIssueClick,
  onApplySuggestion,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const issues = useMemo(() => {
    if (!text || text.trim().length === 0) {
      return [];
    }

    setIsChecking(true);
    const detectedIssues: StyleIssue[] = [];

    // Check repeated words
    const repeatedMatches = text.matchAll(STYLE_RULES.repeatedWords.pattern);
    for (const match of repeatedMatches) {
      detectedIssues.push({
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
      detectedIssues.push({
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

    // Check long sentences
    const longSentences = STYLE_RULES.longSentences.check(text);
    longSentences.forEach((sentence, index) => {
      const position = text.indexOf(sentence);
      detectedIssues.push({
        id: `long-sentence-${index}`,
        type: 'warning',
        message: `${STYLE_RULES.longSentences.message}: ${sentence.trim().substring(0, 50)}...`,
        position: {
          start: position,
          end: position + sentence.length,
        },
        suggestion: 'Cümleyi daha kısa tutmayı düşünün',
      });
    });

    // Check filler words
    const fillerMatches = text.matchAll(STYLE_RULES.fillerWords.pattern);
    for (const match of fillerMatches) {
      detectedIssues.push({
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
      detectedIssues.push({
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

    setIsChecking(false);
    return detectedIssues;
  }, [text]);

  const filteredIssues = useMemo(() => {
    if (filter === 'all') return issues;
    return issues.filter(issue => issue.type === filter);
  }, [issues, filter]);

  const issueCounts = useMemo(() => {
    return {
      error: issues.filter(i => i.type === 'error').length,
      warning: issues.filter(i => i.type === 'warning').length,
      info: issues.filter(i => i.type === 'info').length,
    };
  }, [issues]);

  const getIssueIcon = (type: StyleIssue['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Stil Kontrolü</h3>
          {isChecking && (
            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {issues.length} sorun bulundu
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Tümü ({issues.length})
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            filter === 'error'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Hata ({issueCounts.error})
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            filter === 'warning'
              ? 'text-yellow-600 border-b-2 border-yellow-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Uyarı ({issueCounts.warning})
        </button>
        <button
          onClick={() => setFilter('info')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            filter === 'info'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Bilgi ({issueCounts.info})
        </button>
      </div>

      {/* Issues List */}
      <div className="overflow-y-auto max-h-96">
        {filteredIssues.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onIssueClick?.(issue)}
              >
                <div className="flex items-start gap-2">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{issue.message}</p>
                    {issue.suggestion && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Öneri:</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplySuggestion?.(issue);
                          }}
                          className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                        >
                          {issue.suggestion}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-sm text-gray-600">
              {issues.length === 0
                ? 'Harika! Stil sorunu bulunamadı.'
                : 'Filtreye uygun sorun yok.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {issues.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {issueCounts.error} hata, {issueCounts.warning} uyarı, {issueCounts.info} bilgi
            </span>
            <button
              onClick={() => setFilter('all')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Tümünü Gör
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
