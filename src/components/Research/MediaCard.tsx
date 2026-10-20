import { ResearchMedia, MEDIA_TYPE_LABELS, MEDIA_TYPE_ICONS, MEDIA_CATEGORY_LABELS } from '../../types/research';
import { getResearchStore } from '../../services/researchStore';
import { Edit3, Trash2, FolderPlus, Eye } from 'lucide-react';

interface MediaCardProps {
  media: ResearchMedia;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (media: ResearchMedia) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function MediaCard({
  media,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  compact = false,
}: MediaCardProps) {
  const store = getResearchStore();
  const state = store.getState();

  const folders = state.folders.filter((f) => f.mediaIds.includes(media.id));

  if (compact) {
    return (
      <div
        className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-white shadow-md ring-2 ring-indigo-300'
            : 'bg-white/80 hover:bg-white hover:shadow-sm'
        }`}
        onClick={() => onSelect(media.id)}
        data-testid="media-card-compact"
      >
        <span className="text-lg">{MEDIA_TYPE_ICONS[media.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-800 truncate">
            {media.title}
          </div>
          <div className="text-[10px] text-gray-400">
            {MEDIA_TYPE_LABELS[media.type]} · {formatFileSize(media.fileSize)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-xl border-2 p-3 transition-all cursor-pointer hover:shadow-lg ${
        isSelected
          ? 'border-indigo-400 shadow-md ring-2 ring-indigo-100'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(media.id)}
      data-testid="media-card"
    >
      {/* Preview area */}
      <div className="relative h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
        {media.type === 'image' && media.fileData ? (
          <img
            src={media.fileData}
            alt={media.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-4xl">{MEDIA_TYPE_ICONS[media.type]}</div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded">
          {MEDIA_TYPE_LABELS[media.type]}
        </div>

        {/* Size badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded">
          {formatFileSize(media.fileSize)}
        </div>
      </div>

      {/* Title and description */}
      <h3 className="font-semibold text-sm text-gray-900 leading-tight mb-1 truncate">
        {media.title}
      </h3>
      {media.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
          {media.description}
        </p>
      )}

      {/* Category and tags */}
      <div className="flex items-center gap-1 flex-wrap mb-2">
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600">
          {MEDIA_CATEGORY_LABELS[media.category]}
        </span>
        {media.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-2">
          {folders.slice(0, 2).map((f) => (
            <span
              key={f.id}
              className="px-1.5 py-0.5 rounded-full text-[10px] text-white"
              style={{ backgroundColor: f.color }}
            >
              {f.name}
            </span>
          ))}
          {folders.length > 2 && (
            <span className="text-[10px] text-gray-400">+{folders.length - 2}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="text-[10px] text-gray-400">
          {new Date(media.createdAt).toLocaleDateString()}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(media.id);
            }}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(media);
            }}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(media.id);
            }}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
