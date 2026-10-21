import React, { useState, useMemo, useRef, useCallback } from 'react';

export interface ScriveningsDocument {
  id: string;
  title: string;
  content: string;
  wordCount?: number;
}

export interface VirtualScriveningsProps {
  documents: ScriveningsDocument[];
  activeDocId?: string;
  onActiveDocChange?: (docId: string) => void;
  onContentChange?: (docId: string, newContent: string) => void;
  height?: number;
  estimatedDocHeight?: number;
  overscan?: number;
}

export const VirtualScrivenings: React.FC<VirtualScriveningsProps> = ({
  documents,
  activeDocId,
  onActiveDocChange,
  onContentChange,
  height = 700,
  estimatedDocHeight = 400,
  overscan = 2,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalCount = documents.length;
  const totalHeight = totalCount * estimatedDocHeight;

  // Windowing aralığı
  const startIndex = Math.max(0, Math.floor(scrollTop / estimatedDocHeight) - overscan);
  const endIndex = Math.min(
    totalCount - 1,
    Math.floor((scrollTop + height) / estimatedDocHeight) + overscan
  );

  const visibleDocs = useMemo(() => {
    const list: Array<{ doc: ScriveningsDocument; index: number; top: number }> = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (documents[i]) {
        list.push({
          doc: documents[i],
          index: i,
          top: i * estimatedDocHeight,
        });
      }
    }
    return list;
  }, [documents, startIndex, endIndex, estimatedDocHeight]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const top = e.currentTarget.scrollTop;
      setScrollTop(top);

      // Aktif dokümanı scroll pozisyonuna göre tespit et
      const currentIdx = Math.min(
        totalCount - 1,
        Math.max(0, Math.floor((top + height / 3) / estimatedDocHeight))
      );
      const currentDoc = documents[currentIdx];
      if (currentDoc && currentDoc.id !== activeDocId && onActiveDocChange) {
        onActiveDocChange(currentDoc.id);
      }
    },
    [totalCount, height, estimatedDocHeight, documents, activeDocId, onActiveDocChange]
  );

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height, overflowY: 'auto', position: 'relative' }}
      className="virtual-scrivenings w-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-serif"
      data-testid="virtual-scrivenings-container"
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        {visibleDocs.map(({ doc, top }) => {
          const isActive = doc.id === activeDocId;

          return (
            <div
              key={doc.id}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                minHeight: estimatedDocHeight - 20,
              }}
              className="px-8 py-6 max-w-3xl mx-auto"
              data-testid={`scrivenings-section-${doc.id}`}
            >
              {/* Scrivenings Bölüm Ayırıcı ve Başlık Çubuğu */}
              <div className="scrivenings-divider flex items-center justify-between gap-3 border-b-2 border-neutral-200 dark:border-neutral-750 pb-2 mb-4 font-sans select-none">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                    §
                  </span>
                  <h3
                    className={`text-sm font-semibold ${
                      isActive
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {doc.title}
                  </h3>
                </div>

                <div className="text-[11px] font-mono text-neutral-400">
                  {doc.wordCount !== undefined
                    ? `${doc.wordCount} kelime`
                    : `${doc.content.split(/\s+/).filter(Boolean).length} kelime`}
                </div>
              </div>

              {/* Doküman İçeriği / Düzenlenebilir Metin Alanı */}
              <textarea
                value={doc.content}
                onChange={(e) => onContentChange && onContentChange(doc.id, e.target.value)}
                placeholder="Metin yazın..."
                className="w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-none font-serif text-neutral-800 dark:text-neutral-200"
                rows={12}
                aria-label={`Bölüm İçeriği: ${doc.title}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualScrivenings;
