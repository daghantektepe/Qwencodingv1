import React from 'react';
import { Character, ROLE_COLORS, ROLE_LABELS, Relationship } from '../../types/codex';
import { Trash2, Edit2 } from 'lucide-react';

interface Props {
  character: Character;
  relationships?: Relationship[];
  isSelected?: boolean;
  onSelect?: ((id: string) => void) | (() => void);
  onEdit?: (character: Character) => void;
  onDelete?: ((id: string) => void) | (() => void);
}

const CharacterCard: React.FC<Props> = ({
  character,
  relationships,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const roleColor = (ROLE_COLORS && character?.role && ROLE_COLORS[character.role]) || '#6B7280';
  const roleLabel = (ROLE_LABELS && character?.role && ROLE_LABELS[character.role]) || character?.role || 'Unknown';
  const tags: string[] = character?.tags || (character as any)?.traits || [];
  const relCount = relationships
    ? relationships.length
    : ((character as any)?.relationships?.length || 0);

  const handleCardClick = () => {
    if (onSelect) {
      (onSelect as any)(character.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      (onDelete as any)(character.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(character);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group ${
        isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : 'bg-white'
      }`}
      onClick={handleCardClick}
      style={{ borderLeftColor: roleColor, borderLeftWidth: '4px' }}
      data-testid={`character-card-${character.id}`}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-gray-900">{character.name}</h3>
        <span
          className="text-xs uppercase tracking-wide font-medium px-1.5 py-0.5 rounded"
          style={{ color: roleColor, backgroundColor: `${roleColor}15` }}
        >
          {roleLabel}
        </span>
      </div>

      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
        {character.description || 'No description provided.'}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-400">+{tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        Relationships: {relCount}
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        {onEdit && (
          <button
            onClick={handleEditClick}
            title="Edit character"
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={handleDeleteClick}
          title="Delete character"
          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default CharacterCard;
