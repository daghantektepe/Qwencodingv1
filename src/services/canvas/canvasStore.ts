/**
 * canvasStore.ts — Faz 56: Zihin Haritası ve Sonsuz Tuval Durum Yöneticisi
 */

import { CanvasNode, CanvasEdge, CanvasZone, CanvasState, CanvasNodeType } from '../../types/canvas';

export class CanvasStore {
  private state: CanvasState = {
    nodes: [],
    edges: [],
    zones: [],
    pan: { x: 0, y: 0 },
    zoom: 1,
    selectedNodeId: null,
  };

  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getState(): CanvasState {
    return this.state;
  }

  public addNode(nodeData: Omit<CanvasNode, 'id'>): CanvasNode {
    const id = `cnode-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newNode: CanvasNode = {
      ...nodeData,
      id,
      width: nodeData.width || 180,
      height: nodeData.height || 100,
      color: nodeData.color || '#3b82f6',
    };
    this.state.nodes.push(newNode);
    this.notify();
    return newNode;
  }

  public updateNodePosition(id: string, x: number, y: number): void {
    const node = this.state.nodes.find((n) => n.id === id);
    if (node) {
      node.x = x;
      node.y = y;
      this.notify();
    }
  }

  public updateNode(id: string, updates: Partial<CanvasNode>): void {
    const node = this.state.nodes.find((n) => n.id === id);
    if (node) {
      Object.assign(node, updates);
      this.notify();
    }
  }

  public deleteNode(id: string): void {
    this.state.nodes = this.state.nodes.filter((n) => n.id !== id);
    // Düğüme bağlı tüm çizgileri (kenarları) da temizle
    this.state.edges = this.state.edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id);
    if (this.state.selectedNodeId === id) {
      this.state.selectedNodeId = null;
    }
    this.notify();
  }

  public addEdge(edgeData: Omit<CanvasEdge, 'id'>): CanvasEdge {
    const id = `cedge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEdge: CanvasEdge = {
      ...edgeData,
      id,
      isDirected: edgeData.isDirected !== undefined ? edgeData.isDirected : true,
      style: edgeData.style || 'solid',
      color: edgeData.color || '#94a3b8',
    };
    this.state.edges.push(newEdge);
    this.notify();
    return newEdge;
  }

  public deleteEdge(id: string): void {
    this.state.edges = this.state.edges.filter((e) => e.id !== id);
    this.notify();
  }

  public addZone(zoneData: Omit<CanvasZone, 'id'>): CanvasZone {
    const id = `czone-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newZone: CanvasZone = {
      ...zoneData,
      id,
    };
    this.state.zones.push(newZone);
    this.notify();
    return newZone;
  }

  public deleteZone(id: string): void {
    this.state.zones = this.state.zones.filter((z) => z.id !== id);
    this.notify();
  }

  public setPan(pan: { x: number; y: number }): void {
    this.state.pan = pan;
    this.notify();
  }

  public setZoom(zoom: number): void {
    // Zoom seviyesini 0.2 ile 3.0 arasında sınırla
    const clamped = Math.max(0.2, Math.min(3.0, zoom));
    this.state.zoom = Math.round(clamped * 100) / 100;
    this.notify();
  }

  public selectNode(id: string | null): void {
    this.state.selectedNodeId = id;
    this.notify();
  }

  public exportCanvasJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importCanvasJson(json: string): void {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        this.state = {
          nodes: parsed.nodes,
          edges: parsed.edges,
          zones: parsed.zones || [],
          pan: parsed.pan || { x: 0, y: 0 },
          zoom: parsed.zoom || 1,
          selectedNodeId: null,
        };
        this.notify();
      }
    } catch (e: any) {
      throw new Error(`Geçersiz tuval JSON verisi: ${e?.message}`);
    }
  }

  public clear(): void {
    this.state = {
      nodes: [],
      edges: [],
      zones: [],
      pan: { x: 0, y: 0 },
      zoom: 1,
      selectedNodeId: null,
    };
    this.notify();
  }
}

export const canvasStore = new CanvasStore();
export default canvasStore;
