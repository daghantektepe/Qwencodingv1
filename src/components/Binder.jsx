import React, { useState, useCallback, useMemo } from 'react';
import './Binder.css';

/**
 * Agac boyunca dolasarak given id'ye sahip dugumu bulur.
 */
function findNodeById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.type === 'folder' && Array.isArray(n.children)) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Bir dokumunun tum atalarinin (folder) id listesini dondurur.
 */
function getAncestorIds(nodes, targetId, trail = []) {
  for (const n of nodes) {
    if (n.id === targetId) return trail;
    if (n.type === 'folder' && Array.isArray(n.children)) {
      const res = getAncestorIds(n.children, targetId, [...trail, n.id]);
      if (res) return res;
    }
  }
  return null;
}

/**
 * Tek bir agac dugumunu (klasor veya dokuman) ve alt ogelerini render eder.
 */
function BinderNode({ node, depth, selectedId, expandedIds, onToggleFolder, onSelectDoc }) {
  const isFolder = node.type === 'folder';
  const isSelected = selectedId === node.id;
  const isExpanded = isFolder && expandedIds.has(node.id);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (isFolder) {
        onToggleFolder(node.id);
      } else {
        onSelectDoc(node);
      }
    },
    [isFolder, node, onToggleFolder, onSelectDoc]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <li className="binder-node" role="treeitem" aria-selected={isSelected} aria-expanded={isFolder ? isExpanded : undefined}>
      <div
        className={[
          'binder-row',
          isFolder ? 'binder-row--folder' : 'binder-row--doc',
          isSelected ? 'binder-row--selected' : '',
        ].join(' ')}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        title={node.title}
      >
        <span className="binder-icon" aria-hidden="true">
          {isFolder ? (isExpanded ? '📂' : '📁') : '📄'}
        </span>
        {isFolder && (
          <span className={`binder-caret${isExpanded ? ' binder-caret--open' : ''}`} aria-hidden="true">
            ▸
          </span>
        )}
        <span className="binder-title">{node.title}</span>
      </div>

      {isFolder && isExpanded && Array.isArray(node.children) && node.children.length > 0 && (
        <ul className="binder-children" role="group">
          {node.children.map((child) => (
            <BinderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleFolder={onToggleFolder}
              onSelectDoc={onSelectDoc}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Binder — Scrivener tarzi hiyerarsik dokuman agaci.
 * props:
 *   tree: Dugum dizisi [{ id, type:'folder'|'doc', title, children?, content? }]
 *   selectedId: Secili dokumanin id'si (kontrol edilen prop)
 *   onSelectDoc: (docNode) => void — dokuman secilince cagrilir; App bunu editore yazar
 */
export default function Binder({ tree = [], selectedId = null, onSelectDoc }) {
  // Acik klasorler: ilk yuklemede tum klasorler + secili dokunun atalari
  const initialExpanded = useMemo(() => {
    const ids = new Set();
    function addFolders(nodes) {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (n.type === 'folder') {
          ids.add(n.id);
          if (Array.isArray(n.children)) addFolders(n.children);
        }
      }
    }
    addFolders(tree);
    if (selectedId) {
      const anc = getAncestorIds(tree, selectedId);
      if (anc) anc.forEach((id) => ids.add(id));
    }
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [expandedIds, setExpandedIds] = useState(initialExpanded);

  const handleToggleFolder = useCallback((folderId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const handleSelectDoc = useCallback(
    (docNode) => {
      // Guvenlik: yalnizca doc tipli dugumler editore gonderilir
      if (!docNode || docNode.type === 'folder') return;
      // Secilen dokunun atalarini otomatik genisle (gorunurlugu garanti et)
      const anc = getAncestorIds(tree, docNode.id);
      if (anc && anc.length) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          anc.forEach((id) => next.add(id));
          return next;
        });
      }
      if (typeof onSelectDoc === 'function') onSelectDoc(docNode);
    },
    [onSelectDoc, tree]
  );

  return (
    <aside className="binder" aria-label="Binder - proje agaci">
      <header className="binder-header">
        <h2 className="binder-header__title">Binder</h2>
      </header>
      <ul className="binder-tree" role="tree">
        {tree.map((node) => (
          <BinderNode
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onToggleFolder={handleToggleFolder}
            onSelectDoc={handleSelectDoc}
          />
        ))}
        {tree.length === 0 && <li className="binder-empty">Bos proje — yeni dokuman olusturun.</li>}
      </ul>
    </aside>
  );
}
