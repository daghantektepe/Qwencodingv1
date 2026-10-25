import React, { useState, useCallback, useMemo } from 'react';
import './Outliner.css';

/**
 * Outliner — Faz 20: Modern veri tablosu tasarımıyla taslak görünümü.
 *
 * Özellikler:
 *  - Zebra satırlar, temiz etiket rozetleri, sütun hizalamaları.
 *  - Sütuna göre sıralama (title / status / wordCount / lastModified).
 *  - Satır seçimi (aktif doküman vurgusu) ve çift tıkla açma.
 *  - Derinlik girintisi hiyerarşiyi korur (ağaç düzleştirilmiş liste olarak gelir).
 *
 * props:
 *   rows: Row[] — { id, title, depth, type, status?, wordCount?, synopsis?, lastModified? }
 *   selectedId?: string | null
 *   onOpenRow?: (row) => void
 *   onUpdateRow?: (id, patch) => void — inline başlık/synopsis düzenleme için
 */

const STATUS_LABELS = {
  idea: 'Fikir',
  outline: 'Taslak',
  draft: 'Taslak Metin',
  revision: 'Revizyon',
  done: 'Tamam',
  stub: 'Eksik',
  none: '—',
};

function countWords(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter((tok) => /[\p{L}\p{N}]/u.test(tok)).length;
}

