/**
 * canvas.ts — Faz 56: Zihin Haritası ve Konsept Tuvali Tip Tanımları
 */

export type CanvasNodeType = 'document' | 'character' | 'location' | 'clue' | 'note';

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  title: string;
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  sourceRefId?: string;
}

export interface CanvasEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  isDirected?: boolean;
  style?: 'solid' | 'dashed';
  color?: string;
}

export interface CanvasZone {
  id: string;
  title: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  zones: CanvasZone[];
  pan: { x: number; y: number };
  zoom: number;
  selectedNodeId: string | null;
}
