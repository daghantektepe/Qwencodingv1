import React, { useState } from 'react';
import {
  useBackupStore,
  BackupEntry
} from '../../services/backup/redundantBackupEngine';
import {
  ShieldCheck,
  Archive,
  HardDrive,
  Usb,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

interface BackupHistoryManagerProps {
  onClose?: () => void;
  projectName?: string;
  getCurrentProjectData?: () => { documents: any[]; metadata?: any };
  onRestoreProject?: (restoredData: any) => void;
}

export const BackupHistoryManager: React.FC<BackupHistoryManagerProps> = ({
  onClose,
  projectName = 'OpenScriv Projesi',
  getCurrentProjectData = () => ({ documents: [] }),
  onRestoreProject
}) => {
  const {
    backups,
    config,
    updateConfig,
    createBackup,
    restoreBackup,
    deleteBackup
  } = useBackupStore();

  const [restoreCandidate, setRestoreCandidate] = useState<BackupEntry | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleManualBackup = () => {
    const payload = getCurrentProjectData();
    const entry = createBackup(projectName, payload, 'manual');
    setStatusMessage({
      text: `Başarıyla yeni yedek oluşturuldu: ${entry.filename}`,
      type: 'success'
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const confirmRestore = () => {
    if (!restoreCandidate) return;

    const res = restoreBackup(restoreCandidate.id);
    if (res.success && res.data) {
      if (onRestoreProject) {
        onRestoreProject(res.data);
      }
      setStatusMessage({
        text: `Proje '${restoreCandidate.filename}' yedeğinden başarıyla geri yüklendi!`,
        type: 'success'
      });
      setRestoreCandidate(null);
    } else {
      setStatusMessage({
        text: res.error || 'Geri yükleme başarısız.',
        type: 'error'
      });
    }
  };

  const getTypeBadge = (type: BackupEntry['type']) => {
    switch (type) {
      case 'external_usb':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            <Usb className="w-3 h-3" />
            Harici USB
          </span>
        );
      case 'daily':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Günlük
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
            Manuel
          </span>
        );
      case 'auto':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            Otomatik
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-base font-semibold tracking-wide">
            Yedekleme ve Versiyon Arşivi Yöneticisi
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Şimdi Manuel Yedek Al</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Notification banner */}
      {statusMessage && (
        <div
          className={`p-2.5 my-2 rounded-lg text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Redundant Configuration Bar */}
      <div className="p-3 my-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-stone-400" />
          <span className="font-medium text-stone-600 dark:text-stone-300">İkincil Konum:</span>
          <input
            type="text"
            value={config.secondaryPath}
            onChange={(e) => updateConfig({ secondaryPath: e.target.value })}
            className="px-2 py-1 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[11px] w-48"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.externalDriveAutoBackup}
            onChange={(e) => updateConfig({ externalDriveAutoBackup: e.target.checked })}
            className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
          />
          <span className="text-stone-600 dark:text-stone-300">
            USB Takıldığında Otomatik Yedekle
          </span>
        </label>
      </div>

      {/* Backup Archive List */}
      <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
        {backups.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-stone-400 text-center">
            <Archive className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">Henüz kayıtlı bir yedek arşivi bulunmuyor.</p>
          </div>
        ) : (
          backups.map((b) => (
            <div
              key={b.id}
              className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {b.filename}
                  </span>
                  {getTypeBadge(b.type)}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  <span>{new Date(b.timestamp).toLocaleString()}</span>
                  <span>• {(b.sizeBytes / 1024).toFixed(1)} KB</span>
                  <span>• {b.documentCount} doküman</span>
                  <span>• {b.wordCountTotal.toLocaleString()} kelime</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setRestoreCandidate(b)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Geri Yükle</span>
                </button>
                <button
                  onClick={() => deleteBackup(b.id)}
                  title="Yedeği Sil"
                  className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal for Restore */}
      {restoreCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-stone-800 rounded-xl max-w-md w-full p-5 border border-stone-300 dark:border-stone-700 flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Yedekten Geri Yükleme Onayı
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              <strong>{restoreCandidate.filename}</strong> yedeği geri yüklenecek.
              Mevcut kaydedilmemiş değişiklikler bu yedeğin verileriyle güncellenecektir.
              Devam etmek istiyor musunuz?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setRestoreCandidate(null)}
                className="px-3 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700"
              >
                İptal
              </button>
              <button
                onClick={confirmRestore}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white"
              >
                Evet, Yedeği Geri Yükle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
