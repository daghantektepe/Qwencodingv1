import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';

export interface VirtualTreeNode {
  id: string;
  title: string;
  type: 'folder' | 'document';
  children?: VirtualTreeNode[];
  metadata?: {
    wordCount?: number;
    status?: string;
  };
}

export interface FlattenedVirtualNode {
  node: VirtualTreeNode;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export interface VirtualBinderTreeProps {
  nodes: VirtualTreeNode[];
  selectedId?: string;
  onSelectNode: (node: VirtualTreeNode) => void;
  height?: number;
  itemHeight?: number;
  overscan?: number;
  searchFilter?: string;
}

/**
 * Derin ağaç yapısını görünürlük durumuna göre tek boyutlu diziye düzleştirir.
 */
export function flattenTree(
  nodes: VirtualTreeNode[],
  expandedIds: Set<string>,
  depth = 0,
  filterQuery = ''
): FlattenedVirtualNode[] {
  const result: FlattenedVirtualNode[] = [];
  const q = filterQuery.toLowerCase().trim();

  for (const node of nodes) {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = expandedIds.has(node.id);

    const matchesQuery = !q || node.title.toLowerCase().includes(q);

    // Eğer filtre varsa alt öğelerin eşleşip eşleşmediğini kontrol et
    let matchingChildren: FlattenedVirtualNode[] = [];
    if (hasChildren && node.children) {
      matchingChildren = flattenTree(node.children, expandedIds, depth + 1, filterQuery);
    }

    if (matchesQuery || matchingChildren.length > 0) {
      result.push({
        node,
        depth,
        hasChildren,
        isExpanded,
      });

      if ((isExpanded || q) && hasChildren) {
        result.push(...matchingChildren);
      }
    }
  }

  return result;
}

export const VirtualBinderTree: React.FC<VirtualBinderTreeProps> = ({
  nodes,
  selectedId,
  onSelectNode,
  height = 500,
  itemHeight = 32,
  overscan = 5,
  searchFilter = '',
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Başlangıçta üst düzey klasörleri genişlet
  useEffect(() => {
    const initial = new Set<string>();
    nodes.forEach((n) => {
      if (n.type === 'folder') initial.add(n.id);
    });
    setExpandedIds(initial);
  }, [nodes]);

  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Ağacı düzleştir
  const flattenedList = useMemo(() => {
    return flattenTree(nodes, expandedIds, 0, searchFilter);
  }, [nodes, expandedIds, searchFilter]);

  // Sanallaştırma hesaplamaları (Windowing)
  const totalCount = flattenedList.length;
  const totalHeight = totalCount * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalCount - 1,
    Math.floor((scrollTop + height) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    const items: Array<{ item: FlattenedVirtualNode; index: number; top: number }> = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (flattenedList[i]) {
        items.push({
          item: flattenedList[i],
          index: i,
          top: i * itemHeight,
        });
      }
    }
    return items;
  }, [flattenedList, startIndex, endIndex, itemHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height, overflowY: 'auto', position: 'relative' }}
      className="virtual-binder-tree w-full select-none bg-neutral-50 dark:bg-neutral-850 font-sans text-xs"
      data-testid="virtual-binder-tree"
      role="tree"
    >
      {/* Toplam yüksekliği tutan sanal boşluk */}
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        {visibleItems.map(({ item, top }) => {
          const isSelected = selectedId === item.node.id;

          return (
            <div
              key={item.node.id}
              onClick={() => onSelectNode(item.node)}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: itemHeight,
                paddingLeft: `${item.depth * 16 + 8}px`,
              }}
              className={`flex items-center gap-1.5 pr-3 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 font-semibold'
                  : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-200'
              }`}
              data-testid={`tree-node-${item.node.id}`}
              role="treeitem"
              aria-selected={isSelected}
            >
              {/* Klasör Genişlet / Daralt Oku */}
              {item.hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(item.node.id, e)}
                  className="w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  aria-label={item.isExpanded ? 'Daralt' : 'Genişlet'}
                >
                  <span
                    style={{
                      transform: item.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                      display: 'inline-block',
                      fontSize: '10px',
                    }}
                  >
                    ▶
                  </span>
                </button>
              ) : (
                <span className="w-4 shrink-0" />
              )}

              {/* İkon */}
              <span className="shrink-0 text-sm">
                {item.node.type === 'folder' ? '📁' : '📄'}
              </span>

              {/* Başlık */}
              <span className="truncate flex-1">{item.node.title}</span>

              {/* Kelime Sayacı (Varsa) */}
              {item.node.metadata?.wordCount !== undefined && (
                <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                  {item.node.metadata.wordCount}k
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualBinderTree;
