import React, { useState, useCallback, useMemo } from 'react';
import './Binder.css';

/**
 * Binder — OpenScriv'un proje ağacı paneli (Faz 3 + Faz 17 tasarım sistemi).
 *
 * Klasör/doküman hiyerarşisini gösterir; seçim yapınca editörde açılır.
 * Tamamen yerel state; veri props ile gelir, değişiklikler callback'lerle
 * üst bileşene (App) bildirilir.
 *
 * props:
 *   tree: Node[] — { id, type:'folder'|'doc', title, content?, metadata?, children? }
 *   selectedId?: string | null — aktif düğümün id'si
 *   onSelectNode?: (node) => void — doküman seçilince çağrılır
 *   onRenameNode?: (id, newTitle) => void
 *   onDeleteNode?: (id) => void
 *   onAddDoc?: (parentId, title) => void
 *   onMoveNode?: (dragId, targetId, position:'before'|'after'|'inside') => void
 */

function findPath(nodes, id, trail = []) {
  for (const n of nodes || []) {
    if (n.id === id) return [...trail, n];
    if (n.type === 'folder' && Array.isArray(n.children)) {
      const found = findPath(n.children, id, [...trail, n]);
      if (found) return found;
    }
  }
  return null;
}

function countWords(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter((tok) => /[\p{L}\p{N}]/u.test(tok)).length;
}

/**
 * @param {Object} props
 * @param {Array<any>} [props.tree]
 * @param {string|null} [props.selectedId]
 * @param {((doc: any) => void)|null} [props.onSelectDoc]
 * @param {((node: any) => void)|null} [props.onSelectNode]
 * @param {((id: string, newTitle: string) => void)|null} [props.onRenameNode]
 * @param {((id: string) => void)|null} [props.onDeleteNode]
 * @param {((parentId: string, title: string) => void)|null} [props.onAddDoc]
 * @param {((dragId: string, targetId: string, position: string) => void)|null} [props.onMoveNode]
 */
