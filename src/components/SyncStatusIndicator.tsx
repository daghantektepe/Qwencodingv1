import React from 'react';
import type { SyncStatus } from '../types/sync';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  peerCount?: number;
  lastSynced?: number | null;
  onSyncNow?: () => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  peerCount = 0,
  lastSynced,
  onSyncNow,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'synced':
        return { label: 'Senkronize', color: '#10b981', dotColor: '#34d399' };
      case 'syncing':
        return { label: 'Senkronize ediliyor...', color: '#3b82f6', dotColor: '#60a5fa' };
      case 'offline':
        return { label: 'Çevrimdışı Mod', color: '#6b7280', dotColor: '#9ca3af' };
      case 'conflict':
        return { label: 'Çatışma Çözüldü', color: '#f59e0b', dotColor: '#fbbf24' };
      case 'error':
        return { label: 'Senkronizasyon Hatası', color: '#ef4444', dotColor: '#f87171' };
      default:
        return { label: 'Bilinmiyor', color: '#9ca3af', dotColor: '#d1d5db' };
    }
  };

  const badge = getBadgeConfig();

  return (
    <div
      role="status"
      aria-label="Senkronizasyon Durumu"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 10px',
        borderRadius: '9999px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        fontSize: '12px',
        fontWeight: 500,
        color: '#e5e7eb',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: badge.dotColor,
          boxShadow: `0 0 6px ${badge.dotColor}`,
        }}
      />
      <span>{badge.label}</span>
      {peerCount > 0 && (
        <span
          style={{
            marginLeft: '4px',
            padding: '1px 6px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '9999px',
            fontSize: '11px',
          }}
        >
          {peerCount} eş
        </span>
      )}
      {onSyncNow && status === 'offline' && (
        <button
          onClick={onSyncNow}
          style={{
            marginLeft: '6px',
            background: 'none',
            border: 'none',
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: '11px',
            textDecoration: 'underline',
          }}
        >
          Şimdi Dene
        </button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
