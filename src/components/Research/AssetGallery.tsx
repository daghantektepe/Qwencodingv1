import { useState } from 'react';
import { ResearchMedia, MEDIA_TYPE_LABELS, MEDIA_TYPE_ICONS, MEDIA_CATEGORY_LABELS } from '../../types/research';
import { getResearchStore } from '../../services/researchStore';
import { Grid3X3, List, X, Eye, Edit3, Trash2 } from 'lucide-react';

interface AssetGalleryProps {
  media: ResearchMedia[];
  selectedMediaId: string | null;
  onSelect: (id: string) => void;
  onEdit: (media: ResearchMedia) => void;
  onDelete: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function AssetGallery({
  media,
  selectedMediaId,
  onSelect,
  onEdit,
  onDelete,
  viewMode = 'grid',
}: AssetGalleryProps) {
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'list'>(viewMode);

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📁</div>
        <p className="text-gray-500 text-sm">No media items to display</p>
      </div>
    );
  }

  if (localViewMode === 'list') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">{media.length} items</div>
          <button
            onClick={() => setLocalViewMode('grid')}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Grid view"
          >
            <Grid3X3 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {media.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
              selectedMediaId === item.id
                ? 'bg-indigo-50 border-2 border-indigo-400'
                : 'bg-white border border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelect(item.id)}
            data-testid="asset-gallery-item"
          >
            <span className="text-2xl">{MEDIA_TYPE_ICONS[item.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {item.title}
              </div>
              <div className="text-xs text-gray-500">
                {MEDIA_TYPE_LABELS[item.type]} · {formatFileSize(item.fileSize)}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">{media.length} items</div>
        <button
          onClick={() => setLocalViewMode('list')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="List view"
        >
          <List className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {media.map((item) => (
          <div
            key={item.id}
            className={`group relative rounded-xl border-2 p-3 cursor-pointer transition-all hover:shadow-lg ${
              selectedMediaId === item.id
                ? 'border-indigo-400 shadow-md ring-2 ring-indigo-100'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelect(item.id)}
            data-testid="asset-gallery-item"
          >
            {/* Preview */}
            <div className="relative h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
              {item.type === 'image' && item.fileData ? (
                <img
                  src={item.fileData}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-3xl">{MEDIA_TYPE_ICONS[item.type]}</div>
              )}
            </div>

            {/* Title */}
            <h4 className="text-xs font-medium text-gray-800 truncate mb-1">
              {item.title}
            </h4>

            {/* Meta */}
            <div className="text-[10px] text-gray-500">
              {MEDIA_TYPE_LABELS[item.type]} · {formatFileSize(item.fileSize)}
            </div>

            {/* Actions overlay */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-1 bg-white/90 rounded hover:bg-white text-gray-600"
                title="Edit"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1 bg-white/90 rounded hover:bg-red-50 text-red-500"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
