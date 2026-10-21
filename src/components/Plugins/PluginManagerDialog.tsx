import React, { useState, useEffect } from 'react';
import pluginHost from '../../services/plugins/pluginHost';
import { OpenScrivPlugin, CustomTheme } from '../../types/plugins';

export interface PluginManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PluginManagerDialog: React.FC<PluginManagerDialogProps> = ({ isOpen, onClose }) => {
  const [plugins, setPlugins] = useState<OpenScrivPlugin[]>([]);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [themeJsonInput, setThemeJsonInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const refresh = () => {
      setPlugins(pluginHost.getLoadedPlugins());
      setCustomThemes(pluginHost.getCustomThemes());
    };

    refresh();
    const unsubscribe = pluginHost.subscribe(refresh);
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlugin = async (id: string) => {
    if (pluginHost.isPluginEnabled(id)) {
      await pluginHost.disablePlugin(id);
    } else {
      await pluginHost.enablePlugin(id);
    }
  };

  const handleImportTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeJsonInput.trim()) return;

    try {
      const theme = pluginHost.importCustomTheme(themeJsonInput);
      setFeedback(`"${theme.name}" teması başarıyla içe aktarıldı!`);
      setThemeJsonInput('');
    } catch (err: any) {
      setFeedback(`Hata: ${err.message || 'Geçersiz tema'}`);
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
        aria-labelledby="plugin-manager-title"
        style={{
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '85vh',
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          border: '1px solid #334155',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 id="plugin-manager-title" style={{ margin: 0, fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧩</span> Eklenti & Tema Yöneticisi
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

        {/* Eklentiler Bölümü */}
        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1rem', color: '#93c5fd', borderBottom: '1px solid #334155', paddingBottom: '6px', marginBottom: '12px' }}>
            Yüklü Eklentiler ({plugins.length})
          </h3>

          {plugins.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Şu anda yüklü eklenti bulunmuyor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plugins.map((plugin) => {
                const isEnabled = pluginHost.isPluginEnabled(plugin.metadata.id);
                return (
                  <div
                    key={plugin.metadata.id}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{plugin.metadata.name}</span>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#334155', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                          v{plugin.metadata.version}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                        {plugin.metadata.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        Geliştirici: {plugin.metadata.author}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTogglePlugin(plugin.metadata.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        backgroundColor: isEnabled ? '#22c55e' : '#475569',
                        color: '#ffffff',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      {isEnabled ? 'Aktif' : 'Devre Dışı'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Özel Temalar Bölümü (.osctheme) */}
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#93c5fd', borderBottom: '1px solid #334155', paddingBottom: '6px', marginBottom: '12px' }}>
            Özel Tema SDK (.osctheme İçe Aktar)
          </h3>

          {feedback && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: '12px',
                borderRadius: '6px',
                backgroundColor: feedback.startsWith('Hata') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                color: feedback.startsWith('Hata') ? '#fca5a5' : '#86efac',
                fontSize: '0.85rem',
              }}
            >
              {feedback}
            </div>
          )}

          <form onSubmit={handleImportTheme}>
            <textarea
              rows={3}
              placeholder='{"id": "cyberpunk", "name": "Cyberpunk Neon", "colors": { "bgPrimary": "#0a0a12", ... }}'
              value={themeJsonInput}
              onChange={(e) => setThemeJsonInput(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #475569',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                marginBottom: '10px',
              }}
            />
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
                fontSize: '0.9rem',
              }}
            >
              🎨 Temayı İçe Aktar ve Uygula
            </button>
          </form>

          {customThemes.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Yüklü Özel Temalar:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {customThemes.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => pluginHost.applyCustomTheme(ct.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #475569',
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    {ct.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#475569',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default PluginManagerDialog;
