import React from 'react';
import { useProofreadingSpeech } from '../../hooks/useProofreadingSpeech';

interface TtsControlsBarProps {
  textToRead?: string;
  onSentenceHighlight?: (offset: number, length: number) => void;
  onClose?: () => void;
}

export const TtsControlsBar: React.FC<TtsControlsBarProps> = ({
  textToRead = '',
  onSentenceHighlight,
  onClose
}) => {
  const speech = useProofreadingSpeech(textToRead);

  React.useEffect(() => {
    if (speech.currentSentence && onSentenceHighlight) {
      onSentenceHighlight(speech.currentSentence.charOffset, speech.currentSentence.length);
    }
  }, [speech.currentSentence, onSentenceHighlight]);

  const progressPercent = speech.sentences.length > 0
    ? Math.round(((speech.currentSentenceIndex + 1) / speech.sentences.length) * 100)
    : 0;

  return (
    <div
      className="tts-controls-bar flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-slate-700 text-slate-200 select-none shadow-lg"
      role="region"
      aria-label="Sesli Okuma Prova Kontrol Çubuğu"
    >
      {/* Sol Kontroller: Oynat/Duraklat, İleri/Geri, Durdur */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={speech.previousSentence}
          title="Önceki Cümle (Ctrl+Alt+Sol)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          ⏮
        </button>

        {speech.isPlaying && !speech.isPaused ? (
          <button
            type="button"
            onClick={speech.pause}
            title="Duraklat (Ctrl+Alt+Space)"
            className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1.5 shadow"
          >
            ⏸ Duraklat
          </button>
        ) : (
          <button
            type="button"
            onClick={speech.play}
            title="Oynat (Ctrl+Alt+Space)"
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 shadow"
          >
            ▶ {speech.isPaused ? 'Devam Et' : 'Seslendir'}
          </button>
        )}

        <button
          type="button"
          onClick={speech.nextSentence}
          title="Sonraki Cümle (Ctrl+Alt+Sağ)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          ⏭
        </button>

        <button
          type="button"
          onClick={speech.stop}
          title="Durdur"
          className="p-1.5 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors ml-1"
        >
          ⏹
        </button>
      </div>

      {/* Orta: Aktif Cümle & İlerleme */}
      <div className="flex-1 max-w-xl mx-4 text-center">
        {speech.currentSentence ? (
          <div className="text-xs truncate text-amber-200 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-800/30">
            <span className="font-semibold mr-1.5 text-amber-400">
              [{speech.currentSentenceIndex + 1}/{speech.sentences.length}]
            </span>
            {speech.currentSentence.text}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">
            {speech.sentences.length > 0 ? `${speech.sentences.length} cümle hazır. Başlatmak için 'Seslendir'e basın.` : 'Seslendirilecek metin bulunamadı.'}
          </div>
        )}
      </div>

      {/* Sağ: Hız Seçimi, Ses Seçimi ve Kapat */}
      <div className="flex items-center gap-3 text-xs">
        {/* Okuma Hızı Seçici */}
        <div className="flex items-center gap-1">
          <label htmlFor="tts-rate-select" className="text-slate-400">Hız:</label>
          <select
            id="tts-rate-select"
            value={speech.rate}
            onChange={(e) => speech.setRate(parseFloat(e.target.value))}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-1.5 py-1 text-xs"
          >
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>
        </div>

        {/* Ses Seçici */}
        {speech.availableVoices.length > 0 && (
          <div className="flex items-center gap-1">
            <label htmlFor="tts-voice-select" className="text-slate-400">Ses:</label>
            <select
              id="tts-voice-select"
              value={speech.voiceUri || ''}
              onChange={(e) => speech.setVoice(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-1.5 py-1 text-xs max-w-[130px] truncate"
            >
              <option value="">Varsayılan Ses</option>
              {speech.availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* İlerleme Rozeti */}
        <span className="text-[11px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
          %{progressPercent}
        </span>

        {/* Kapat Butonu */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded ml-1"
            title="Kapat"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default TtsControlsBar;
