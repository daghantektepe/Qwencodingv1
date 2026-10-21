import React, { useState } from 'react';
import cryptoVault from '../../services/security/cryptoVault';

export interface LockScreenProps {
  onUnlockSuccess?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlockSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Lütfen kasanın anahtar parolasını girin.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await cryptoVault.unlockVault(password);
      if (success) {
        setPassword('');
        if (onUnlockSuccess) {
          onUnlockSuccess();
        }
      } else {
        setError('Hatalı parola! Şifreli kasaya erişim reddedildi.');
      }
    } catch {
      setError('Kilit açılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lockscreen-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '380px',
          maxWidth: '90%',
          backgroundColor: '#1e293b',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          border: '1px solid #334155',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
        <h2 id="lockscreen-title" style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600 }}>
          Şifreli Proje Kasası
        </h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#94a3b8' }}>
          Bu proje sıfır-bilgi AES-256 şifreleme ile korunmaktadır. Devam etmek için parolanızı girin.
        </p>

        <form onSubmit={handleUnlock}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              placeholder="Ana Parola veya PIN"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Ana Parola"
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: '16px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'background-color 0.2s',
            }}
          >
            {isLoading ? 'Çözülüyor...' : 'Kilidi Aç'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LockScreen;
