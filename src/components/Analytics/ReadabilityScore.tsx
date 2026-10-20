import { useMemo } from 'react';
import { calculateReadabilityMetrics, getReadabilityLevel } from '../../utils/readability';

interface ReadabilityScoreProps {
  text: string;
}

export default function ReadabilityScore({ text }: ReadabilityScoreProps) {
  const metrics = useMemo(() => {
    return calculateReadabilityMetrics(text);
  }, [text]);

  const level = useMemo(() => {
    return getReadabilityLevel(metrics.fleschKincaid);
  }, [metrics.fleschKincaid]);

  if (!text || text.trim().length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Readability Analysis</h3>
        <div className="text-center py-8 text-gray-400 text-sm">
          No text to analyze
        </div>
      </div>
    );
  }

  // Score color based on Flesch-Kincaid
  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 70) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Readability Analysis</h3>

      {/* Main score */}
      <div className={`rounded-lg border p-4 mb-4 ${getScoreBg(metrics.fleschKincaid)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-600 mb-1">Flesch Reading Ease</div>
            <div className={`text-3xl font-bold ${getScoreColor(metrics.fleschKincaid)}`}>
              {metrics.fleschKincaid}
            </div>
            <div className="text-xs text-gray-600 mt-1">{level}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-1">Grade Level</div>
            <div className="text-2xl font-bold text-gray-800">
              {metrics.fleschKincaidGrade}
            </div>
            <div className="text-xs text-gray-600">US Grade</div>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Gunning Fog Index</div>
          <div className="text-xl font-bold text-gray-800">{metrics.gunningFog}</div>
          <div className="text-[10px] text-gray-400">years of education</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Complex Words</div>
          <div className="text-xl font-bold text-gray-800">
            {metrics.complexWordPercentage}%
          </div>
          <div className="text-[10px] text-gray-400">3+ syllables</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Avg Sentence Length</div>
          <div className="text-xl font-bold text-gray-800">
            {metrics.avgSentenceLength}
          </div>
          <div className="text-[10px] text-gray-400">words/sentence</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Avg Word Length</div>
          <div className="text-xl font-bold text-gray-800">
            {metrics.avgWordLength}
          </div>
          <div className="text-[10px] text-gray-400">characters/word</div>
        </div>
      </div>

      {/* Detailed stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-gray-800">{metrics.totalWords}</div>
            <div className="text-[10px] text-gray-500">Words</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800">{metrics.totalSentences}</div>
            <div className="text-[10px] text-gray-500">Sentences</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800">{metrics.totalSyllables}</div>
            <div className="text-[10px] text-gray-500">Syllables</div>
          </div>
        </div>
      </div>

      {/* Interpretation guide */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-[10px] text-gray-500 space-y-1">
          <div><strong>Flesch Score:</strong> Higher = easier to read (90-100: very easy, 0-30: very difficult)</div>
          <div><strong>Gunning Fog:</strong> Years of formal education needed to understand</div>
        </div>
      </div>
    </div>
  );
}
