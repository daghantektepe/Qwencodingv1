import React from 'react';
import { CanvasEdge as ICanvasEdge, CanvasNode as ICanvasNode } from '../../types/canvas';

interface CanvasEdgeProps {
  edge: ICanvasEdge;
  fromNode?: ICanvasNode;
  toNode?: ICanvasNode;
  onSelect?: (edgeId: string) => void;
  onDelete?: (edgeId: string) => void;
}

export const CanvasEdge: React.FC<CanvasEdgeProps> = ({
  edge,
  fromNode,
  toNode,
  onSelect,
  onDelete
}) => {
  if (!fromNode || !toNode) return null;

  const x1 = fromNode.x + (fromNode.width || 160) / 2;
  const y1 = fromNode.y + (fromNode.height || 100) / 2;
  const x2 = toNode.x + (toNode.width || 160) / 2;
  const y2 = toNode.y + (toNode.height || 100) / 2;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const strokeColor = edge.color || '#64748b';
  const strokeDash = edge.style === 'dashed' ? '5,5' : undefined;

  return (
    <g
      className="canvas-edge-group"
      onClick={() => onSelect?.(edge.id)}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        <marker
          id={`arrow-${edge.id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
        </marker>
      </defs>

      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={2}
        strokeDasharray={strokeDash}
        markerEnd={edge.isDirected ? `url(#arrow-${edge.id})` : undefined}
      />

      {edge.label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-edge.label.length * 4 - 8}
            y={-10}
            width={edge.label.length * 8 + 16}
            height={20}
            rx={4}
            fill="#1e293b"
            stroke={strokeColor}
            strokeWidth={1}
          />
          <text
            x={0}
            y={3}
            fill="#f8fafc"
            fontSize={11}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
};
