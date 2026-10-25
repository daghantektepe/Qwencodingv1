import React, { useState, useCallback, useMemo } from 'react';
import './Corkboard.css';

/**
 * Corkboard — Faz 20: Mantar Pano görünümü (Scrivener kalitesinde index kartları).
 *
 * Özellikler:
 *  - Mantar doku hissi veren pano zemini (saf CSS gradient; görsel dosya yok).
 *  - Index kartlarında zarif "raptiye" (CSS ile çizilmiş, SVG/emoji bağımlılıksız).
 *  - Durum renk şeridi (meta.status → kırmızı/turuncu/yeşil/mavi/gri şerit).
 *  - Pürüzsüz hover gölgesi + hafif kalkma animasyonu.
 *  - Kart üstünde synopsis alanı: çift tıkla veya ✎ ile satır içi düzenleme.
 *  - Klavye: Enter kartı açar, F2 synopsis'i düzenlemeye alır.
 *
 * props:
 *   nodes: Doc[] — { id, title, content?, synopsis?, status?, metadata? }
 *   onOpenNode?: (node) => void — kart başlığına çift tıklayınca editörde aç
 *   onUpdateSynopsis?: (docId, synopsis) => void
 *   statuses?: Record<string,string> — durum anahtar → etiket eşlemesi
 */

const DEFAULT_STATUSES = {
  idea: 'Fikir',
  outline: 'Taslak',
  draft: 'Taslak Metin',
  revision: 'Revizyon',
  done: 'Tamam',
  stub: 'Eksik',
};

function normalizeStatus(node) {
  const raw = node?.status || node?.metadata?.status || 'none';
  return String(raw).toLowerCase();
}

/**
 * @param {object} props
 * @param {any} [props.folder]
 * @param {any[]} [props.nodes]
 * @param {((node: any) => void)} [props.onSelectNode]
 * @param {((node: any) => void)} [props.onOpenNode]
 * @param {((docId: string, synopsis: string) => void)} [props.onUpdateSynopsis]
 * @param {Record<string, string>} [props.statuses]
 */
export default function Corkboard({
  folder = null,
  nodes = null,
  onSelectNode = undefined,
  onOpenNode = undefined,
  onUpdateSynopsis = undefined,
  statuses = DEFAULT_STATUSES,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [hoverId, setHoverId] = useState(null);

  const rawNodes = useMemo(() => {
    if (Array.isArray(nodes)) return nodes;
    if (folder && Array.isArray(folder.children)) return folder.children;
    return [];
  }, [folder, nodes]);

  const startEdit = useCallback((node) => {
    setEditingId(node.id);
    setDraft(node.synopsis ?? node.metadata?.synopsis ?? '');
  }, []);

  const commitEdit = useCallback(
    (id) => {
      if (typeof onUpdateSynopsis === 'function') {
        onUpdateSynopsis(id, draft.trim());
      }
      setEditingId(null);
      setDraft('');
    },
    [draft, onUpdateSynopsis]
  );

  const openNode = useCallback(
    (node) => {
      if (typeof onSelectNode === 'function') onSelectNode(node);
      else if (typeof onOpenNode === 'function') onOpenNode(node);
    },
    [onOpenNode, onSelectNode]
  );

  const cards = useMemo(() => rawNodes.filter((n) => n && (n.type === 'doc' || !n.type)), [rawNodes]);

  if (cards.length === 0) {
    return (
      <section className="corkboard" aria-label="Mantar pano">
        <div className="corkboard__empty">
          <p>Görüntülenecek kart yok. Proje ağacından bir klasör seçin.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="corkboard" role="list" aria-label="Mantar pano kartları">
      {cards.map((node) => {
        const st = normalizeStatus(node);
        const isEditing = editingId === node.id;
        const synopsis = node.synopsis ?? node.metadata?.synopsis ?? '';
        const pinColor = `hsl(${(String(node.id).charCodeAt(0) * 37) % 360} 45% 42%)`;

        return (
          <article
            key={node.id}
            role="listitem"
            className={`index-card status-${st}${hoverId === node.id ? ' is-hovered' : ''}`}
            onMouseEnter={() => setHoverId(node.id)}
            onMouseLeave={() => setHoverId((v) => (v === node.id ? null : v))}
            onKeyDown={(e) => {
              if (isEditing) return;
              if (e.key === 'Enter') openNode(node);
              if (e.key === 'F2') {
                e.preventDefault();
                startEdit(node);
              }
            }}
            tabIndex={0}
            aria-label={`${node.title}, durum: ${statuses[st] || st}`}
          >
            {/* Raptiye */}
            <span className="index-card__pin" aria-hidden="true">
              <span className="index-card__pin-head" style={{ '--pin-color': pinColor }} />
              <span className="index-card__pin-shadow" />
            </span>

            {/* Durum renk şeridi */}
            <span className={`index-card__stripe stripe-${st}`} aria-hidden="true" />

            <header
              className="index-card__title"
              onDoubleClick={() => openNode(node)}
              title="Dokümanı açmak için çift tıklayın"
            >
              {node.title}
            </header>

            <div className="index-card__body">
              {isEditing ? (
                <textarea
                  className="index-card__synopsis-input"
                  value={draft}
                  autoFocus
                  rows={4}
                  placeholder="Konu özeti…"
                  aria-label={`${node.title} konusu`}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitEdit(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commitEdit(node.id);
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setDraft('');
                    }
                  }}
                />
              ) : (
                <p
                  className={`index-card__synopsis${!synopsis ? ' is-empty' : ''}`}
                  onClick={() => startEdit(node)}
                  title="Özeti düzenlemek için tıklayın"
                >
                  {synopsis || 'Özet eklemek için buraya tıklayın…'}
                </p>
              )}
            </div>

            <footer className="index-card__foot">
              <span className={`status-chip chip-${st}`}>{statuses[st] || st}</span>
              {!isEditing && (
                <button
                  type="button"
                  className="index-card__edit-btn"
                  title="Özeti düzenle (F2)"
                  aria-label={`${node.title} özetini düzenle`}
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(node);
                  }}
                >
                  ✎
                </button>
              )}
            </footer>
          </article>
        );
      })}
    </section>
  );
}
