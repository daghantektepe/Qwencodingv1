import React, { useState, useCallback, useMemo } from 'react';
import './Outliner.css';

/**
 * Outliner — Faz 8: dokümanları tablo (outline) görünümünde listeler.
 * Sütunlar: Başlık, Sinopsis, Kelime Sayısı, Durum, Etiketler.
 * Kullanıcı sütun görünürlüğünü "Sütunlar" menüsünden ayarlayabilir.
 *
 * props:
 *   tree: Node[] — proje ağacı ({ id, type:'folder'|'doc', title, content?, metadata? })
 *   selectedId?: string | null — aktif dokümanın id'si
 *   onSelectNode?: (node) => void — satıra tıklayınca editörde açmak için
 */

const COLUMNS = [
  { id: 'title', label: 'Başlık', alwaysVisible: true },
  { id: 'synopsis', label: 'Sinopsis' },
  { id: 'wordCount', label: 'Kelime Sayısı' },
  { id: 'status', label: 'Durum' },
  { id: 'labels', label: 'Etiketler' },
];

const LABEL_COLORS = {
  Kirmizi: '#e05c5c',
  Yesil: '#4caf72',
  Mavi: '#4a90d9',
  Sari: '#e6c34a',
  Turuncu: '#e88b3f',
  Mor: '#9b59b6',
};

function countWords(text) {
  const t = String(text || '').trim();
  return t.length === 0 ? 0 : t.split(/\s+/).length;
}

/**
 * Ağacı düzleştirir; klasörler hiyerarşik bağlam bilgisiyle birlikte
 * tablo satırı olur (klasör satırları grup başlığı gibi davranır).
 */
function flattenRows(nodes, depth = 0, out = []) {
  for (const n of nodes || []) {
    out.push({ node: n, depth });
    if (n.type === 'folder' && Array.isArray(n.children)) {
      flattenRows(n.children, depth + 1, out);
    }
  }
  return out;
}

export default function Outliner({ tree = [], selectedId = null, onSelectNode }) {
  // Sutun gorunurlugu state'i — localStorage ile kalici (tamamen yerel)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = window.localStorage.getItem('openscriv:outliner-columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      /* yok say */
    }
    return new Set(['title', 'synopsis', 'wordCount', 'status', 'labels']);
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const rows = useMemo(() => flattenRows(tree), [tree]);

  const toggleColumn = useCallback(
    (colId) => {
      setVisibleColumns((prev) => {
        const next = new Set(prev);
        if (next.has(colId)) {
          // En az Başlık sütunu görünür kalmalı
          if (colId === 'title') return prev;
          next.delete(colId);
        } else {
          next.add(colId);
        }
        try {
          window.localStorage.setItem('openscriv:outliner-columns', JSON.stringify([...next]));
        } catch {
          /* localStorage yoksa sessizce gec */
        }
        return next;
      });
    },
    []
  );

  const handleRowClick = useCallback(
    (node) => {
      if (node.type === 'doc' && typeof onSelectNode === 'function') {
        onSelectNode(node);
      }
    },
    [onSelectNode]
  );

  const show = (colId) => visibleColumns.has(colId);

  return (
    <section className="outliner" aria-label="Outliner - tablo görünümü">
      <header className="outliner-toolbar">
        <h2 className="outliner-toolbar__title">Outliner</h2>
        <span className="outliner-toolbar__count">{rows.length} öğe</span>
        <div className="outliner-columns-wrap">
          <button
            type="button"
            className="outliner-columns-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            Sütunlar ▾
          </button>
          {menuOpen && (
            <ul className="outliner-columns-menu" role="menu">
              {COLUMNS.map((col) => (
                <li key={col.id} role="none">
                  <label className="outliner-columns-menu__item">
                    <input
                      type="checkbox"
                      role="menuitemcheckbox"
                      checked={show(col.id)}
                      disabled={col.alwaysVisible}
                      onChange={() => toggleColumn(col.id)}
                    />
                    {col.label}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="outliner-empty">
          <p>Tabloda gösterilecek öğe yok. Binder'dan doküman ekleyin.</p>
        </div>
      ) : (
        <div className="outliner-table-wrap">
          <table className="outliner-table">
            <thead>
              <tr>
                {show('title') && <th className="outliner-th outliner-th--title">Başlık</th>}
                {show('synopsis') && <th className="outliner-th">Sinopsis</th>}
                {show('wordCount') && <th className="outliner-th outliner-th--num">Kelime</th>}
                {show('status') && <th className="outliner-th">Durum</th>}
                {show('labels') && <th className="outliner-th">Etiketler</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ node, depth }) => {
                const meta = node.metadata || {};
                const isDoc = node.type === 'doc';
                const isSelected = selectedId === node.id;
                const labels = Array.isArray(meta.labels) ? meta.labels : [];
                return (
                  <tr
                    key={node.id}
                    className={[
                      'outliner-row',
                      isDoc ? 'outliner-row--doc' : 'outliner-row--folder',
                      isSelected ? 'outliner-row--selected' : '',
                    ].join(' ')}
                    onClick={() => handleRowClick(node)}
                    onKeyDown={(e) => {
                      if (isDoc && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleRowClick(node);
                      }
                    }}
                    tabIndex={isDoc ? 0 : -1}
                    aria-selected={isSelected}
                  >
                    {show('title') && (
                      <td className="outliner-td outliner-td--title">
                        <span
                          className="outliner-indent"
                          style={{ width: `${depth * 16}px` }}
                          aria-hidden="true"
                        />
                        <span className="outliner-row-icon" aria-hidden="true">
                          {isDoc ? '📄' : '📁'}
                        </span>
                        <span className="outliner-row-title">{node.title}</span>
                      </td>
                    )}
                    {show('synopsis') && (
                      <td className="outliner-td outliner-td--synopsis" title={meta.synopsis || ''}>
                        {meta.synopsis || <span className="outliner-muted">—</span>}
                      </td>
                    )}
                    {show('wordCount') && (
                      <td className="outliner-td outliner-td--num">
                        {isDoc ? countWords(node.content) : <span className="outliner-muted">—</span>}
                      </td>
                    )}
                    {show('status') && (
                      <td className="outliner-td">
                        {meta.status ? (
                          <span className="outliner-status-badge">{meta.status}</span>
                        ) : (
                          <span className="outliner-muted">—</span>
                        )}
                      </td>
                    )}
                    {show('labels') && (
                      <td className="outliner-td">
                        {labels.length > 0 ? (
                          <span className="outliner-labels">
                            {labels.map((l) => (
                              <span
                                key={l}
                                className="outliner-label-dot"
                                style={{ backgroundColor: LABEL_COLORS[l] || '#999' }}
                                title={l}
                              />
                            ))}
                          </span>
                        ) : (
                          <span className="outliner-muted">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
