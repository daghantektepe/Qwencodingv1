import React, { useState } from 'react';
import cryptoVault from '../../services/security/cryptoVault';

export interface VaultSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLockNow?: () => void;
}

export const VaultSettingsDialog: React.FC<VaultSettingsDialogProps> = ({
  isOpen,
  onClose,
  onLockNow,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [autoLockMinutes, setAutoLockMinutes] = useState('5');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setFeedback({ message: 'Lütfen geçerli bir parola belirleyin.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ message: 'Parolalar birbiriyle eşleşmiyor!', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setFeedback({ message: 'Parola en az 6 karakter uzunluğunda olmalıdır.', type: 'error' });
      return;
    }

    cryptoVault.setMasterPassword(password);
    const ms = parseInt(autoLockMinutes, 10) * 60 * 1000;
    if (ms > 0) {
      cryptoVault.setupInactivityTimer(ms, () => {
        if (onLockNow) onLockNow();
      });
    }

    setFeedback({ message: 'Kasa anahtarı ve otomatik kilit ayarları başarıyla kaydedildi!', type: 'success' });
    setPassword('');
    setConfirmPassword('');
  };

  const handleImmediateLock = () => {
    cryptoVault.lockVault();
    onClose();
    if (onLockNow) {
      onLockNow();
    }
  };

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-settings-title"
        style={{
          width: '480px',
          maxWidth: '90vw',
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          borderRadius: '10px',
          padding: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          border: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="vault-settings-title" style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛡️</span> Güvenlik & Kasa Ayarları
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '20px' }}>
          AES-256-GCM ve PBKDF2 ile projenizi diske yazılırken askeri düzeyde şifreleyin.
        </p>

        {feedback && (
          <div
            role="alert"
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${feedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
              color: feedback.type === 'success' ? '#86efac' : '#fca5a5',
              fontSize: '0.9rem',
            }}
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSavePassword}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#cbd5e1' }}>
              Yeni Anahtar Parola
            </label>
            <input
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#fff',
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#cbd5e1' }}>
              Parolayı Onayla
            </label>
            <input
              type="password"
              placeholder="Parolayı tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#fff',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#cbd5e1' }}>
              Hareketsizlik Sonrası Otomatik Kilitleme
            </label>
            <select
              value={autoLockMinutes}
              onChange={(e) => setAutoLockMinutes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#fff',
              }}
            >
              <option value="1">1 dakika hareketsizlikte</option>
              <option value="5">5 dakika hareketsizlikte (Önerilen)</option>
              <option value="15">15 dakika hareketsizlikte</option>
              <option value="30">30 dakika hareketsizlikte</option>
              <option value="0">Devre Dışı</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {cryptoVault.hasMasterPassword() && (
              <button
                type="button"
                onClick={handleImmediateLock}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                }}
              >
                🔒 Şimdi Kilitle
              </button>
            )}

            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaultSettingsDialog;
