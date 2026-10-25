import React, { useState, useEffect, useCallback } from 'react';
import DocumentDiffViewer from './Diff/DocumentDiffViewer';
import './Snapshots.css';

/**
 * Snapshots — Faz 10: doküman anlık görüntüsü (versiyonlama) arayüzü.
 *
 * İşlevler:
 *  1) Aktif doküman için snapshot alır (IPC: snapshot-create)
 *  2) Mevcut snapshot'ları listeler (IPC: snapshot-list)
 *  3) Seçilen snapshot'ı geri yükler (IPC: snapshot-load → onRestore ile editöre verilir)
 *  4) Snapshot siler (IPC: snapshot-delete) ve önizleme yapar (IPC: snapshot-load)
 *
 * props:
 *   document: { id, title, content } | null — aktif doküman
 *   projectId: string — proje kimliği (snapshot klasörlemesi için)
 *   onRestore: (docId, restoredContent, snapshotMeta) => void
 *        — geri yüklemede App/Editör'e içeriği teslim eder.
 */

// Electron API köprüsü (preload.js'ten gelir). Tarayıcıda test için localStorage fallback.
const api = typeof window !== 'undefined' ? window.electronAPI : null;

async function callIpc(channel, payload) {
  // Gerçek Electron ortamı: preload üzerinden named API varsa onu kullan
  if (api) {
    switch (channel) {
      case 'snapshot-create':
        if (typeof api.createSnapshot === 'function') return api.createSnapshot(payload);
        break;
      case 'snapshot-list':
        if (typeof api.listSnapshots === 'function') return api.listSnapshots(payload);
        break;
      case 'snapshot-load':
        if (typeof api.loadSnapshot === 'function') return api.loadSnapshot(payload);
        break;
      case 'snapshot-delete':
        if (typeof api.deleteSnapshot === 'function') return api.deleteSnapshot(payload);
        break;
      default:
        break;
    }
    // Generic invoke köprüsü tanımlıysa onu dene
    if (typeof api.invoke === 'function') {
      return api.invoke(channel, payload);
    }
  }
  // Fallback: web/geliştirme ortamında localStorage tabanlı simülasyon
  return localStorageSnapshotOps(channel, payload);
}

function lsKey(projectId, docId) {
  return `openscriv:snapshots:${projectId}:${docId}`;
}

