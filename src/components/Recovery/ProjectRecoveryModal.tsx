/**
 * Project Recovery Modal Component
 * Phase 113: Çökme Koruması ve Otomatik Proje Kurtarma (CrashGuard & Recovery)
 */

import React from 'react';
import { AlertTriangle, Check, Trash2, Clock, FileText } from 'lucide-react';
import { CrashGuardService, JournalEntry } from '../../services/recovery/crashGuardService';

export interface ProjectRecoveryModalProps {
  entries?: JournalEntry[];
  onRecovered?: () => void;
  onDismiss?: () => void;
}

export const ProjectRecoveryModal: React.FC<ProjectRecoveryModalProps> = ({
  entries = [],
  onRecovered,
  onDismiss,
}) => {
  const handleRecoverAll = () => {
    CrashGuardService.clearJournal();
    if (onRecovered) onRecovered();
  };

  const handleDismiss = () => {
    CrashGuardService.clearJournal();
    if (onDismiss) onDismiss();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      data-testid="project-recovery-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#faf8f5',
          borderRadius: '12px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          border: '1px solid #e0c9a6',
        }}
      >
        {/* Banner */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#fef3c7',
            borderBottom: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertTriangle size={24} color="#d97706" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#92400e' }}>
              Kurtarılabilir Otomatik Kayıtlar Bulundu
            </div>
            <div style={{ fontSize: '12px', color: '#b45309' }}>
              Uygulamanın beklenmeyen bir şekilde kapandığı algılandı. Son 30 saniyelik metinleriniz korundu.
            </div>
          </div>
        </div>

        {/* Kurtarılacak Belgeler Listesi */}
        <div style={{ padding: '16px 20px', maxHeight: '240px', overflowY: 'auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b5443', marginBottom: '8px' }}>
            Kurtarılacak Belgeler ({entries.length}):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {entries.map((entry) => (
              <div
                key={entry.docId}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#f5eee3',
                  borderRadius: '6px',
                  border: '1px solid #e5d8c5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                }}
                data-testid={`recovery-item-${entry.docId}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#8a5a36" />
                  <span style={{ fontWeight: 600, color: '#382b22' }}>{entry.title || entry.docId}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8a7768', fontSize: '11px' }}>
                  <Clock size={12} />
                  <span>{new Date(entry.timestamp).toLocaleTimeString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#efe8dd',
            borderTop: '1px solid #d8cfc4',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '12px',
              color: '#991b1b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            data-testid="recovery-dismiss-btn"
          >
            <Trash2 size={13} /> Kayıtları Sil
          </button>

          <button
            type="button"
            onClick={handleRecoverAll}
            style={{
              padding: '8px 16px',
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
            data-testid="recovery-restore-btn"
          >
            <Check size={14} /> Tümünü Kurtar ve Projeye Yansıt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectRecoveryModal;
