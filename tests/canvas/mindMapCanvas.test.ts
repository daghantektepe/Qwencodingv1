import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import canvasStore from '../../src/services/canvas/canvasStore';
import CanvasNode from '../../src/components/Canvas/CanvasNode';
import MindMapCanvas from '../../src/components/Canvas/MindMapCanvas';

describe('Phase 56: Interactive Mind Map & Concept Canvas Suite', () => {
  beforeEach(() => {
    canvasStore.clear();
  });

  describe('CanvasStore State Management', () => {
    it('creates, positions, and deletes nodes with cascading edge cleanup', () => {
      const n1 = canvasStore.addNode({
        type: 'character',
        title: 'Dedektif Demir',
        x: 100,
        y: 100,
      });

      const n2 = canvasStore.addNode({
        type: 'clue',
        title: 'Kayıp Madalyon',
        x: 300,
        y: 200,
      });

      expect(canvasStore.getState().nodes.length).toBe(2);

      // Add edge connecting n1 to n2
      const edge = canvasStore.addEdge({
        fromNodeId: n1.id,
        toNodeId: n2.id,
        label: 'Şüpheli',
      });
      expect(canvasStore.getState().edges.length).toBe(1);

      // Update position
      canvasStore.updateNodePosition(n1.id, 150, 180);
      const updatedN1 = canvasStore.getState().nodes.find((n) => n.id === n1.id);
      expect(updatedN1?.x).toBe(150);
      expect(updatedN1?.y).toBe(180);

      // Delete node n1 -> should also delete edge
      canvasStore.deleteNode(n1.id);
      expect(canvasStore.getState().nodes.length).toBe(1);
      expect(canvasStore.getState().edges.length).toBe(0);
    });

    it('manages grouping zones and bounds zoom levels', () => {
      const zone = canvasStore.addZone({
        title: '1. Perde Kurgu Bölgesi',
        color: 'rgba(59, 130, 246, 0.15)',
        x: 50,
        y: 50,
        width: 400,
        height: 300,
      });

      expect(canvasStore.getState().zones.length).toBe(1);
      expect(zone.title).toBe('1. Perde Kurgu Bölgesi');

      canvasStore.setZoom(0.05); // Below min
      expect(canvasStore.getState().zoom).toBe(0.2);

      canvasStore.setZoom(5.0); // Above max
      expect(canvasStore.getState().zoom).toBe(3.0);
    });

    it('exports canvas state to JSON and restores it completely', () => {
      canvasStore.addNode({ type: 'location', title: 'Terk Edilmiş Malikane', x: 200, y: 300 });
      canvasStore.addNode({ type: 'note', title: 'Fırtına Notu', x: 400, y: 150 });

      const json = canvasStore.exportCanvasJson();
      expect(json).toContain('Terk Edilmiş Malikane');
      expect(json).toContain('Fırtına Notu');

      canvasStore.clear();
      expect(canvasStore.getState().nodes.length).toBe(0);

      canvasStore.importCanvasJson(json);
      expect(canvasStore.getState().nodes.length).toBe(2);
      expect(canvasStore.getState().nodes[0].title).toBe('Terk Edilmiş Malikane');
    });
  });

  describe('CanvasNode UI Component', () => {
    it('renders node with type icon, title, and handles selection/deletion', () => {
      const onSelect = vi.fn();
      const onDelete = vi.fn();

      render(
        React.createElement(CanvasNode, {
          node: {
            id: 'node-test',
            type: 'character',
            title: 'Kont Monte Kristo',
            text: 'İntikam arayışında bir asilzade.',
            x: 50,
            y: 50,
          },
          isSelected: true,
          onSelect,
          onDelete,
        })
      );

      expect(screen.getByText('Kont Monte Kristo')).toBeDefined();
      expect(screen.getByText('İntikam arayışında bir asilzade.')).toBeDefined();

      const deleteBtn = screen.getByLabelText('Düğümü Sil');
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith('node-test');
    });
  });

  describe('MindMapCanvas UI Component', () => {
    it('renders canvas and adds a new card via toolbar', () => {
      render(React.createElement(MindMapCanvas, {}));

      const input = screen.getByPlaceholderText(/Kart Başlığı/i);
      const addBtn = screen.getByText(/\+ Tuvale Ekle/i);

      fireEvent.change(input, { target: { value: 'Yeni Şüpheli' } });
      fireEvent.click(addBtn);

      expect(canvasStore.getState().nodes.some((n) => n.title === 'Yeni Şüpheli')).toBe(true);
      expect(screen.getByText('Yeni Şüpheli')).toBeDefined();
    });
  });
});
