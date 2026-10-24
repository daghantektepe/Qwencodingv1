/**
 * Update Notification Modal Component
 * Phase 112: Otomatik Güncelleyici (Auto-Updater) ve Sürüm Bütünlük Kontrolü
 */

import React, { useState } from 'react';
import { ArrowUpCircle, CheckCircle, X, Download } from 'lucide-react';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  downloadUrl?: string;
}

export interface UpdateNotificationModalProps {
  updateInfo?: UpdateInfo;
  onClose?: () => void;
  onRestart?: () => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  updateInfo = {
    hasUpdate: true,
    currentVersion: '2.0.0',
    latestVersion: '2.1.0',
    releaseNotes: '• Faz 101-120 Desktop Mastery tamamlandı.\n• SQLite FTS5 yüksek hızlı arama motoru.\n• Çerçevesiz özel başlık çubuğu.',
  },
  onClose,
  onRestart,
}) => {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  const startDownload = () => {
    setDownloading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setDownloadProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setDownloading(false);
        setDownloadComplete(true);
      }
    }, 100);
  };

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
      return;
    }
    if (window.electronAPI?.invoke) {
      window.electronAPI.invoke('updater:install-restart');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      data-testid="update-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#faf8f5',
          borderRadius: '12px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #d8cfc4',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#efe8dd',
            borderBottom: '1px solid #d8cfc4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowUpCircle size={22} color="#8a5a36" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#382b22' }}>
                Yeni Bir Güncelleme Mevcut!
              </div>
              <div style={{ fontSize: '12px', color: '#7a6a5d' }}>
                Mevcut: v{updateInfo.currentVersion} → Yeni: v{updateInfo.latestVersion}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a6a5d' }}
            aria-label="Kapat"
            data-testid="update-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sürüm Notları */}
        <div style={{ padding: '16px 20px', maxHeight: '220px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.6, color: '#3f3329' }}>
          <div style={{ fontWeight: 600, marginBottom: '6px', color: '#554133' }}>Yenilikler ve İyileştirmeler:</div>
          <pre
            style={{
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
              margin: 0,
              backgroundColor: '#f3ece1',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            data-testid="update-release-notes"
          >
            {updateInfo.releaseNotes}
          </pre>

          {/* İlerleme Çubuğu */}
          {(downloading || downloadComplete) && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#7a6a5d' }}>
                <span>{downloadComplete ? 'İndirme Tamamlandı' : 'Güncelleme İndiriliyor...'}</span>
                <span>%{downloadProgress}</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#e2d8ca', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${downloadProgress}%`,
                    height: '100%',
                    backgroundColor: '#8a5a36',
                    transition: 'width 0.2s ease',
                  }}
                  data-testid="update-progress-bar"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#efe8dd',
            borderTop: '1px solid #d8cfc4',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: '#e4dacd',
              border: '1px solid #c8bcad',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#554133',
              cursor: 'pointer',
            }}
            data-testid="update-later-btn"
          >
            Daha Sonra
          </button>

          {!downloadComplete ? (
            <button
              type="button"
              onClick={startDownload}
              disabled={downloading}
              style={{
                padding: '6px 16px',
                backgroundColor: downloading ? '#a58e7b' : '#7a5a3c',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: downloading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              data-testid="update-download-btn"
            >
              <Download size={14} /> {downloading ? 'İndiriliyor...' : 'Şimdi İndir'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestart}
              style={{
                padding: '6px 16px',
                backgroundColor: '#2e7d32',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              data-testid="update-restart-btn"
            >
              <CheckCircle size={14} /> Yeniden Başlat ve Yükle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateNotificationModal;
