import React from 'react';
import { taxonomyStore, TaxonomyTag, TaxonomyCategory } from '../../services/taxonomy/taxonomyStore';

interface TaxonomyFilterBarProps {
  category?: TaxonomyCategory;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onClearFilters: () => void;
}

export const TaxonomyFilterBar: React.FC<TaxonomyFilterBarProps> = ({
  category,
  selectedTagIds,
  onToggleTag,
  onClearFilters
}) => {
  const tags = taxonomyStore.getTags(category);

  return (
    <div
      className="taxonomy-filter-bar flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs overflow-x-auto select-none"
      role="toolbar"
      aria-label="Taksonomi Filtre Çubuğu"
    >
      <span className="text-[11px] text-slate-500 font-mono shrink-0">Filtre:</span>

      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggleTag(tag.id)}
            className={`px-2 py-0.5 rounded-full flex items-center gap-1.5 transition-all text-[11px] shrink-0 border ${
              isSelected
                ? 'bg-slate-800 text-white font-medium border-cyan-400 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span>{tag.name}</span>
          </button>
        );
      })}

      {selectedTagIds.length > 0 && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-[10px] text-rose-400 hover:text-rose-300 ml-1 shrink-0 font-medium"
        >
          Temizle ({selectedTagIds.length})
        </button>
      )}
    </div>
  );
};

export default TaxonomyFilterBar;