export default function Binder({
  tree = [],
  selectedId = null,
  onSelectDoc = null,
  onSelectNode = null,
  onRenameNode = null,
  onDeleteNode = null,
  onAddDoc = null,
  onMoveNode = null,
}) {
  const selectHandler = onSelectDoc || onSelectNode;

  // Acik klasorler: ilk yuklemede tum klasorler acik baslar
  const initialExpanded = useMemo(() => {
    const ids = new Set(['root']);
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
    return ids;
  }, [tree]);

  const [expanded, setExpanded] = useState(initialExpanded);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [dragOverId, setDragOverId] = useState(null);
  const [query, setQuery] = useState('');

  // Arama filtresi: eşleşen dokumanın atalarıyla birlikte görünür kısmı
  const filteredTree = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tree;

    const filterNodes = (nodes) => {
      const out = [];
      for (const n of nodes || []) {
        const selfMatch = (n.title || '').toLowerCase().includes(q);
        if (n.type === 'folder') {
          const kids = filterNodes(n.children || []);
          if (selfMatch || kids.length > 0) {
            out.push({ ...n, children: kids });
          }
        } else if (selfMatch) {
          out.push(n);
        }
      }
      return out;
    };
    return filterNodes(tree);
  }, [tree, query]);

  const toggleFolder = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startRename = useCallback((node) => {
    setEditingId(node.id);
    setEditValue(node.title);
  }, []);

  const commitRename = useCallback(
    (id) => {
      const trimmed = editValue.trim();
      if (trimmed && typeof onRenameNode === 'function') {
        onRenameNode(id, trimmed);
      }
      setEditingId(null);
      setEditValue('');
    },
    [editValue, onRenameNode]
  );

  const handleSelect = useCallback(
    (node) => {
      if (node.type === 'folder') {
        toggleFolder(node.id);
      } else if (typeof selectHandler === 'function') {
        selectHandler(node);
      }
    },
    [selectHandler, toggleFolder]
  );

  // --- Sürekli sürükle-bırak (drag & drop) ---
  const handleDragStart = useCallback((e, node) => {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, node) => {
    e.preventDefault();
    setDragOverId(node.id);
  }, []);

  const handleDrop = useCallback(
    (e, targetNode) => {
      e.preventDefault();
      setDragOverId(null);
      const dragId = e.dataTransfer.getData('text/plain');
      if (!dragId || dragId === targetNode.id) return;
      if (typeof onMoveNode !== 'function') return;

      const path = findPath(tree, dragId);
      if (!path) return;
      const dragged = path[path.length - 1];

      let position = 'after';
      if (targetNode.type === 'folder') {
        position = 'inside';
      } else {
        // Y dikey konumuna gore before/after karari
        const rect = e.currentTarget.getBoundingClientRect();
        position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      }
      onMoveNode(dragged.id, targetNode.id, position);
    },
    [onMoveNode, tree]
  );

  // --- Düğüm render ---
  const renderNode = (node, depth) => {
    const isFolder = node.type === 'folder';
    const isOpen = expanded.has(node.id) || Boolean(query.trim());
    const isSelected = selectedId === node.id;
    const isEditing = editingId === node.id;
    const words = isFolder ? null : countWords(node.content);

    return (
      <li
        key={node.id}
        className={[
          'binder-node',
          isFolder ? 'binder-node--folder' : 'binder-node--doc',
          isSelected ? 'is-selected' : '',
          dragOverId === node.id ? 'is-dragover' : '',
        ].join(' ')}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isFolder ? isOpen : undefined}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, node)}
        onDragOver={(e) => handleDragOver(e, node)}
        onDragLeave={() => setDragOverId((v) => (v === node.id ? null : v))}
        onDrop={(e) => handleDrop(e, node)}
      >
        <div
          className={[
            'binder-row',
            isFolder ? 'binder-row--folder' : 'binder-row--doc',
            isSelected ? 'binder-row--selected is-selected' : '',
          ].join(' ')}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => !isEditing && handleSelect(node)}
          onKeyDown={(e) => {
            if (isEditing) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelect(node);
            }
            if (e.key === 'F2') {
              e.preventDefault();
              startRename(node);
            }
          }}
          tabIndex={0}
        >
          {isFolder ? (
            <span className={`binder-caret${isOpen ? ' binder-caret--open' : ''}`} aria-hidden="true">
              ▸
            </span>
          ) : (
            <span className="binder-caret binder-caret--placeholder" aria-hidden="true" />
          )}

          <span className="binder-icon" aria-hidden="true">
            {isFolder ? (isOpen ? '📂' : '📁') : '📄'}
          </span>

          {isEditing ? (
            <input
              className="binder-rename-input"
              value={editValue}
              autoFocus
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitRename(node.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename(node.id);
                if (e.key === 'Escape') {
                  setEditingId(null);
                  setEditValue('');
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="binder-title">{node.title}</span>
          )}

          {!isFolder && words != null && (
            <span className="binder-meta">{words.toLocaleString('tr-TR')}</span>
          )}

          {!isEditing && (
            <span className="binder-actions">
              <button
                type="button"
                className="binder-action-btn"
                title="Yeniden adlandır (F2)"
                aria-label={`${node.title} yeniden adlandır`}
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(node);
                }}
              >
                ✏️
              </button>
              {isFolder && typeof onAddDoc === 'function' && (
                <button
                  type="button"
                className="binder-action-btn"
                title="Yeni doküman"
                aria-label={`${node.title} içine yeni doküman`}
                onClick={(e) => {
                  e.stopPropagation();
                  const title = window.prompt('Yeni doküman adı:', 'Yeni Doküman');
                  if (title) onAddDoc(node.id, title.trim());
                }}
                >
                  ＋
                </button>
              )}
              {typeof onDeleteNode === 'function' && (
                <button
                  type="button"
                  className="binder-action-btn binder-action-btn--danger"
                  title="Sil"
                  aria-label={`${node.title} sil`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`"${node.title}" silinsin mi?`)) onDeleteNode(node.id);
                  }}
                >
                  🗑
                </button>
              )}
            </span>
          )}
        </div>

        {isFolder && isOpen && Array.isArray(node.children) && node.children.length > 0 && (
          <ul className="binder-children" role="group">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <section className="binder" aria-label="Proje ağacı">
      <header className="binder-header">
        <h2 className="binder-header__title">Proje Ağacı</h2>
        <div className="binder-search-wrap">
          <input
            type="search"
            className="binder-search"
            placeholder="Başlıkta ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Proje ağacında başlık ara"
          />
        </div>
      </header>

      {filteredTree.length === 0 ? (
        <div className="binder-empty">
          <p>{query ? 'Eşleşen öğe yok.' : 'Boş proje — yeni doküman oluşturun.'}</p>
        </div>
      ) : (
        <ul className="binder-tree" role="tree" aria-label="Proje ağacı">
          {filteredTree.map((node) => renderNode(node, 0))}
        </ul>
      )}
    </section>
  );
}
