import React, { useState, useCallback, useMemo } from 'react';
import './Inspector.css';

/**
 * Inspector — Faz 21: Sağ panel (Meta / Labels / Snapshots sekmeleri).
 *
 * Aktif dokümanın metadata'sını gösterir ve düzenletir: durum, kelime hedefi,
 * etiket çipleri (ekle/sil), kısa notlar. Zarif sekme butonları ve şık çipler.
 *
 * props:
 *   doc: { id, title, content?, status?, labels?, synopsis?, notes?, wordTarget?,
 *          created?, modified? } | null
 *   onUpdateDoc?: (docId, patch) => void
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
    return d.toLocaleString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * @param {object} props
 * @param {any} [props.node]
 * @param {any} [props.doc]
 * @param {Function} [props.onUpdateMetadata]
 * @param {Function} [props.onUpdateDoc]
 * @param {string} [props.ariaLabel]
 * @param {Record<string, string>} [props.statuses]
 */
export default function Inspector({
  node = undefined,
  doc: docProp = undefined,
  onUpdateMetadata = (..._args) => {},
  onUpdateDoc = (..._args) => {},
  ariaLabel = 'Inspector',
  statuses = DEFAULT_STATUSES,
}) {
  const [tab, setTab] = useState('meta'); // meta | labels | notes
  const [labelDraft, setLabelDraft] = useState('');

  const doc = docProp || (node ? {
    id: node.id,
    title: node.title,
    content: node.content,
    status: node.metadata?.status,
    labels: node.metadata?.labels || [],
    keywords: node.metadata?.keywords || [],
    synopsis: node.metadata?.synopsis,
    notes: node.metadata?.notes,
    wordTarget: node.metadata?.wordTarget || 0,
    created: node.metadata?.created,
    modified: node.metadata?.modified,
  } : null);

  const words = useMemo(() => countWords(doc?.content), [doc?.content]);

  const patch = useCallback(
    (key, value) => {
      if (typeof onUpdateDoc === 'function' && doc) {
        onUpdateDoc(doc.id, { [key]: value });
      } else if (typeof onUpdateMetadata === 'function' && (node || doc)) {
        const id = node?.id || doc?.id;
        onUpdateMetadata(id, { [key]: value });
      }
    },
    [doc, node, onUpdateDoc, onUpdateMetadata]
  );

  const addLabel = useCallback(() => {
    const name = labelDraft.trim();
    if (!name || !doc) return;
    const current = Array.isArray(doc.labels) ? doc.labels : [];
    if (!current.includes(name)) {
      patch('labels', [...current, name]);
    }
    setLabelDraft('');
  }, [doc, labelDraft, patch]);

  const removeLabel = useCallback(
    (name) => {
      if (!doc) return;
      const current = Array.isArray(doc.labels) ? doc.labels : [];
      patch('labels', current.filter((l) => l !== name));
    },
    [doc, patch]
  );

  if (!doc) {
    return (
      <aside className="inspector" aria-label={ariaLabel}>
        <div className="inspector__empty">
          <p>Denetlemek için bir doküman seçin.</p>
        </div>
      </aside>
    );
  }

  const st = String(doc.status || 'none').toLowerCase();

  return (
    <aside className="inspector" aria-label={ariaLabel}>
      {/* Sekme butonları */}
      <nav className="inspector__tabs" role="tablist" aria-label="Denetçi sekmeleri">
        {[
          ['meta', 'Bilgi'],
          ['labels', 'Etiketler'],
          ['notes', 'Notlar'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`inspector__tab${tab === key ? ' is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="inspector__body" role="tabpanel">
        {tab === 'meta' && (
          <>
            <section className="inspector__section">
              <h3 className="inspector__section-title">Durum</h3>
              <div className="inspector__status-grid">
                {Object.entries(statuses).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`status-swatch swatch-${key}${st === key ? ' is-active' : ''}`}
                    aria-pressed={st === key}
                    onClick={() => patch('status', key)}
                  >
                    <span className="status-swatch__dot" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="inspector__section">
              <h3 className="inspector__section-title">Sayaçlar</h3>
              <dl className="inspector__stats">
                <div><dt>Kelime</dt><dd>{words.toLocaleString('tr-TR')}</dd></div>
                <div><dt>Hedef</dt><dd>{(doc.wordTarget || 0).toLocaleString('tr-TR')}</dd></div>
                <div><dt>Oluşturma</dt><dd>{fmtDate(doc.created)}</dd></div>
                <div><dt>Son değişiklik</dt><dd>{fmtDate(doc.modified)}</dd></div>
              </dl>
            </section>

            <section className="inspector__section">
              <h3 className="inspector__section-title">Kelime hedefi</h3>
              <input
                type="number"
                min="0"
                step="50"
                className="inspector__number-input"
                defaultValue={doc.wordTarget ?? 0}
                onBlur={(e) => patch('wordTarget', Math.max(0, Number(e.target.value) || 0))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                aria-label="Kelime hedefi"
              />
            </section>

            <section className="inspector__section">
              <h3 className="inspector__section-title">Synopsis</h3>
              <textarea
                className="inspector__textarea"
                rows={4}
                placeholder="Bu bölüm ne hakkında?"
                defaultValue={doc.synopsis ?? ''}
                onBlur={(e) => patch('synopsis', e.target.value)}
                aria-label="Konu özeti"
              />
            </section>
          </>
        )}

        {tab === 'labels' && (
          <section className="inspector__section">
            <h3 className="inspector__section-title">Etiketler</h3>
            <div className="inspector__chips">
              {(Array.isArray(doc.labels) ? doc.labels : []).map((name) => (
                <span key={name} className="label-chip">
                  {name}
                  <button
                    type="button"
                    className="label-chip__x"
                    aria-label={`${name} etiketini kaldır`}
                    onClick={() => removeLabel(name)}
                  >
                    ×
                  </button>
                </span>
              ))}
              {(!Array.isArray(doc.labels) || doc.labels.length === 0) && (
                <p className="inspector__hint">Henüz etiket yok.</p>
              )}
            </div>
            <div className="inspector__chip-add">
              <input
                type="text"
                className="inspector__text-input"
                placeholder="Yeni etiket…"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLabel();
                  }
                }}
                aria-label="Yeni etiket adı"
              />
              <button type="button" className="btn btn--primary btn--sm" onClick={addLabel}>
                Ekle
              </button>
            </div>
          </section>
        )}

        {tab === 'notes' && (
          <section className="inspector__section">
            <h3 className="inspector__section-title">Serbest notlar</h3>
            <textarea
              className="inspector__textarea inspector__textarea--tall"
              rows={10}
              placeholder="Fikirler, hatırlatmalar…"
              defaultValue={doc.notes ?? ''}
              onBlur={(e) => patch('notes', e.target.value)}
              aria-label="Doküman notları"
            />
          </section>
        )}
      </div>
    </aside>
  );
}
