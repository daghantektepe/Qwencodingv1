import { useState, useEffect } from 'react';
import { AnalyticsState } from '../../types/analytics';
import { getAnalyticsStore } from '../../services/analyticsStore';
import WritingHeatmap from './WritingHeatmap';
import WpmChart from './WpmChart';
import WordFrequency from './WordFrequency';
import ReadabilityScore from './ReadabilityScore';
import { BarChart3, Calendar, Clock, TrendingUp, FileText } from 'lucide-react';

export default function AnalyticsDashboard() {
  const store = getAnalyticsStore();
  const [state, setState] = useState<AnalyticsState>(store.getState());
  const [activeTab, setActiveTab] = useState<'overview' | 'readability' | 'words'>('overview');

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [store]);

  const heatmapData = store.getHeatmapData();
  const stats = store.getTotalStats();
  const sessions = store.getSessionsInRange();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Writing Analytics</h1>
              <p className="text-xs text-gray-500">Track your writing productivity and quality</p>
            </div>
          </div>

          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              role="textbox"
              value={state.startDate}
              onChange={(e) => store.dispatch({
                type: 'SET_DATE_RANGE',
                payload: { startDate: e.target.value, endDate: state.endDate }
              })}
              className="px-2 py-1 text-sm border border-gray-200 rounded"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              role="textbox"
              value={state.endDate}
              onChange={(e) => store.dispatch({
                type: 'SET_DATE_RANGE',
                payload: { startDate: state.startDate, endDate: e.target.value }
              })}
              className="px-2 py-1 text-sm border border-gray-200 rounded"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('readability')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'readability'
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Readability
          </button>
          <button
            onClick={() => setActiveTab('words')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'words'
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Word Analysis
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs text-gray-500">Total Words</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.totalWords.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-500">Writing Time</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.totalMinutes} <span className="text-sm font-normal text-gray-500">min</span>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-500">Avg WPM</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.avgWpm}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-gray-500">Sessions</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.totalSessions}
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <WritingHeatmap cells={heatmapData} />

            {/* WPM Chart */}
            <WpmChart sessions={sessions} />
          </div>
        )}

        {activeTab === 'readability' && (
          <div className="max-w-2xl mx-auto">
            <ReadabilityScore text={state.currentDocumentText} />
          </div>
        )}

        {activeTab === 'words' && (
          <div className="max-w-2xl mx-auto">
            <WordFrequency text={state.currentDocumentText} />
          </div>
        )}
      </div>
    </div>
  );
}
