import React, { useState, useEffect, useCallback } from 'react';
import './Corkboard.css';

/**
 * Corkboard — Faz 7: secili klasorun cocuklari icin index-card (mantar panosu)
 * gorunumu. Her kart dugumun basligini ve synopsis'unu gosterir; synopsis kart
 * uzerinden duzenlenebilir.
 *
 * props:
 *   folder: { id, type:'folder', title, children: Node[] } | null
 *         — Binder'dan secilen klasor; null ise bos durum gosterilir.
 *   onSelectNode: (node) => void
 *         — karta tiklaninca ilgili dokumanin editorda acilmasi icin.
 *   onUpdateSynopsis?: (nodeId, newSynopsis) => void
 *         — kart uzerinden synopsis duzenlenince cagrilir (metadata state'ine yazar).
 */

function getMeta(node) {
  return node?.metadata || {};
}

const LABEL_COLORS = {
  Kirmizi: '#e05c5c',
  Yesil: '#4caf72',
  Mavi: '#4a90d9',
  Sari: '#e6c34a',
  Turuncu: '#e88b3f',
  Mor: '#9b59b6',
};

function Card({ node, onSelectNode, onUpdateSynopsis }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(getMeta(node).synopsis || '');

  // Dis dunya (Inspector vb.) synopsis degistirirse draft'i senkronla
  useEffect(() => {
    if (!editing) {
      setDraft(getMeta(node).synopsis || '');
    }
  }, [node, editing]);

  const meta = getMeta(node);
  const status = meta.status || '';
  const labels = Array.isArray(meta.labels) ? meta.labels : [];
  const keywords = Array.isArray(meta.keywords) ? meta.keywords : [];
  const synopsis = meta.synopsis || '';

  const handleStartEdit = useCallback(
    (e) => {
      e.stopPropagation();
      setDraft(synopsis);
      setEditing(true);
    },
    [synopsis]
  );

  const handleCommit = useCallback(() => {
    setEditing(false);
    if (typeof onUpdateSynopsis === 'function' && draft !== synopsis) {
      onUpdateSynopsis(node.id, draft.trim());
    }
  }, [draft, synopsis, node.id, onUpdateSynopsis]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setDraft(synopsis);
        setEditing(false);
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleCommit();
      }
    },
    [synopsis, handleCommit]
  );

  const isDoc = node.type === 'doc';

  return (
    <li
      className="cork-card"
      onClick={() => isDoc && onSelectNode && onSelectNode(node)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isDoc) {
          e.preventDefault();
          onSelectNode && onSelectNode(node);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${node.title} kartı`}
      style={{ cursor: isDoc ? 'pointer' : 'default' }}
    >
      {/* Iğne görseli */}
      <span className="cork-card__pin" aria-hidden="true">📌</span>

      <header className="cork-card__header">
        <h3 className="cork-card__title">{node.title}</h3>
        {status && <span className="cork-card__status">{status}</span>}
      </header>

      {/* Etiket noktaları */}
      {labels.length > 0 && (
        <div className="cork-card__labels" aria-label="Etiketler">
          {labels.map((l) => (
            <span
              key={l}
              className="cork-card__label-dot"
              style={{ backgroundColor: LABEL_COLORS[l] || '#999' }}
              title={l}
            />
          ))}
        </div>
      )}

      {/* Synopsis alani — kart uzerinden duzenlenebilir */}
      <div className="cork-card__body">
        {editing ? (
          <textarea
            className="cork-card__synopsis-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="Bu bölümün kısa özeti..."
            aria-label={`${node.title} synopsis düzenleme`}
          />
        ) : (
          <p
            className={`cork-card__synopsis${synopsis ? '' : ' cork-card__synopsis--empty'}`}
            onDoubleClick={handleStartEdit}
            title="Çift tıklayarak düzenleyin"
          >
            {synopsis || 'Synopsis yok — çift tıklayın.'}
          </p>
        )}
      </div>

      {/* Anahtar kelimeler */}
      {keywords.length > 0 && (
        <footer className="cork-card__keywords" aria-label="Anahtar kelimeler">
          {keywords.map((kw) => (
            <span key={kw} className="cork-card__keyword">
              {kw}
            </span>
          ))}
        </footer>
      )}

      {/* Duzenleme ipucu butonu */}
      <button
        type="button"
        className="cork-card__edit-btn"
        onClick={handleStartEdit}
        aria-label="Synopsis'u düzenle"
        title="Synopsis'u düzenle"
      >
        ✎
      </button>
    </li>
  );
}

export default function Corkboard({ folder = null, onSelectNode, onUpdateSynopsis }) {
  // Bos durum: klasor secilmedi
  if (!folder || folder.type !== 'folder') {
    return (
      <section className="corkboard corkboard--empty" aria-label="Corkboard">
        <div className="corkboard-empty-state">
          <span className="corkboard-empty-icon" aria-hidden="true">🗂️</span>
          <h2>Corkboard</h2>
          <p>Kartlarını görmek için Binder'dan bir klasör seçin.</p>
        </div>
      </section>
    );
  }

  const children = Array.isArray(folder.children) ? folder.children : [];

  return (
    <section className="corkboard" aria-label={`Corkboard - ${folder.title}`}>
      <header className="corkboard-header">
        <h2 className="corkboard-header__title">{folder.title}</h2>
        <span className="corkboard-header__count">
          {children.length} kart
        </span>
      </header>

      {children.length === 0 ? (
        <div className="corkboard-empty-folder">
          <p>Bu klasörde henüz kart yok. Yeni bir doküman ekleyin.</p>
        </div>
      ) : (
        <ul className="corkboard-grid" role="list">
          {children.map((child) => (
            <Card
              key={child.id}
              node={child}
              onSelectNode={onSelectNode}
              onUpdateSynopsis={onUpdateSynopsis}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
