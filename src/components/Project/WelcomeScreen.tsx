import React, { useEffect, useState } from 'react';
import { FolderOpen, FilePlus, X } from 'lucide-react';
import './WelcomeScreen.css';

/**
 * WelcomeScreen — proje oluşturma / açma ekranı (.opscriv paketleri).
 * Tüm disk işlemleri App'te; bu bileşen yalnızca formu ve son projeleri gösterir.
 */

export interface RecentProject {
  path: string;
  name: string;
  openedAt?: string;
}

interface Props {
  recent: RecentProject[];
  defaultDir: string;
  legacyDocCount: number;
  busy: boolean;
  error: string | null;
  onCreate: (opts: { name: string; parentDir: string; importLegacy: boolean }) => void;
  onPickDir: () => Promise<string | null>;
  onOpenRecent: (path: string) => void;
  onOpenOther: () => void;
  onForget: (path: string) => void;
  onCancel?: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function WelcomeScreen({
  recent,
  defaultDir,
  legacyDocCount,
  busy,
  error,
  onCreate,
  onPickDir,
  onOpenRecent,
  onOpenOther,
  onForget,
  onCancel,
}: Props) {
  const [name, setName] = useState('');
  const [parentDir, setParentDir] = useState(defaultDir);
  const [importLegacy, setImportLegacy] = useState(true);

  useEffect(() => {
    if (!parentDir && defaultDir) setParentDir(defaultDir);
  }, [defaultDir, parentDir]);

  const canCreate = Boolean(name.trim() && parentDir && !busy);

  return (
    <div className="welcome">
      <div className="welcome__card">
        <header className="welcome__head">
          <h1>OpenScriv</h1>
          <p>Yeni bir proje başlatın ya da kaldığınız yerden devam edin.</p>
        </header>

        {error && (
          <p className="welcome__error" role="alert">
            {error}
          </p>
        )}

        <div className="welcome__cols">
          <form
            className="welcome__section"
            aria-label="Yeni proje"
            onSubmit={(e) => {
              e.preventDefault();
              if (canCreate) onCreate({ name: name.trim(), parentDir, importLegacy: legacyDocCount > 0 && importLegacy });
            }}
          >
            <h2>Yeni proje</h2>
            <label className="welcome__field">
              <span>Proje adı</span>
              <input
                type="text"
                value={name}
                autoFocus
                placeholder="Örn. Kış Masalı"
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <div className="welcome__field">
              <span>Konum</span>
              <div className="welcome__location">
                <code title={parentDir}>{parentDir || '…'}</code>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={async () => {
                    const picked = await onPickDir();
                    if (picked) setParentDir(picked);
                  }}
                >
                  Değiştir…
                </button>
              </div>
            </div>

            {legacyDocCount > 0 && (
              <label className="welcome__check">
                <input type="checkbox" checked={importLegacy} onChange={(e) => setImportLegacy(e.target.checked)} />
                <span>
                  Önceki çalışmamı ({legacyDocCount} belge) bu projeye aktar
                  <small>Eski dosya olduğu gibi kalır.</small>
                </span>
              </label>
            )}

            <button type="submit" className="btn btn--primary welcome__submit" disabled={!canCreate}>
              <FilePlus size={15} /> {busy ? 'Oluşturuluyor…' : 'Projeyi oluştur'}
            </button>
          </form>

          <section className="welcome__section" aria-label="Son projeler">
            <h2>Son projeler</h2>
            {recent.length === 0 ? (
              <p className="welcome__empty">Henüz açılmış bir proje yok.</p>
            ) : (
              <ul className="welcome__recent">
                {recent.map((p) => (
                  <li key={p.path}>
                    <button type="button" className="welcome__recent-item" disabled={busy} onClick={() => onOpenRecent(p.path)} title={p.path}>
                      <strong>{p.name}</strong>
                      <span>{p.path}</span>
                      <time>{formatDate(p.openedAt)}</time>
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      aria-label={`${p.name} listeden kaldır`}
                      title="Listeden kaldır (dosyalar silinmez)"
                      onClick={() => onForget(p.path)}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="btn" disabled={busy} onClick={onOpenOther}>
              <FolderOpen size={15} /> Başka bir proje aç…
            </button>
          </section>
        </div>

        {onCancel && (
          <footer className="welcome__foot">
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              Açık projeye dön
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
