import React from 'react';
import { CanvasNode as CanvasNodeTypeDef, CanvasNodeType } from '../../types/canvas';

export interface CanvasNodeProps {
  node: CanvasNodeTypeDef;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TYPE_ICONS: Record<CanvasNodeType, string> = {
  character: '👤',
  document: '📄',
  location: '🗺️',
  clue: '🔍',
  note: '📝',
};

const TYPE_LABELS: Record<CanvasNodeType, string> = {
  character: 'Karakter',
  document: 'Sahne',
  location: 'Mekan',
  clue: 'İpucu',
  note: 'Not',
};

export const CanvasNode: React.FC<CanvasNodeProps> = ({
  node,
  isSelected = false,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${node.title} (${TYPE_LABELS[node.type]})`}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect(node.id);
      }}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: node.width || 180,
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '8px',
        border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(56, 189, 248, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.4)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        borderTop: `4px solid ${node.color || '#3b82f6'}`,
        padding: '10px 12px',
        cursor: 'grab',
        userSelect: 'none',
        fontSize: '0.85rem',
        zIndex: isSelected ? 10 : 2,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span
          style={{
            fontSize: '0.72rem',
            backgroundColor: '#0f172a',
            padding: '2px 6px',
            borderRadius: '4px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{TYPE_ICONS[node.type]}</span>
          <span>{TYPE_LABELS[node.type]}</span>
        </span>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            aria-label="Düğümü Sil"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0 2px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '4px', wordBreak: 'break-word' }}>
        {node.title}
      </div>

      {node.text && (
        <div
          style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            lineHeight: 1.35,
            maxHeight: '48px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {node.text}
        </div>
      )}
    </div>
  );
};

export default CanvasNode;
