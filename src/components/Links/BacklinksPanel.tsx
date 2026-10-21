import React, { useState, useEffect } from 'react';
import linkGraphEngine, { LinkReference } from '../../services/links/linkGraphEngine';

export interface BacklinksPanelProps {
  currentDocId: string;
  currentDocTitle: string;
  onNavigateToDocument?: (docId: string) => void;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  currentDocId,
  currentDocTitle,
  onNavigateToDocument,
}) => {
  const [backlinks, setBacklinks] = useState<LinkReference[]>([]);

  useEffect(() => {
    const refresh = () => {
      const links = linkGraphEngine.getBacklinks(currentDocTitle, currentDocId);
      setBacklinks(links);
    };

    refresh();
    const unsubscribe = linkGraphEngine.subscribe(refresh);
    return () => unsubscribe();
  }, [currentDocId, currentDocTitle]);

  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #334155',
        fontSize: '0.88rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔗</span> Geri Bağlantılar (Backlinks)
        </h4>
        <span
          style={{
            fontSize: '0.75rem',
            backgroundColor: '#334155',
            color: '#93c5fd',
            padding: '2px 8px',
            borderRadius: '10px',
            fontWeight: 600,
          }}
        >
          {backlinks.length}
        </span>
      </div>

      {backlinks.length === 0 ? (
        <p style={{ margin: '8px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
          Bu sahneye henüz başka bir dokümandan <code>[[{currentDocTitle || 'Başlık'}]]</code> referansı verilmemiş.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {backlinks.map((link, idx) => (
            <li
              key={idx}
              style={{
                backgroundColor: '#0f172a',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#60a5fa', fontSize: '0.85rem' }}>
                  {link.sourceDocTitle || link.sourceDocId}
                </span>
                {onNavigateToDocument && (
                  <button
                    onClick={() => onNavigateToDocument(link.sourceDocId)}
                    style={{
                      padding: '2px 8px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Git ↗
                  </button>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#cbd5e1',
                  fontStyle: 'italic',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '4px 6px',
                  borderRadius: '4px',
                }}
              >
                {link.contextSnippet}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BacklinksPanel;
