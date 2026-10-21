import React, { useState } from 'react';
import epubBuilder, { EpubBuildResult } from '../../services/publish/epubBuilder';
import { EpubMetadata, EpubChapter } from '../../services/publish/epubMetadata';

export interface EpubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters?: EpubChapter[];
  onExportSuccess?: (result: EpubBuildResult) => void;
}

export const EpubSettingsModal: React.FC<EpubSettingsModalProps> = ({
  isOpen,
  onClose,
  chapters = [],
  onExportSuccess,
}) => {
  const [title, setTitle] = useState('Yeni E-Kitap');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [language, setLanguage] = useState('tr');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Lütfen e-kitap başlığını girin.');
      return;
    }

    setIsBuilding(true);
    setError(null);

    const metadata: EpubMetadata = {
      title,
      author: author || 'Bilinmeyen Yazar',
      publisher,
      language,
      isbn,
      description,
    };

    const dummyChapters: EpubChapter[] =
      chapters.length > 0
        ? chapters
        : [
            {
              id: 'sample-ch1',
              title: '1. Bölüm',
              content: 'Örnek bölüm metni buraya gelecek...',
              order: 1,
            },
          ];

    const result = await epubBuilder.buildEpub(metadata, dummyChapters);
    setIsBuilding(false);

    if (result.success) {
      if (onExportSuccess) {
        onExportSuccess(result);
      }
      onClose();
    } else {
      setError(result.error || 'EPUB derleme başarısız oldu.');
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
        aria-labelledby="epub-modal-title"
        style={{
          width: '520px',
          maxWidth: '92vw',
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          border: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="epub-modal-title" style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📚</span> EPUB 3 E-Kitap Yayıncılığı (KDP / Apple Books)
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

        {error && (
          <div
            role="alert"
            style={{
              padding: '8px 12px',
              marginBottom: '14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleBuild}>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="epub-title-input" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#cbd5e1' }}>
              Kitap Başlığı *
            </label>
            <input
              id="epub-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#0f172a',
                color: '#fff',
                border: '1px solid #475569',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#cbd5e1' }}>
                Yazar Adı
              </label>
              <input
                type="text"
                placeholder="Örn: Lev Tolstoy"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  border: '1px solid #475569',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#cbd5e1' }}>
                Yayınevi / İmprint
              </label>
              <input
                type="text"
                placeholder="Örn: Bağımsız Yazar"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  border: '1px solid #475569',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#cbd5e1' }}>
                Kitap Dili
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  border: '1px solid #475569',
                }}
              >
                <option value="tr">Türkçe (tr)</option>
                <option value="en">English (en)</option>
                <option value="de">Deutsch (de)</option>
                <option value="fr">Français (fr)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#cbd5e1' }}>
                ISBN (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="978-..."
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  border: '1px solid #475569',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#cbd5e1' }}>
              Kitap Açıklaması / Arka Kapak
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E-kitap mağazalarında görüntülenecek özet..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#0f172a',
                color: '#fff',
                border: '1px solid #475569',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
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
              disabled={isBuilding}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#3b82f6',
                color: '#fff',
                cursor: isBuilding ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {isBuilding ? 'Paketleniyor...' : '📦 Standart EPUB 3 Üret'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EpubSettingsModal;
