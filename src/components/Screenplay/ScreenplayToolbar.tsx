import React from 'react';
import { Save, Download, Eye, Edit3, Columns, FileText } from 'lucide-react';

interface ScreenplayToolbarProps {
  viewMode: 'edit' | 'preview' | 'split';
  onViewModeChange: (mode: 'edit' | 'preview' | 'split') => void;
  onSave: () => void;
  onExport: (format: 'fountain' | 'html' | 'pdf') => void;
  isModified: boolean;
  wordCount: number;
  elementCount: number;
}

export default function ScreenplayToolbar({
  viewMode,
  onViewModeChange,
  onSave,
  onExport,
  isModified,
  wordCount,
  elementCount,
}: ScreenplayToolbarProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left section - Title */}
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Screenplay Editor</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Fountain
          </span>
        </div>

        {/* Middle section - View mode toggle */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('edit')}
            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
              viewMode === 'edit'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            title="Edit mode"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onViewModeChange('preview')}
            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
              viewMode === 'preview'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            title="Preview mode"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => onViewModeChange('split')}
            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            title="Split view"
          >
            <Columns className="w-4 h-4" />
            Split
          </button>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={!isModified}
            className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 ${
              isModified
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Save screenplay"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          <div className="relative group">
            <button
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
              title="Export screenplay"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
              <button
                onClick={() => onExport('fountain')}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
              >
                Fountain (.fountain)
              </button>
              <button
                onClick={() => onExport('html')}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
              >
                HTML (.html)
              </button>
              <button
                onClick={() => onExport('pdf')}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
              >
                PDF (.pdf)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span>~{Math.ceil(wordCount / 250)} pages</span>
      </div>
    </div>
  );
}
