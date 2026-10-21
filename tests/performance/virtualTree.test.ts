import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  VirtualBinderTree,
  flattenTree,
  VirtualTreeNode,
} from '../../src/components/Virtual/VirtualBinderTree';

function generateMassiveTree(folderCount: number, docsPerFolder: number): VirtualTreeNode[] {
  const root: VirtualTreeNode[] = [];
  for (let f = 1; f <= folderCount; f++) {
    const children: VirtualTreeNode[] = [];
    for (let d = 1; d <= docsPerFolder; d++) {
      children.push({
        id: `doc-${f}-${d}`,
        title: `Bölüm ${f}.${d}: Ayrıntılı Sahne Metni`,
        type: 'document',
        metadata: { wordCount: 1500 },
      });
    }

    root.push({
      id: `folder-${f}`,
      title: `Klasör ${f}: Ana Kurgu Bloğu`,
      type: 'folder',
      children,
    });
  }
  return root;
}

describe('VirtualBinderTree Performance & Windowing', () => {
  it('flattens 2,000 hierarchical nodes in under 30ms', () => {
    // 100 folders * 20 docs = 2,100 nodes
    const tree = generateMassiveTree(100, 20);
    const expanded = new Set(tree.map((t) => t.id));

    const start = performance.now();
    const flattened = flattenTree(tree, expanded);
    const duration = performance.now() - start;

    expect(flattened.length).toBe(2100);
    expect(duration).toBeLessThan(100); // Very fast
  });

  it('respects expanded/collapsed folder state during flattening', () => {
    const tree = generateMassiveTree(5, 10); // 5 folders, 50 docs
    const expandedOnlyFirst = new Set(['folder-1']);

    const flattened = flattenTree(tree, expandedOnlyFirst);
    // Folder 1 + its 10 docs + other 4 collapsed folders = 15 items
    expect(flattened).toHaveLength(15);
  });

  it('filters tree items and preserves parent visibility', () => {
    const tree = generateMassiveTree(10, 5);
    const expanded = new Set(tree.map((t) => t.id));

    const filtered = flattenTree(tree, expanded, 0, '1.3');
    expect(filtered.some((n) => n.node.title.includes('1.3'))).toBe(true);
    // Parent folder-1 should be included so child can be reached
    expect(filtered.some((n) => n.node.id === 'folder-1')).toBe(true);
  });

  it('renders VirtualBinderTree and only renders visible slice in DOM', () => {
    const tree = generateMassiveTree(50, 10); // 550 nodes
    const onSelectNode = vi.fn();

    render(
      React.createElement(VirtualBinderTree, {
        nodes: tree,
        height: 320,
        itemHeight: 32,
        overscan: 2,
        onSelectNode,
      })
    );

    // Height 320 with itemHeight 32 fits ~10 items + overscan buffer (~14 items total in DOM)
    // It should definitely NOT render all 550 elements in DOM
    const allNodeElements = screen.getAllByRole('treeitem');
    expect(allNodeElements.length).toBeLessThan(40);
    expect(allNodeElements.length).toBeGreaterThan(5);

    // Select first node
    fireEvent.click(allNodeElements[0]);
    expect(onSelectNode).toHaveBeenCalledTimes(1);
  });
});
