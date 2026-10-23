import React, { useState, useRef } from 'react';
import { mermaidService } from '../../services/diagrams/mermaidService';

interface MermaidRendererProps {
  code: string;
  onCodeChange?: (newCode: string) => void;
  editable?: boolean;
  showToolbar?: boolean;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  code,
  onCodeChange,
  editable = true,
  showToolbar = true,
}) => {
  const [internalCode, setInternalCode] = useState(code);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'split'>('preview');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCode = onCodeChange ? code : internalCode;

  const handleTextChange = (val: string) => {
    setInternalCode(val);
    onCodeChange?.(val);
  };

  const validation = mermaidService.validateSyntax(currentCode);

  let renderedSvg = '';
  if (validation.isValid) {
    try {
      renderedSvg = mermaidService.renderSvg(currentCode);
    } catch (e: any) {
      validation.isValid = false;
      validation.error = e.message;
    }
  }

  const handleExportSvg = () => {
    if (!renderedSvg) return;
    const blob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `openscriv-diagram-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    if (!renderedSvg) return;
    const svgBlob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 800;
      canvas.height = img.height || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `openscriv-diagram-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(pngUrl);
          }
        });
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const templates: Record<string, string> = {
    flowchart: `graph TD\n  Giris[Giriş Bölümü] --> Olay{Beklenmedik Olay}\n  Olay -->|Karar A| Donusum[Karakter Dönüşümü]\n  Olay -->|Karar B| Yuzlesme[Final Yüzleşmesi]\n  Donusum --> Sonuc[Nihai Sonuç]\n  Yuzlesme --> Sonuc`,
    sequence: `sequenceDiagram\n  participant Kahraman\n  participant Rehber\n  participant Dusman\n  Rehber->>Kahraman: Görevi açıklar\n  Kahraman->>Dusman: Meydan okur\n  Dusman->>Kahraman: Karşı saldırı`,
    pie: `pie title "Hikaye Karakter Rol Dağılımı"\n  "Baş Kahramanlar" : 45\n  "Yan Karakterler" : 30\n  "Antagonistler" : 25`,
  };

  return (
    <div
      className="mermaid-renderer flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-200"
      data-testid="mermaid-renderer"
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'preview' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Önizleme
            </button>
            {editable && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'code' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kod Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('split')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'split' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  İkili
                </button>
              </>
            )}
          </div>

          {/* Quick template dropdown */}
          {editable && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Şablon:</span>
              <button
                type="button"
                onClick={() => handleTextChange(templates.flowchart)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300"
              >
                Akış Şeması
              </button>
              <button
                type="button"
                onClick={() => handleTextChange(templates.sequence)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300"
              >
                Diyalog / Sekans
              </button>
              <button
                type="button"
                onClick={() => handleTextChange(templates.pie)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300"
              >
                Pasta Grafik
              </button>
            </div>
          )}

          {/* Zoom and Exports */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 text-xs"
              title="Uzaklaştır"
            >
              🔍-
            </button>
            <span className="text-[11px] text-slate-400 w-10 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 text-xs"
              title="Yakınlaştır"
            >
              🔍+
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="px-2 py-0.5 hover:bg-slate-800 rounded text-[10px] text-slate-400"
            >
              Sıfırla
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            <button
              type="button"
              data-testid="export-svg-btn"
              onClick={handleExportSvg}
              className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded text-[11px] transition-colors"
            >
              SVG
            </button>
            <button
              type="button"
              data-testid="export-png-btn"
              onClick={handleExportPng}
              className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded text-[11px] transition-colors"
            >
              PNG
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className={`grid ${activeTab === 'split' ? 'grid-cols-2' : 'grid-cols-1'} flex-1 min-h-[300px]`}>
        {/* Editor Pane */}
        {(activeTab === 'code' || activeTab === 'split') && (
          <div className="p-3 bg-slate-950 border-r border-slate-800 flex flex-col">
            <textarea
              value={currentCode}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Mermaid diyagram kodunu buraya yazın..."
              className="w-full h-full min-h-[260px] bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 resize-none shadow-inner"
            />
          </div>
        )}

        {/* Preview Pane */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div
            ref={containerRef}
            className="p-4 flex items-center justify-center overflow-auto bg-slate-950 relative"
          >
            {!validation.isValid ? (
              <div
                data-testid="mermaid-error"
                className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex flex-col gap-1 max-w-md text-center"
              >
                <div className="font-semibold text-rose-200 flex items-center justify-center gap-1.5">
                  <span>⚠️</span> Mermaid Sözdizimi Hatası
                </div>
                <div>{validation.error}</div>
              </div>
            ) : (
              <div
                data-testid="mermaid-svg-container"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                className="transition-transform duration-150 flex items-center justify-center w-full max-w-2xl"
                dangerouslySetInnerHTML={{ __html: renderedSvg }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MermaidRenderer;
