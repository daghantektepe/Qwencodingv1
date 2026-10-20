import { useMemo, useState } from 'react';
import { WordFrequency as WordFrequencyType } from '../../types/analytics';
import { calculateWordFrequency, getOverusedWords } from '../../utils/textAnalysis';

interface WordFrequencyProps {
  text: string;
}

export default function WordFrequency({ text }: WordFrequencyProps) {
  const [showStopWords, setShowStopWords] = useState(false);
  const [overusedThreshold, setOverusedThreshold] = useState(3);

  const frequencies = useMemo(() => {
    return calculateWordFrequency(text, showStopWords);
  }, [text, showStopWords]);

  const overusedWords = useMemo(() => {
    return getOverusedWords(text, overusedThreshold);
  }, [text, overusedThreshold]);

  const topWords = frequencies.slice(0, 15);
  const maxCount = topWords.length > 0 ? topWords[0].count : 1;

  if (!text || text.trim().length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Word Frequency</h3>
        <div className="text-center py-8 text-gray-400 text-sm">
          No text to analyze
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Word Frequency</h3>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={showStopWords}
            onChange={(e) => setShowStopWords(e.target.checked)}
            className="rounded"
          />
          Include common words
        </label>
      </div>

      {/* Top words bar chart */}
      <div className="space-y-1.5 mb-4">
        {topWords.map((item, index) => (
          <div key={item.word} className="flex items-center gap-2">
            <div className="w-20 text-xs text-gray-600 truncate text-right">
              {item.word}
            </div>
            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
            <div className="w-12 text-xs text-gray-500 text-right">
              {item.count} ({item.percentage.toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Overused words warning */}
      {overusedWords.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-amber-600 flex items-center gap-1">
              ⚠️ Overused Words ({overusedWords.length})
            </h4>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500">Threshold:</span>
              <input
                type="range"
                min={1}
                max={10}
                value={overusedThreshold}
                onChange={(e) => setOverusedThreshold(Number(e.target.value))}
                className="w-16 h-1"
              />
              <span className="text-[10px] text-gray-500">{overusedThreshold}%</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {overusedWords.map((item) => (
              <span
                key={item.word}
                className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200"
              >
                {item.word} ({item.percentage.toFixed(1)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <span>{frequencies.length} unique words</span>
        <span className="mx-2">·</span>
        <span>{text.split(/\s+/).filter(w => w).length} total words</span>
      </div>
    </div>
  );
}
