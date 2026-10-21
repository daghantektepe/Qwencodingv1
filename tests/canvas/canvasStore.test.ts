import { describe, it, expect, beforeEach } from 'vitest';
import { canvasStore } from '../../src/services/canvas/canvasStore';

describe('Phase 56: canvasStore unit tests', () => {
  beforeEach(() => {
    canvasStore.clear();
  });

  it('initializes with empty nodes and edges', () => {
    const state = canvasStore.getState();
    expect(state.nodes).toHaveLength(0);
    expect(state.edges).toHaveLength(0);
    expect(state.zoom).toBe(1);
  });

  it('adds and removes nodes', () => {
    const node = canvasStore.addNode({
      type: 'character',
      title: 'Sherlock Holmes',
      x: 100,
      y: 150
    });

    expect(node.id).toBeDefined();
    expect(canvasStore.getState().nodes).toHaveLength(1);
    expect(canvasStore.getState().nodes[0].title).toBe('Sherlock Holmes');

    canvasStore.deleteNode(node.id);
    expect(canvasStore.getState().nodes).toHaveLength(0);
  });

  it('adds and removes edges between nodes', () => {
    const nodeA = canvasStore.addNode({ type: 'character', title: 'A', x: 0, y: 0 });
    const nodeB = canvasStore.addNode({ type: 'character', title: 'B', x: 200, y: 200 });

    const edge = canvasStore.addEdge({
      fromNodeId: nodeA.id,
      toNodeId: nodeB.id,
      label: 'Düşman',
      isDirected: true
    });

    expect(edge.id).toBeDefined();
    expect(canvasStore.getState().edges).toHaveLength(1);
    expect(canvasStore.getState().edges[0].label).toBe('Düşman');

    canvasStore.deleteEdge(edge.id);
    expect(canvasStore.getState().edges).toHaveLength(0);
  });

  it('cascades edge deletion when node is removed', () => {
    const nodeA = canvasStore.addNode({ type: 'character', title: 'A', x: 0, y: 0 });
    const nodeB = canvasStore.addNode({ type: 'character', title: 'B', x: 200, y: 200 });

    canvasStore.addEdge({
      fromNodeId: nodeA.id,
      toNodeId: nodeB.id,
      label: 'Partner'
    });

    expect(canvasStore.getState().edges).toHaveLength(1);
    canvasStore.deleteNode(nodeA.id);
    // When node A is removed, edge connecting to it should also be cleaned up
    expect(canvasStore.getState().edges).toHaveLength(0);
  });

  it('updates pan and zoom smoothly', () => {
    canvasStore.setPan({ x: 50, y: -30 });
    canvasStore.setZoom(1.5);

    expect(canvasStore.getState().pan).toEqual({ x: 50, y: -30 });
    expect(canvasStore.getState().zoom).toBe(1.5);
  });

  it('exports and imports canvas state as JSON', () => {
    canvasStore.addNode({ type: 'document', title: 'Scene 1', x: 50, y: 50 });
    canvasStore.setZoom(1.2);

    const json = canvasStore.exportCanvasJson();
    expect(json).toContain('Scene 1');

    canvasStore.clear();
    expect(canvasStore.getState().nodes).toHaveLength(0);

    canvasStore.importCanvasJson(json);
    expect(canvasStore.getState().nodes).toHaveLength(1);
    expect(canvasStore.getState().nodes[0].title).toBe('Scene 1');
  });
});
