/**
 * FAZ 126 - BackupPanel
 * Workspace içine entegre edilebilen yedek listesi, oluşturma ve geri yükleme paneli.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createBackup,
  listBackups,
  restoreBackup,
  exportAs,
  type BackupEntry,
  type BackupExportFormat,
} from '../services/backupService';

export type BackupPanelProps = {
  projectId: string | null;
  projectTitle?: string;
  currentContent?: string;
  onRestored?: (content: string) => void;
  onError?: (message: string) => void;
};

type Status = 'idle' | 'working' | 'ok' | 'error';

function formatTs(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function BackupPanel({
  projectId,
  projectTitle = 'Untitled',
  currentContent = '',
  onRestored,
  onError,
}: BackupPanelProps): React.JSX.Element {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    if (!projectId) {
      setBackups([]);
      return;
    }
    const list = await listBackups(projectId);
    setBackups(list);
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = useCallback(async () => {
    if (!projectId) {
      setStatus('error');
      setMessage('Önce bir proje oluşturun');
      onError?.('Önce bir proje oluşturun');
      return;
    }
    setStatus('working');
    const res = await createBackup({
      projectId,
      title: projectTitle,
      content: currentContent,
      label: 'Manuel yedek',
    });
    if (!res.ok) {
      setStatus('error');
      setMessage(res.error);
      onError?.(res.error);
      return;
    }
    setStatus('ok');
    setMessage('Yedek oluşturuldu');
    await refresh();
  }, [currentContent, onError, projectId, projectTitle, refresh]);

  const handleRestore = useCallback(
    async (id: string) => {
      setStatus('working');
      const res = await restoreBackup(id);
      if (!res.ok) {
        setStatus('error');
        setMessage(res.error);
        onError?.(res.error);
        return;
      }
      setStatus('ok');
      setMessage('Yedek geri yüklendi');
      onRestored?.(res.data.content);
      await refresh();
    },
    [onError, onRestored, refresh],
  );

  const handleExport = useCallback(
    async (format: BackupExportFormat) => {
      if (!projectId) {
        setStatus('error');
        setMessage('Önce bir proje seçin');
        return;
      }
      setStatus('working');
      const res = await exportAs(projectId, format);
      if (!res.ok) {
        setStatus('error');
        setMessage(res.error);
        onError?.(res.error);
        return;
      }
      setStatus('ok');
      setMessage(`Dışa aktarıldı: ${res.data.filename}`);
    },
    [onError, projectId],
  );

  const emptyHint = useMemo(
    () => (backups.length === 0 ? 'Henüz yedek yok' : ''),
    [backups.length],
  );

  return (
    <section className="backup-panel" data-testid="backup-panel">
      <header className="backup-toolbar">
        <button type="button" onClick={handleCreate} data-testid="backup-create">
          Yedek Oluştur
        </button>
        <button
          type="button"
          onClick={() => handleExport('md')}
          data-testid="backup-export-md"
        >
          .md Aktar
        </button>
        <button
          type="button"
          onClick={() => handleExport('json')}
          data-testid="backup-export-json"
        >
          .json Aktar
        </button>
        <button type="button" onClick={() => void refresh()} data-testid="backup-refresh">
          Yenile
        </button>
        <span data-testid="backup-status">{status}</span>
        <span data-testid="backup-message">{message}</span>
      </header>
      {emptyHint ? (
        <p data-testid="backup-empty">{emptyHint}</p>
      ) : (
        <ul data-testid="backup-list">
          {backups.map((b) => (
            <li key={b.id} data-testid={`backup-item-${b.id}`}>
              <span data-testid={`backup-label-${b.id}`}>{b.label}</span>
              <span data-testid={`backup-ts-${b.id}`}>{formatTs(b.createdAt)}</span>
              <span data-testid={`backup-size-${b.id}`}>{b.size} bayt</span>
              <button
                type="button"
                onClick={() => void handleRestore(b.id)}
                data-testid={`backup-restore-${b.id}`}
              >
                Geri Yükle
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
