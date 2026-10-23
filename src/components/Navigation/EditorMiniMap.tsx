import React, { useRef, useMemo } from 'react';

interface EditorMiniMapProps {
  text: string;
  currentLine?: number;
  scrollPercent?: number; // 0 - 100
  onScrollChange?: (percent: number) => void;
  className?: string;
}

export const EditorMiniMap: React.FC<EditorMiniMapProps> = ({
  text,
  currentLine = 1,
  scrollPercent = 0,
  onScrollChange,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => {
    if (!text) return [];
    return text.split('\n');
  }, [text]);

  const totalLines = lines.length || 1;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current || !onScrollChange) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percent = Math.max(0, Math.min(100, (clickY / rect.height) * 100));
    onScrollChange(percent);
  };

  const cursorLinePercent = Math.min(100, Math.max(0, (currentLine / totalLines) * 100));

  return (
    <div
      ref={mapRef}
      onClick={handleClick}
      className={`editor-minimap w-14 bg-slate-950/70 hover:bg-slate-950 border-l border-slate-800/80 p-1 relative cursor-pointer select-none flex flex-col justify-between overflow-hidden transition-colors ${className}`}
      data-testid="editor-minimap"
      title="Mini Metin Haritası (Tıklayarak Kaydır)"
    >
      {/* Micro Lines Canvas/Bars */}
      <div className="w-full flex-1 flex flex-col gap-[2px] overflow-hidden py-1">
        {lines.slice(0, 120).map((line, idx) => {
          const isHeading = /^#{1,6}\s+/.test(line) || /^<h[1-6]/i.test(line);
          const isBlank = line.trim().length === 0;
          const lengthRatio = Math.min(100, Math.max(15, (line.length / 80) * 100));

          let barColor = 'bg-slate-700/60';
          if (isHeading) barColor = 'bg-cyan-400';
          else if (isBlank) barColor = 'bg-transparent';

          return (
            <div
              key={idx}
              className={`h-[2px] rounded-full transition-all ${barColor}`}
              style={{ width: `${lengthRatio}%` }}
            />
          );
        })}
      </div>

      {/* Viewport Lens Overlay */}
      <div
        className="absolute left-0 right-0 border-y border-cyan-500/70 bg-cyan-500/10 pointer-events-none transition-all duration-75"
        style={{
          top: `${Math.min(85, scrollPercent)}%`,
          height: '18%',
        }}
        data-testid="minimap-viewport-lens"
      />

      {/* Current Cursor Line Indicator */}
      <div
        className="absolute left-0 right-0 h-[1.5px] bg-amber-400 pointer-events-none"
        style={{ top: `${cursorLinePercent}%` }}
        data-testid="minimap-cursor-indicator"
      />

      {/* Footer line count */}
      <div className="text-[9px] font-mono text-slate-500 text-center border-t border-slate-800 pt-0.5">
        {totalLines}s
      </div>
    </div>
  );
};

export default EditorMiniMap;
