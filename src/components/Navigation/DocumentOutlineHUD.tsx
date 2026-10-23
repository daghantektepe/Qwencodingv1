import React, { useState, useMemo } from 'react';

export interface OutlineHeading {
  id: string;
  level: number;
  text: string;
  line: number;
  offset: number;
  estimatedWords?: number;
}

interface DocumentOutlineHUDProps {
  content: string;
  onNavigateToHeading?: (heading: OutlineHeading) => void;
  activeHeadingId?: string;
  className?: string;
}

export function extractHeadings(content: string): OutlineHeading[] {
  if (!content) return [];

  const headings: OutlineHeading[] = [];
  const lines = content.split('\n');
  let currentOffset = 0;

  lines.forEach((lineText, lineIdx) => {
    // 1. Markdown başlıkları (# Başlık, ## Başlık)
    const mdMatch = lineText.match(/^(#{1,6})\s+(.+)$/);
    if (mdMatch) {
      const level = mdMatch[1].length;
      const text = mdMatch[2].trim().replace(/[#*`_]/g, '');
      const id = `heading-${lineIdx}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      headings.push({
        id,
        level,
        text,
        line: lineIdx + 1,
        offset: currentOffset,
      });
    } else {
      // 2. HTML başlıkları (<h1>Başlık</h1> vb.)
      const htmlMatch = lineText.match(/<h([1-6])[^>]*>(.*?)<\/h\1>/i);
      if (htmlMatch) {
        const level = parseInt(htmlMatch[1], 10);
        const text = htmlMatch[2].replace(/<[^>]+>/g, '').trim();
        const id = `heading-html-${lineIdx}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        headings.push({
          id,
          level,
          text,
          line: lineIdx + 1,
          offset: currentOffset,
        });
      }
    }
    currentOffset += lineText.length + 1;
  });

  return headings;
}

export const DocumentOutlineHUD: React.FC<DocumentOutlineHUDProps> = ({
  content,
  onNavigateToHeading,
  activeHeadingId,
  className = '',
}) => {
  const [filter, setFilter] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const headings = useMemo(() => extractHeadings(content), [content]);

  const filteredHeadings = useMemo(() => {
    if (!filter.trim()) return headings;
    return headings.filter((h) => h.text.toLowerCase().includes(filter.toLowerCase()));
  }, [headings, filter]);

  if (isCollapsed) {
    return (
      <div className={`p-2 bg-slate-900 border border-slate-800 rounded-xl ${className}`}>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1"
          title="Başlık Haritasını Genişlet"
        >
          <span>📑</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`document-outline-hud w-64 bg-slate-950/90 border border-slate-800 rounded-2xl p-3 shadow-2xl text-slate-200 flex flex-col gap-2.5 text-xs backdrop-blur-md ${className}`}
      data-testid="document-outline-hud"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <span>📑</span>
          <span>İçindekiler Haritası</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded-full font-mono text-cyan-400">
            {headings.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-[11px]"
          title="Daralt"
        >
          ✕
        </button>
      </div>

      {/* Filter Input */}
      {headings.length > 5 && (
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Başlıklarda ara..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      )}

      {/* Headings List */}
      <div className="flex-1 overflow-y-auto max-h-72 space-y-1 pr-1">
        {filteredHeadings.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-[11px]">
            {headings.length === 0 ? 'Bu belgede henüz başlık (H1-H3) bulunmuyor.' : 'Eşleşen başlık yok.'}
          </div>
        ) : (
          filteredHeadings.map((h) => {
            const isActive = activeHeadingId === h.id;
            const indentClass =
              h.level === 1 ? 'pl-1 font-bold' : h.level === 2 ? 'pl-3 font-medium' : 'pl-5 text-slate-400';

            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onNavigateToHeading?.(h)}
                className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between gap-2 group text-xs ${indentClass} ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                    : 'hover:bg-slate-900 text-slate-300 hover:text-white'
                }`}
                title={`Satır ${h.line}`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] text-cyan-500 font-mono shrink-0">
                    H{h.level}
                  </span>
                  <span className="truncate">{h.text}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  :{h.line}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DocumentOutlineHUD;
