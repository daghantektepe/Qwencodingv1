import React, { useState, useMemo } from 'react';
import {
  calculatePagination,
  PaginationOptions,
  PrintChapterInput,
  PrintPage,
  PAGE_SIZES,
  PageFormat,
} from '../../services/publish/paginationLayout';
import pdfPrintEngine from '../../services/publish/pdfPrintEngine';

export interface PdfPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: PrintChapterInput[];
  initialOptions?: PaginationOptions;
}

export const PdfPrintPreview: React.FC<PdfPrintPreviewProps> = ({
  isOpen,
  onClose,
  chapters,
  initialOptions,
}) => {
  const [format, setFormat] = useState<PageFormat>(initialOptions?.format || 'trade-pb');
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const pages = useMemo(() => {
    return calculatePagination(chapters, {
      ...initialOptions,
      format,
    });
  }, [chapters, initialOptions, format]);

  // Sayfaları ikişer ikişer çiftlere (spreads) ayır
  const spreads = useMemo(() => {
    const res: [PrintPage | null, PrintPage | null][] = [];
    for (let i = 0; i < pages.length; i += 2) {
      res.push([pages[i] || null, pages[i + 1] || null]);
    }
    return res;
  }, [pages]);

  if (!isOpen) return null;

  const currentSpread = spreads[spreadIndex] || [null, null];
  const [leftPage, rightPage] = currentSpread;

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    await pdfPrintEngine.generatePrintPdf(chapters, {
      ...initialOptions,
      format,
    });
    setIsExporting(false);
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
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-preview-title"
        style={{
          width: '940px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          border: '1px solid #334155',
          overflow: 'hidden',
        }}
      >
        {/* Üst Bar */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 id="print-preview-title" style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📖</span> Çift Sayfa Matbaa Önizleme (Book Spread)
            </h2>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as PageFormat)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: '#0f172a',
                color: '#fff',
                border: '1px solid #475569',
                fontSize: '0.85rem',
              }}
            >
              <option value="trade-pb">Trade Paperback (6x9 in)</option>
              <option value="pocket">Pocket Book (5x8 in)</option>
              <option value="a5">A5 Kitap (148x210 mm)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              style={{
                padding: '6px 14px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
            >
              {isExporting ? 'Hazırlanıyor...' : '🖨️ Matbaa PDF İndir'}
            </button>
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
        </div>

        {/* İkili Kitap Görünümü (Dual-Page Book Spread) */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            overflowY: 'auto',
            backgroundColor: '#020617',
          }}
        >
          {/* Sol Sayfa (Verso) */}
          <div
            style={{
              width: '380px',
              height: '520px',
              backgroundColor: '#fffdf9',
              color: '#1a1a1a',
              borderRadius: '4px 0 0 4px',
              padding: '24px 18px 24px 28px', // Cilt payı sağda
              boxShadow: 'inset -15px 0 20px -10px rgba(0,0,0,0.15), -4px 4px 12px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'Georgia, serif',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              position: 'relative',
            }}
          >
            {leftPage ? (
              <>
                <div style={{ fontSize: '0.72rem', color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
                  {leftPage.headerText}
                </div>
                <div style={{ flex: 1, overflow: 'hidden', margin: '12px 0' }}>
                  {leftPage.isChapterStart && (
                    <h3 style={{ fontSize: '1rem', textAlign: 'center', margin: '16px 0 12px 0', fontFamily: 'sans-serif' }}>
                      {leftPage.chapterTitle}
                    </h3>
                  )}
                  {leftPage.paragraphs.map((p, idx) => (
                    <p key={idx} style={{ margin: '0 0 8px 0', textIndent: '1.2em' }}>
                      {p}
                    </p>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', textAlign: 'left', color: '#444' }}>
                  {leftPage.pageNumberFormatted}
                </div>
              </>
            ) : (
              <div style={{ margin: 'auto', color: '#aaa', fontStyle: 'italic' }}>[Boş Sayfa]</div>
            )}
          </div>

          {/* Kitap Sırtı / Cilt Çizgisi (Book Spine Spine / Gutter) */}
          <div
            style={{
              width: '4px',
              height: '520px',
              backgroundColor: '#1e293b',
              boxShadow: '0 0 8px rgba(0,0,0,0.8)',
            }}
          />

          {/* Sağ Sayfa (Recto) */}
          <div
            style={{
              width: '380px',
              height: '520px',
              backgroundColor: '#fffdf9',
              color: '#1a1a1a',
              borderRadius: '0 4px 4px 0',
              padding: '24px 28px 24px 18px', // Cilt payı solda
              boxShadow: 'inset 15px 0 20px -10px rgba(0,0,0,0.15), 4px 4px 12px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'Georgia, serif',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              position: 'relative',
            }}
          >
            {rightPage ? (
              <>
                <div style={{ fontSize: '0.72rem', color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
                  {rightPage.headerText}
                </div>
                <div style={{ flex: 1, overflow: 'hidden', margin: '12px 0' }}>
                  {rightPage.isChapterStart && (
                    <h3 style={{ fontSize: '1rem', textAlign: 'center', margin: '16px 0 12px 0', fontFamily: 'sans-serif' }}>
                      {rightPage.chapterTitle}
                    </h3>
                  )}
                  {rightPage.paragraphs.map((p, idx) => (
                    <p key={idx} style={{ margin: '0 0 8px 0', textIndent: '1.2em' }}>
                      {p}
                    </p>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', textAlign: 'right', color: '#444' }}>
                  {rightPage.pageNumberFormatted}
                </div>
              </>
            ) : (
              <div style={{ margin: 'auto', color: '#aaa', fontStyle: 'italic' }}>[Son Sayfa]</div>
            )}
          </div>
        </div>

        {/* Alt Gezinme Çubuğu */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#1e293b',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => setSpreadIndex((prev) => Math.max(0, prev - 1))}
            disabled={spreadIndex === 0}
            style={{
              padding: '6px 14px',
              backgroundColor: '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: spreadIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: spreadIndex === 0 ? 0.5 : 1,
            }}
          >
            ◀ Önceki Çift Sayfa
          </button>

          <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
            Çift Sayfa {spreadIndex + 1} / {Math.max(1, spreads.length)} (Toplam {pages.length} sayfa)
          </span>

          <button
            onClick={() => setSpreadIndex((prev) => Math.min(spreads.length - 1, prev + 1))}
            disabled={spreadIndex >= spreads.length - 1}
            style={{
              padding: '6px 14px',
              backgroundColor: '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: spreadIndex >= spreads.length - 1 ? 'not-allowed' : 'pointer',
              opacity: spreadIndex >= spreads.length - 1 ? 0.5 : 1,
            }}
          >
            Sonraki Çift Sayfa ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfPrintPreview;
