import React, { useState, useEffect } from 'react';
import canvasStore from '../../services/canvas/canvasStore';
import CanvasNode from './CanvasNode';
import { CanvasNodeType, CanvasNode as NodeDef } from '../../types/canvas';

export interface MindMapCanvasProps {
  onNodeClick?: (node: NodeDef) => void;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ onNodeClick }) => {
  const [state, setState] = useState(() => canvasStore.getState());
  const [newNodeType, setNewNodeType] = useState<CanvasNodeType>('character');
  const [newNodeTitle, setNewNodeTitle] = useState('');

  useEffect(() => {
    const unsubscribe = canvasStore.subscribe(() => {
      setState({ ...canvasStore.getState() });
    });
    return () => unsubscribe();
  }, []);

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) return;

    canvasStore.addNode({
      type: newNodeType,
      title: newNodeTitle,
      x: 100 + state.nodes.length * 30,
      y: 100 + state.nodes.length * 20,
    });

    setNewNodeTitle('');
  };

  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '600px',
        backgroundColor: '#090d16',
        borderRadius: '10px',
        border: '1px solid #334155',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Üst Kontrol ve Düğüm Ekleme Araç Çubuğu */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          zIndex: 20,
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '8px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #475569',
        }}
      >
        <form onSubmit={handleAddNode} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={newNodeType}
            onChange={(e) => setNewNodeType(e.target.value as CanvasNodeType)}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#fff',
              border: '1px solid #475569',
              fontSize: '0.85rem',
            }}
          >
            <option value="character">👤 Karakter</option>
            <option value="document">📄 Sahne / Belge</option>
            <option value="location">🗺️ Mekan</option>
            <option value="clue">🔍 İpucu</option>
            <option value="note">📝 Fikir Notu</option>
          </select>

          <input
            type="text"
            placeholder="Kart Başlığı..."
            value={newNodeTitle}
            onChange={(e) => setNewNodeTitle(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#fff',
              border: '1px solid #475569',
              fontSize: '0.85rem',
              width: '180px',
            }}
          />

          <button
            type="submit"
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            + Tuvale Ekle
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {state.nodes.length} Kart | {state.edges.length} Bağlantı
          </span>

          <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
            <button
              onClick={() => canvasStore.setZoom(state.zoom - 0.1)}
              style={{ padding: '4px 8px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              -
            </button>
            <span style={{ padding: '4px 6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
              {Math.round(state.zoom * 100)}%
            </span>
            <button
              onClick={() => canvasStore.setZoom(state.zoom + 0.1)}
              style={{ padding: '4px 8px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Sonsuz Tuval (Pan & Zoom Viewport) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`,
          transformOrigin: '0 0',
          position: 'relative',
        }}
      >
        {/* Bölge Grupları (Zones) */}
        {state.zones.map((zone) => (
          <div
            key={zone.id}
            style={{
              position: 'absolute',
              left: zone.x,
              top: zone.y,
              width: zone.width,
              height: zone.height,
              backgroundColor: zone.color,
              borderRadius: '12px',
              border: '2px dashed rgba(255,255,255,0.2)',
              pointerEvents: 'none',
              padding: '10px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', opacity: 0.8 }}>
              {zone.title}
            </span>
          </div>
        ))}

        {/* Bağlantı Çizgileri SVG Katmanı */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4000px',
            height: '4000px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {state.edges.map((edge) => {
            const from = nodeMap.get(edge.fromNodeId);
            const to = nodeMap.get(edge.toNodeId);
            if (!from || !to) return null;

            const fromX = from.x + (from.width || 180) / 2;
            const fromY = from.y + (from.height || 100) / 2;
            const toX = to.x + (to.width || 180) / 2;
            const toY = to.y + (to.height || 100) / 2;
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;

            return (
              <g key={edge.id}>
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke={edge.color || '#64748b'}
                  strokeWidth="2"
                  strokeDasharray={edge.style === 'dashed' ? '5,5' : undefined}
                />
                {edge.label && (
                  <text
                    x={midX}
                    y={midY - 4}
                    fill="#93c5fd"
                    fontSize="11"
                    textAnchor="middle"
                    style={{ backgroundColor: '#0f172a', padding: '2px' }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Düğümler (Nodes) */}
        {state.nodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            isSelected={state.selectedNodeId === node.id}
            onSelect={(id) => {
              canvasStore.selectNode(id);
              if (onNodeClick) onNodeClick(node);
            }}
            onDelete={(id) => canvasStore.deleteNode(id)}
          />
        ))}
      </div>
    </div>
  );
};

export default MindMapCanvas;
