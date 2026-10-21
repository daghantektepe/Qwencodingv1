import React from 'react';

export interface LinkHoverCardProps {
  targetTitle: string;
  excerpt?: string;
  wordCount?: number;
  visible: boolean;
  position?: { x: number; y: number };
}

export const LinkHoverCard: React.FC<LinkHoverCardProps> = ({
  targetTitle,
  excerpt = 'Doküman önizlemesi yükleniyor...',
  wordCount,
  visible,
  position = { x: 0, y: 0 },
}) => {
  if (!visible) return null;

  return (
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        top: position.y + 16,
        left: position.x,
        zIndex: 99999,
        width: '280px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: '8px',
        padding: '12px 14px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        border: '1px solid #3b82f6',
        fontSize: '0.85rem',
        pointerEvents: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <strong style={{ color: '#60a5fa', fontSize: '0.9rem' }}>📄 {targetTitle}</strong>
        {typeof wordCount === 'number' && (
          <span style={{ fontSize: '0.72rem', backgroundColor: '#1e293b', padding: '1px 6px', borderRadius: '4px', color: '#94a3b8' }}>
            {wordCount} kelime
          </span>
        )}
      </div>
      <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.4, maxHeight: '60px', overflow: 'hidden' }}>
        {excerpt}
      </p>
      <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#64748b', textAlign: 'right' }}>
        Açmak için tıkla ↗
      </div>
    </div>
  );
};

export default LinkHoverCard;