function fmtDate(v) {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function flattenTree(nodes, depth = 0) {
  const result = [];
  for (const node of nodes || []) {
    result.push({
      ...node,
      depth,
      wordCount: countWords(node.content),
      status: node.status || node.metadata?.status || 'none',
      synopsis: node.synopsis || node.metadata?.synopsis || '',
      lastModified: node.lastModified || node.metadata?.lastModified || null,
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

/**
 * @param {object} props
 * @param {any[]} [props.tree]
 * @param {any[]} [props.rows]
 * @param {string|null} [props.selectedId]
 * @param {((node: any) => void)} [props.onSelectNode]
 * @param {((row: any) => void)} [props.onOpenRow]
 * @param {((id: string, patch: any) => void)} [props.onUpdateRow]
 */
export default function Outliner({
  tree = null,
  rows = null,
  selectedId = null,
  onSelectNode = undefined,
  onOpenRow = undefined,
  onUpdateRow = undefined,
}) {
  const [sortKey, setSortKey] = useState('title');
  const [sortDir, setSortDir] = useState('asc');
  const [editingId, setEditingId] = useState(null);
  const [editField, setEditField] = useState('title');
  const [editValue, setEditValue] = useState('');

  const actualRows = useMemo(() => {
    if (Array.isArray(rows)) return rows;
    if (Array.isArray(tree)) return flattenTree(tree);
    return [];
  }, [rows, tree]);

  const handleOpenRow = useCallback(
    (row) => {
      if (typeof onSelectNode === 'function') onSelectNode(row);
      else if (typeof onOpenRow === 'function') onOpenRow(row);
    },
    [onOpenRow, onSelectNode]
  );

  const startEdit = useCallback((row, field) => {
    if (typeof onUpdateRow !== 'function') return;
    setEditingId(row.id);
    setEditField(field);
    setEditValue(String(row[field] ?? ''));
  }, [onUpdateRow]);

  const commitEdit = useCallback(() => {
    if (editingId && typeof onUpdateRow === 'function') {
      onUpdateRow(editingId, { [editField]: editValue.trim() });
    }
    setEditingId(null);
    setEditValue('');
  }, [editField, editValue, editingId, onUpdateRow]);

  const sortedRows = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const val = (r) => {
      switch (sortKey) {
        case 'status':
          return STATUS_LABELS[r.status] || r.status || '';
        case 'wordCount':
          return r.wordCount ?? countWords(r.content);
        case 'lastModified':
          return r.lastModified ? new Date(r.lastModified).getTime() : 0;
        case 'title':
        default:
          return (r.title || '').toLocaleLowerCase('tr-TR');
      }
    };
    return [...actualRows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [actualRows, sortDir, sortKey]);

  const toggleSort = useCallback((key) => {
    setSortKey((prevKey) => {
      setSortDir((prevDir) => (prevKey === key ? (prevDir === 'asc' ? 'desc' : 'asc') : 'asc'));
      return key;
    });
  }, []);

  const sortIndicator = (key) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  if (actualRows.length === 0) {
    return (
      <section className="outliner" aria-label="Ana hat">
        <div className="outliner__empty">
          <p>Görüntülenecek satır yok. Proje ağacından bir klasör seçin.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="outliner" aria-label="Ana hat tablosu">
      <div className="outliner__scroll">
        <table className="outliner__table">
          <thead>
            <tr>
              <th
                className="col-title"
                scope="col"
                aria-sort={sortKey === 'title' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" className="outliner__sort" onClick={() => toggleSort('title')}>
                  Başlık{sortIndicator('title')}
                </button>
              </th>
              <th
                className="col-status"
                scope="col"
                aria-sort={sortKey === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" className="outliner__sort" onClick={() => toggleSort('status')}>
                  Durum{sortIndicator('status')}
                </button>
              </th>
              <th
                className="col-synopsis"
                scope="col"
                aria-sort={sortKey === 'synopsis' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" className="outliner__sort" onClick={() => toggleSort('synopsis')}>
                  Konu{sortIndicator('synopsis')}
                </button>
              </th>
              <th
                className="col-words"
                scope="col"
                aria-sort={sortKey === 'wordCount' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" className="outliner__sort" onClick={() => toggleSort('wordCount')}>
                  Kelime{sortIndicator('wordCount')}
                </button>
              </th>
              <th
                className="col-modified"
                scope="col"
                aria-sort={sortKey === 'lastModified' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button type="button" className="outliner__sort" onClick={() => toggleSort('lastModified')}>
                  Son Değişiklik{sortIndicator('lastModified')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, idx) => {
              const st = row.status || 'none';
              const isSelected = selectedId === row.id;
              const words = row.wordCount ?? countWords(row.content);
              const isEditingThis = editingId === row.id;

              return (
                <tr
                  key={row.id}
                  className={[
                    'outliner-row',
                    idx % 2 === 1 ? 'is-zebra' : '',
                    isSelected ? 'is-selected' : '',
                    row.type === 'folder' ? 'is-folder' : '',
                  ].join(' ')}
                  onClick={() => !isEditingThis && handleOpenRow(row)}
                  onDoubleClick={() => !isEditingThis && handleOpenRow(row)}
                >
                  <td className="col-title">
                    <span
                      className="outliner__indent"
                      style={{ width: `${(row.depth ?? 0) * 18}px` }}
                      aria-hidden="true"
                    />
                    {row.type === 'folder' && <span className="outliner__glyph">🗀</span>}
                    {isEditingThis && editField === 'title' ? (
                      <input
                        className="outliner__cell-input"
                        value={editValue}
                        autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditValue('');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="outliner__cell-text"
                        title="Çift tıkla düzenle"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEdit(row, 'title');
                        }}
                      >
                        {row.title}
                      </span>
                    )}
                  </td>

                  <td className="col-status">
                    <span className={`ol-chip ol-chip--${st}`}>{STATUS_LABELS[st] || st}</span>
                  </td>

                  <td className="col-synopsis">
                    {isEditingThis && editField === 'synopsis' ? (
                      <input
                        className="outliner__cell-input"
                        value={editValue}
                        autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditValue('');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className={`outliner__synopsis${!row.synopsis ? ' is-empty' : ''}`}
                        title={row.synopsis || 'Çift tıkla konu ekle'}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEdit(row, 'synopsis');
                        }}
                      >
                        {row.synopsis || '—'}
                      </span>
                    )}
                  </td>

                  <td className="col-words">{words.toLocaleString('tr-TR')}</td>
                  <td className="col-modified">{fmtDate(row.lastModified)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
