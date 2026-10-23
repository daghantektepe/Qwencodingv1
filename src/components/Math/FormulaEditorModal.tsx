import React, { useState, useEffect } from 'react';
import { katexRenderer } from '../../services/math/katexRenderer';

interface FormulaEditorModalProps {
  isOpen: boolean;
  initialLatex?: string;
  initialIsBlock?: boolean;
  onSave: (latex: string, isBlock: boolean) => void;
  onClose: () => void;
}

export const FormulaEditorModal: React.FC<FormulaEditorModalProps> = ({
  isOpen,
  initialLatex = 'E = mc^2',
  initialIsBlock = true,
  onSave,
  onClose,
}) => {
  const [latex, setLatex] = useState(initialLatex);
  const [isBlock, setIsBlock] = useState(initialIsBlock);
  const [showMathML, setShowMathML] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLatex(initialLatex);
      setIsBlock(initialIsBlock);
    }
  }, [isOpen, initialLatex, initialIsBlock]);

  if (!isOpen) return null;

  const insertSnippet = (snippet: string) => {
    setLatex((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!latex.trim()) return;
    onSave(latex.trim(), isBlock);
    onClose();
  };

  const renderedHtml = katexRenderer.renderToHtml(latex || '...', isBlock);
  const mathML = katexRenderer.renderToMathML(latex || '...', isBlock);

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="LaTeX Formül Düzenleyici"
      data-testid="formula-editor-modal"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl text-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📐</span>
            <div>
              <h2 className="text-base font-semibold text-white">
                LaTeX / KaTeX Matematik Formülü
              </h2>
              <p className="text-xs text-slate-400">
                Satır içi veya blok akademik formül yazıcı
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Display Mode Toggle */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setIsBlock(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isBlock ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Blok Formül ($$ ... $$)
            </button>
            <button
              type="button"
              onClick={() => setIsBlock(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                !isBlock ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satır İçi ($ ... $)
            </button>
          </div>

          {/* Quick Snippets Toolbar */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Hızlı Semboller ve Şablonlar</label>
            <div className="flex flex-wrap gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => insertSnippet('\\frac{a}{b}')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                a/b
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\\sqrt{x}')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                √x
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('x^{2}')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                x²
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('x_{i}')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                xᵢ
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\\sum_{i=1}^{n}')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                ∑
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\\int_{a}^{b}')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                ∫
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\\pi')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                π
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\\alpha')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                α
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\\pm')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                ±
              </button>
              <button
                type="button"
                onClick={() => insertSnippet('\\infty')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
              >
                ∞
              </button>
            </div>
          </div>

          {/* LaTeX Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">LaTeX Kodu</label>
              <button
                type="button"
                onClick={() => setShowMathML(!showMathML)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {showMathML ? 'MathML Gizle' : 'MathML Göster'}
              </button>
            </div>
            <textarea
              rows={3}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="LaTeX matematiksel ifade yazın..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-500 resize-none shadow-inner"
            />
          </div>

          {/* MathML Display (Toggle) */}
          {showMathML && (
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400 overflow-x-auto max-h-24">
              {mathML}
            </div>
          )}

          {/* Live Preview */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 block">Canlı Önizleme</label>
            <div
              className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center min-h-[70px]"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-900/30"
            >
              Formülü Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormulaEditorModal;
