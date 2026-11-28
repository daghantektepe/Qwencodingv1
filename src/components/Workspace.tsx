/**
 * Workspace - Ana çalışma alanı bileşeni (modülerleştirilmiş).
 * App.tsx içindeki tekrar eden editör + başlık + eylem çubuğu bloğunu sarmalar.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  createProject,
  writeContent,
  saveProject,
  closeProject,
  openProject,
  exportProject,
  type Project,
} from '../services/projectLifecycle';

export type WorkspaceProps = {
  initialTitle?: string;
  onProjectChange?: (project: Project | null) => void;
  onError?: (message: string) => void;
};

type Status = 'idle' | 'working' | 'saved' | 'error';

export default function Workspace({
  initialTitle = 'Untitled Project',
  onProjectChange,
  onError,
}: WorkspaceProps): React.JSX.Element {
  const [project, setProject] = useState<Project | null>(null);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const notifyError = useCallback(
    (msg: string) => {
      setStatus('error');
      setMessage(msg);
      onError?.(msg);
    },
    [onError],
  );

  const handleCreate = useCallback(async () => {
    setStatus('working');
    try {
      const created = await createProject(initialTitle);
      setProject(created);
      setDraft('');
      setStatus('saved');
      setMessage('Proje oluşturuldu');
      onProjectChange?.(created);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Oluşturma hatası');
    }
  }, [initialTitle, notifyError, onProjectChange]);

  const handleWrite = useCallback((value: string) => {
    setDraft(value);
    setStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    if (!project) {
      notifyError('Kaydetmek için önce proje oluşturun');
      return;
    }
    setStatus('working');
    const ok = await writeContent(project.id, draft);
    if (!ok) {
      notifyError('Kaydetme başarısız');
      return;
    }
    const updated: Project = { ...project, content: draft, updatedAt: Date.now() };
    const saved = await saveProject(updated);
    if (!saved) {
      notifyError('Proje kalıcılaştırılamadı');
      return;
    }
    setProject(updated);
    setStatus('saved');
    setMessage('Kaydedildi');
    onProjectChange?.(updated);
  }, [draft, notifyError, onProjectChange, project]);

  const handleClose = useCallback(async () => {
    if (!project) return;
    setStatus('working');
    const ok = await closeProject(project.id);
    if (!ok) {
      notifyError('Kapatma başarısız');
      return;
    }
    setStatus('idle');
    setMessage('Proje kapatıldı');
    onProjectChange?.(null);
  }, [notifyError, onProjectChange, project]);

  const handleOpen = useCallback(async () => {
    if (!project) {
      notifyError('Açmak için önce bir proje oluşturun');
      return;
    }
    setStatus('working');
    const opened = await openProject(project.id);
    if (!opened) {
      notifyError('Açma başarısız');
      return;
    }
    setProject(opened);
    setDraft(opened.content);
    setStatus('saved');
    setMessage('Proje açıldı');
    onProjectChange?.(opened);
  }, [notifyError, onProjectChange, project]);

  const handleExport = useCallback(async () => {
    if (!project) {
      notifyError('Dışa aktarmak için önce proje oluşturun');
      return;
    }
    setStatus('working');
    const result = await exportProject(project.id, 'json');
    if (!result.ok || result.payload === undefined) {
      notifyError(result.error ?? 'Dışa aktarma başarısız');
      return;
    }
    setStatus('saved');
    setMessage(`Dışa aktarıldı (${result.payload.length} bayt)`);
  }, [notifyError, project]);

  useEffect(() => {
    // Boş draft kaldığında uyarı vermemek için sessiz geçiş.
    if (!project && draft.length === 0) setStatus('idle');
  }, [draft, project]);

  return (
    <section className="workspace" data-testid="workspace">
      <header className="workspace-toolbar" data-testid="workspace-toolbar">
        <button type="button" onClick={handleCreate} data-testid="btn-create">
          Oluştur
        </button>
        <button type="button" onClick={handleSave} data-testid="btn-save">
          Kaydet
        </button>
        <button type="button" onClick={handleClose} data-testid="btn-close">
          Kapat
        </button>
        <button type="button" onClick={handleOpen} data-testid="btn-open">
          Aç
        </button>
        <button type="button" onClick={handleExport} data-testid="btn-export">
          Dışa Aktar
        </button>
        <span data-testid="workspace-status">{status}</span>
        <span data-testid="workspace-message">{message}</span>
      </header>
      <textarea
        aria-label="workspace-editor"
        data-testid="workspace-editor"
        value={draft}
        onChange={(e) => handleWrite(e.target.value)}
        className="workspace-editor"
      />
      <footer data-testid="workspace-project-id">
        {project ? project.id : 'no-project'}
      </footer>
    </section>
  );
}
