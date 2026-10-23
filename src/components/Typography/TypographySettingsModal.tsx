import React, { useState, useEffect } from 'react';
import {
  typographyEngine,
  TypographyOptions,
  QuoteStyle,
} from '../../services/typography/smartPunctuation';

interface TypographySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStandardizeProject?: () => void;
}

export const TypographySettingsModal: React.FC<TypographySettingsModalProps> = ({
  isOpen,
  onClose,
  onStandardizeProject,
}) => {
  const [settings, setSettings] = useState<TypographyOptions>(typographyEngine.getSettings());
  const [testText, setTestText] = useState('"Merhaba dünya..." Ali\'nin kalemi -- 1/2 elma');
  const [standardizeMsg, setStandardizeMsg] = useState('');

  useEffect(() => {
    setSettings(typographyEngine.getSettings());
    const unsub = typographyEngine.subscribe((opts) => setSettings(opts));
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleToggle = (key: keyof TypographyOptions) => {
    const updated = { [key]: !settings[key] };
    typographyEngine.updateSettings(updated);
  };

  const handleStyleChange = (style: QuoteStyle) => {
    typographyEngine.updateSettings({ quoteStyle: style });
  };

  const handleStandardizeClick = () => {
    if (onStandardizeProject) {
      onStandardizeProject();
      setStandardizeMsg('Tüm proje tipografisi başarıyla standartlaştırıldı!');
      setTimeout(() => setStandardizeMsg(''), 4000);
    }
  };

  const previewResult = typographyEngine.formatPunctuation(testText, settings);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Tipografi ve Akıllı Noktalama Ayarları"
      data-testid="typography-settings-modal"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl text-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✨</span>
            <div>
              <h2 className="text-base font-semibold text-white">
                Tipografi ve Akıllı Noktalama
              </h2>
              <p className="text-xs text-slate-400">
                Yazım sırasında akıllı tırnak, tire ve kesme işareti standartları
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
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Ana Açma/Kapatma Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-white block">
                Akıllı Tipografi Motoru
              </span>
              <span className="text-[11px] text-slate-400">
                Yazarken ve derlerken kuralları otomatik uygula
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('enabled')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                settings.enabled
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {settings.enabled ? 'Aktif' : 'Devre Dışı'}
            </button>
          </div>

          {/* Tırnak Stili Seçimi */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Tırnak ve Alıntı Stili
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStyleChange('turkish')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.quoteStyle === 'turkish' || settings.quoteStyle === 'curly'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-base font-serif mb-0.5">“Kıvrık”</div>
                <div className="text-[10px]">Türkçe / İngilizce</div>
              </button>

              <button
                type="button"
                onClick={() => handleStyleChange('guillemets')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.quoteStyle === 'guillemets'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-base font-serif mb-0.5">«Köşeli»</div>
                <div className="text-[10px]">Kitabi / Fransızca</div>
              </button>

              <button
                type="button"
                onClick={() => handleStyleChange('german')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.quoteStyle === 'german'
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-base font-serif mb-0.5">„Alttan“</div>
                <div className="text-[10px]">Almanca Standart</div>
              </button>
            </div>
          </div>

          {/* İnce Ayarlar / Checkbox'lar */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Etkin Tipografi Kuralları
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smartQuotes}
                onChange={() => handleToggle('smartQuotes')}
                className="rounded border-slate-700 text-cyan-600 focus:ring-0"
              />
              <div className="text-xs">
                <span className="text-white block font-medium">Akıllı Çift Tırnaklar</span>
                <span className="text-[11px] text-slate-400">Düz " yerine doğru kıvrık tırnak</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smartApostrophes}
                onChange={() => handleToggle('smartApostrophes')}
                className="rounded border-slate-700 text-cyan-600 focus:ring-0"
              />
              <div className="text-xs">
                <span className="text-white block font-medium">Akıllı Kesme İşareti</span>
                <span className="text-[11px] text-slate-400">Ali'nin yerine Ali’nin</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smartDashes}
                onChange={() => handleToggle('smartDashes')}
                className="rounded border-slate-700 text-cyan-600 focus:ring-0"
              />
              <div className="text-xs">
                <span className="text-white block font-medium">Uzun Tire (Em-dash)</span>
                <span className="text-[11px] text-slate-400">Çift tire (-- veya ---) yerine — karakteri</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smartEllipses}
                onChange={() => handleToggle('smartEllipses')}
                className="rounded border-slate-700 text-cyan-600 focus:ring-0"
              />
              <div className="text-xs">
                <span className="text-white block font-medium">Tek Karakter Üç Nokta (Elipsis)</span>
                <span className="text-[11px] text-slate-400">... yerine tek elipsis karakteri …</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smartFractions}
                onChange={() => handleToggle('smartFractions')}
                className="rounded border-slate-700 text-cyan-600 focus:ring-0"
              />
              <div className="text-xs">
                <span className="text-white block font-medium">Tipografik Kesirler</span>
                <span className="text-[11px] text-slate-400">1/2, 1/4 yerine ½, ¼ sembolleri</span>
              </div>
            </label>
          </div>

          {/* Canlı Önizleme Alanı */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <label className="text-[11px] font-medium text-cyan-400 block">
              Canlı Önizleme / Test Alanı
            </label>
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
            />
            <div className="pt-1 text-xs text-slate-300 font-serif border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-sans uppercase mr-1">Sonuç:</span>
              {previewResult}
            </div>
          </div>

          {/* Toplu Standartlaştırma */}
          {onStandardizeProject && (
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleStandardizeClick}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
              >
                <span>🪄</span> Tüm Proje Metinlerini Standartlaştır
              </button>
              {standardizeMsg && (
                <p className="text-xs text-emerald-400 text-center animate-pulse">
                  {standardizeMsg}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypographySettingsModal;