function localStorageSnapshotOps(channel, { projectId, docId, timestamp, content, title, note }) {
  const readAll = () => {
    try {
      const raw = localStorage.getItem(lsKey(projectId, docId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const writeAll = (list) => {
    localStorage.setItem(lsKey(projectId, docId), JSON.stringify(list));
  };

  switch (channel) {
    case 'snapshot-create': {
      const ts = Date.now();
      const entry = {
        id: `snap-${ts}-${Math.random().toString(36).slice(2, 8)}`,
        title: title || `Otomatik ${new Date(ts).toLocaleString('tr-TR')}`,
        note: note || '',
        timestamp: ts,
        size: (content || '').length,
        content: content || '',
      };
      const list = readAll();
      list.unshift(entry);
      writeAll(list.slice(0, 50));
      const { content: _omit, ...meta } = entry;
      return { ok: true, snapshot: meta };
    }
    case 'snapshot-list': {
      const list = readAll().map(({ content: _c, ...meta }) => meta);
      return { ok: true, snapshots: list };
    }
    case 'snapshot-load': {
      const found = readAll().find((s) => s.timestamp === timestamp);
      return found ? { ok: true, snapshot: found } : { ok: false, error: 'Snapshot bulunamadı.' };
    }
    case 'snapshot-delete': {
      writeAll(readAll().filter((s) => s.timestamp !== timestamp));
      return { ok: true };
    }
    default:
      return { ok: false, error: `Bilinmeyen kanal: ${channel}` };
  }
}

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(ts);
  }
}

export default function Snapshots({ document = null, projectId = 'default', onRestore }) {
  const [snapshots, setSnapshots] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type:'ok'|'error', text }
  const [noteInput, setNoteInput] = useState('');
  const [preview, setPreview] = useState(null); // snapshot objesi (içerikli)
  const [restoreTarget, setRestoreTarget] = useState(null); // onay bekleyen snapshot
  const [diffSnapshot, setDiffSnapshot] = useState(null); // diff modalı için seçilen snapshot

  // Doküman değişince listeyi yenile
  // Yalnızca doküman kimliğine bağlı: her tuş vuruşunda liste yeniden çekilmez.
  const docId = document?.id;
  const refreshList = useCallback(async () => {
    if (!docId) {
      setSnapshots([]);
      return;
    }
    try {
      const res = await callIpc('snapshot-list', { projectId, docId });
      if (res?.ok) setSnapshots(res.snapshots || []);
      else setMessage({ type: 'error', text: res?.error || 'Liste alınamadı.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }, [docId, projectId]);

  useEffect(() => {
    setPreview(null);
    setDiffSnapshot(null);
    setRestoreTarget(null);
    setNoteInput('');
    refreshList();
  }, [refreshList]);

  // --- Snapshot AL ---
  const handleCreate = useCallback(async () => {
    if (!document || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await callIpc('snapshot-create', {
        projectId,
        docId: document.id,
        content: document.content || '',
        note: noteInput.trim(),
      });
      if (res?.ok) {
        setMessage({ type: 'ok', text: 'Anlık görüntü alındı ✓' });
        setNoteInput('');
        await refreshList();
      } else {
        setMessage({ type: 'error', text: res?.error || 'Snapshot alınamadı.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }, [document, busy, projectId, noteInput, refreshList]);

  // --- Önizleme ---
  const handlePreview = useCallback(
    async (snap) => {
      if (!document) return;
      setBusy(true);
      try {
        const res = await callIpc('snapshot-load', {
          projectId,
          docId: document.id,
          timestamp: snap.timestamp,
        });
        if (res?.ok) setPreview(res.snapshot);
        else setMessage({ type: 'error', text: res?.error || 'Önizleme alınamadı.' });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setBusy(false);
      }
    },
    [document, projectId]
  );

  // --- Görsel Diff Karşılaştırma ---
  const handleOpenDiff = useCallback(
    async (snap) => {
      if (!document) return;
      setBusy(true);
      try {
        const res = await callIpc('snapshot-load', {
          projectId,
          docId: document.id,
          timestamp: snap.timestamp,
        });
        if (res?.ok && res.snapshot) {
          setDiffSnapshot(res.snapshot);
        } else {
          setMessage({ type: 'error', text: res?.error || 'Snapshot içeriği alınamadı.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setBusy(false);
      }
    },
    [document, projectId]
  );

  // --- GERİ YÜKLE (tamamlanma kriteri) ---
  const doRestore = useCallback(
    async (snap) => {
      if (!document || busy) return;
      setBusy(true);
      try {
        const res = await callIpc('snapshot-load', {
          projectId,
          docId: document.id,
          timestamp: snap.timestamp,
        });
        if (res?.ok && res.snapshot) {
          if (typeof onRestore === 'function') {
            onRestore(document.id, res.snapshot.content || '', {
              timestamp: snap.timestamp,
              title: snap.title,
            });
          }
          setMessage({ type: 'ok', text: `Geri yüklendi: "${snap.title}" ✓` });
          setRestoreTarget(null);
          setPreview(null);
        } else {
          setMessage({ type: 'error', text: res?.error || 'Geri yükleme başarısız.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setBusy(false);
      }
    },
    [document, busy, projectId, onRestore]
  );

  // --- Sil ---
  const handleDelete = useCallback(
    async (snap) => {
      if (!document) return;
      setBusy(true);
      try {
        const res = await callIpc('snapshot-delete', {
          projectId,
          docId: document.id,
          timestamp: snap.timestamp,
        });
        if (res?.ok) {
          await refreshList();
          if (preview?.timestamp === snap.timestamp) setPreview(null);
        } else {
          setMessage({ type: 'error', text: res?.error || 'Silinemedi.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setBusy(false);
      }
    },
    [document, projectId, refreshList, preview]
  );

  return (
    <aside className="snapshots" aria-label="Snapshots - Geçmiş Versiyonlar">
      <header className="snapshots-header">
        <h2 className="snapshots-header__title">Anlık Görüntüler</h2>
        {document && <span className="snapshots-header__doc">{document.title}</span>}
      </header>

      {!document ? (
        <div className="snapshots-empty">
          <p>Snapshots görmek için Binder'dan bir doküman seçin.</p>
        </div>
      ) : (
        <>
          {/* Alım formu */}
          <div className="snapshots-create">
            <input
              type="text"
              className="snapshots-note-input"
              placeholder="Not (opsiyonel): örn. 'bölüm sonu taslağı'"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
            <button
              type="button"
              className="snapshots-btn snapshots-btn--primary"
              onClick={handleCreate}
              disabled={busy}
            >
              📸 Snapshot Al
            </button>
          </div>

          {message && (
            <div className={`snapshots-msg snapshots-msg--${message.type}`} role="status">
              {message.text}
            </div>
          )}

          {/* Liste */}
          <ul className="snapshots-list" aria-label="Snapshot listesi">
            {snapshots.length === 0 && (
              <li className="snapshots-list-empty">Henüz snapshot yok.</li>
            )}
            {snapshots.map((snap) => (
              <li key={snap.timestamp} className="snapshots-item">
                <div className="snapshots-item__info">
                  <span className="snapshots-item__time">{formatTimestamp(snap.timestamp)}</span>
                  <span className="snapshots-item__title">{snap.title}</span>
                  {snap.note && <span className="snapshots-item__note">{snap.note}</span>}
                  <span className="snapshots-item__size">
                    {(snap.size ?? 0).toLocaleString('tr-TR')} karakter
                  </span>
                </div>
                <div className="snapshots-item__actions">
                  <button
                    type="button"
                    className="snapshots-btn snapshots-btn--small"
                    onClick={() => handlePreview(snap)}
                    disabled={busy}
                    title="Önizle"
                  >
                    👁
                  </button>
                  <button
                    type="button"
                    className="snapshots-btn snapshots-btn--small"
                    onClick={() => handleOpenDiff(snap)}
                    disabled={busy}
                    title="Farkı Görsel Karşılaştır (Diff)"
                  >
                    🔍
                  </button>
                  <button
                    type="button"
                    className="snapshots-btn snapshots-btn--small snapshots-btn--restore"
                    onClick={() => setRestoreTarget(snap)}
                    disabled={busy}
                    title="Bu sürüme dön"
                  >
                    ↩ Geri Yükle
                  </button>
                  <button
                    type="button"
                    className="snapshots-btn snapshots-btn--small snapshots-btn--danger"
                    onClick={() => handleDelete(snap)}
                    disabled={busy}
                    title="Sil"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Geri yükleme onayı */}
          {restoreTarget && (
            <div className="snapshots-confirm" role="alertdialog" aria-label="Geri yükleme onayı">
              <p>
                <strong>{restoreTarget.title}</strong> ({formatTimestamp(restoreTarget.timestamp)})
                sürümüne dönülsün mü? Mevcut içerik değişecek.
              </p>
              <div className="snapshots-confirm__actions">
                <button
                  type="button"
                  className="snapshots-btn"
                  onClick={() => setRestoreTarget(null)}
                  disabled={busy}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className="snapshots-btn snapshots-btn--primary"
                  onClick={() => doRestore(restoreTarget)}
                  disabled={busy}
                >
                  {busy ? 'Yükleniyor…' : 'Evet, geri yükle'}
                </button>
              </div>
            </div>
          )}

          {/* Önizleme paneli */}
          {preview && (
            <div className="snapshots-preview">
              <div className="snapshots-preview__head">
                <h3>Önizleme — {preview.title}</h3>
                <button
                  type="button"
                  className="snapshots-btn snapshots-btn--small"
                  onClick={() => setPreview(null)}
                >
                  Kapat ×
                </button>
              </div>
              <pre className="snapshots-preview__content">
                {preview.content}
              </pre>
            </div>
          )}

          {/* Görsel Metin Farkı (Diff Viewer) Modalı */}
          {diffSnapshot && (
            <div
              className="snapshots-diff-overlay fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
              role="dialog"
              aria-label="Versiyon Karşılaştırma ve Metin Farkı Modalı"
            >
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-neutral-300 dark:border-neutral-700">
                <DocumentDiffViewer
                  oldText={diffSnapshot.content || ''}
                  newText={document.content || ''}
                  documentTitle={document.title}
                  snapshots={snapshots}
                  selectedSnapshotTimestamp={diffSnapshot.timestamp}
                  onSelectSnapshot={(ts) => {
                    const found = snapshots.find((s) => s.timestamp === ts);
                    if (found) handleOpenDiff(found);
                  }}
                  onRollbackParagraph={(restoredFullText) => {
                    if (typeof onRestore === 'function') {
                      onRestore(document.id, restoredFullText, {
                        timestamp: diffSnapshot.timestamp,
                        title: `Seçmeli Geri Alma (${diffSnapshot.title})`,
                      });
                    }
                    setMessage({ type: 'ok', text: 'Seçilen paragraf geri yüklendi ✓' });
                  }}
                  onFullRollback={() => {
                    doRestore(diffSnapshot);
                    setDiffSnapshot(null);
                  }}
                  onClose={() => setDiffSnapshot(null)}
                />
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
