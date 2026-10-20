import React, { useRef, useEffect } from 'react';
import { getCodexStore } from '../../services/codexStore';
import { Character, Relationship, ROLE_COLORS } from '../../types/codex';

interface RelationshipGraphProps {
  characters?: Character[];
  relationships?: Relationship[];
  selectedCharacterId?: string | null;
  onSelectCharacter?: (id: string) => void;
  width?: number;
  height?: number;
}

const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  characters: propCharacters,
  relationships: propRelationships,
  selectedCharacterId,
  onSelectCharacter,
  width = 560,
  height = 380,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = getCodexStore();
  const characters = propCharacters || store.getState().characters;
  const relationships = propRelationships || store.getState().relationships;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Simulation nodes
    const nodes = characters.map((c, i) => {
      const angle = (i / (characters.length || 1)) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.35;
      return {
        id: c.id,
        name: c.name,
        role: c.role,
        color: (ROLE_COLORS && ROLE_COLORS[c.role]) || c.color || '#3B82F6',
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        isSelected: c.id === selectedCharacterId,
      };
    });

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    relationships.forEach((rel) => {
      const source = nodes.find((n) => n.id === rel.sourceId);
      const target = nodes.find((n) => n.id === rel.targetId);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = Math.max(1, (rel.strength || 5) / 2);
        ctx.stroke();

        if (rel.description || rel.type) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          ctx.fillStyle = '#64748B';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(rel.description || rel.type, midX, midY - 4);
        }
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.isSelected ? 20 : 16, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (node.isSelected) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#4F46E5';
        ctx.stroke();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name.slice(0, 2).toUpperCase(), node.x, node.y);

      // Label below node
      ctx.fillStyle = '#1E293B';
      ctx.font = '12px sans-serif';
      ctx.fillText(node.name, node.x, node.y + 28);
    });
  }, [characters, relationships, selectedCharacterId, width, height]);

  return (
    <div className="relative w-full border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col items-center">
      <div className="w-full flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className="font-medium text-gray-700">
          {characters.length} characters · {relationships.length} relationships
        </span>
        <span>Relationship Network</span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded bg-white shadow-sm max-w-full"
        onClick={(e) => {
          if (!onSelectCharacter) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;

          const clickedNode = characters.find((_, i) => {
            const angle = (i / (characters.length || 1)) * 2 * Math.PI;
            const radius = Math.min(width, height) * 0.35;
            const nx = width / 2 + Math.cos(angle) * radius;
            const ny = height / 2 + Math.sin(angle) * radius;
            const dist = Math.sqrt((clickX - nx) ** 2 + (clickY - ny) ** 2);
            return dist <= 20;
          });

          if (clickedNode) {
            onSelectCharacter(clickedNode.id);
          }
        }}
      />
    </div>
  );
};

export default RelationshipGraph;
