import React, { useState, useEffect } from 'react';
import { voiceRecorder, AudioRecording, RecorderState } from '../../services/audio/voiceRecorder';
import { WaveformVisualizer } from './WaveformVisualizer';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachToDocument?: (recording: AudioRecording) => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  onAttachToDocument
}) => {
  const [recorderState, setRecorderState] = useState<RecorderState>('inactive');
  const [seconds, setSeconds] = useState<number>(0);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [titleInput, setTitleInput] = useState<string>('');
  const [dictationText, setDictationText] = useState<string>('');
  const [isDictating, setIsDictating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setRecordings(voiceRecorder.getRecordings());
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any = null;
    if (recorderState === 'recording') {
      timer = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [recorderState]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      setSeconds(0);
      setDictationText('');
      await voiceRecorder.startRecording(titleInput.trim() || 'Yeni Sesli Not');
      setRecorderState('recording');

      if (isDictating) {
        voiceRecorder.startDictation('tr-TR', (text) => {
          setDictationText(text);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePause = () => {
    voiceRecorder.pauseRecording();
    setRecorderState('paused');
  };

  const handleResume = () => {
    voiceRecorder.resumeRecording();
    setRecorderState('recording');
  };

  const handleStop = async () => {
    try {
      const rec = await voiceRecorder.stopRecording(titleInput.trim() || 'Sesli Not');
      if (isDictating) {
        voiceRecorder.stopDictation();
      }
      setRecorderState('inactive');
      setTitleInput('');
      setRecordings(voiceRecorder.getRecordings());
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id: string) => {
    voiceRecorder.deleteRecording(id);
    setRecordings(voiceRecorder.getRecordings());
  };

  const toggleDictation = () => {
    const next = !isDictating;
    setIsDictating(next);
    if (recorderState === 'recording') {
      if (next) {
        voiceRecorder.startDictation('tr-TR', (text) => setDictationText(text));
      } else {
        voiceRecorder.stopDictation();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-recorder-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-slate-200">
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎙️</span>
            <h2 id="audio-recorder-title" className="font-semibold text-white">
              Ses Kayıt ve Dikte Stüdyosu
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1"
            title="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Kayıt İsmi */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Kayıt Başlığı (İsteğe bağlı)
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="örn. 3. Bölüm Fikirleri veya Karakter Röportajı"
              disabled={recorderState !== 'inactive'}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Dalga Formu ve Zaman */}
          <div className="flex flex-col items-center gap-2">
            <WaveformVisualizer
              isRecording={recorderState === 'recording'}
              barColor="#06b6d4"
              height={56}
            />
            <div className="text-2xl font-mono font-bold tracking-wider text-cyan-400">
              {formatTime(seconds)}
            </div>
          </div>

          {/* Dikte Önizlemesi */}
          {isDictating && (
            <div className="bg-slate-950/80 border border-cyan-900/40 rounded p-2.5 text-xs text-cyan-200 max-h-20 overflow-y-auto italic">
              {dictationText ? dictationText : 'Konuşmanız dinleniyor ve metne dökülüyor...'}
            </div>
          )}

          {/* Kontrol Butonları */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {recorderState === 'inactive' ? (
              <button
                type="button"
                onClick={handleStart}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all scale-100 hover:scale-105"
              >
                <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                Kayda Başla
              </button>
            ) : (
              <>
                {recorderState === 'recording' ? (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium flex items-center gap-1.5 shadow"
                  >
                    ⏸ Duraklat
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResume}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-1.5 shadow"
                  >
                    ▶ Devam Et
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStop}
                  className="px-4 py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium flex items-center gap-1.5 shadow"
                >
                  ⏹ Tamamla ve Kaydet
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleDictation}
              className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                isDictating
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              ✍ Dikte: {isDictating ? 'Açık' : 'Kapalı'}
            </button>
          </div>

          {/* Kaydedilmiş Notlar Listesi */}
          {recordings.length > 0 && (
            <div className="mt-3 border-t border-slate-800 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Projeye Kayıtlı Sesli Notlar ({recordings.length})
              </h3>
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-800 text-xs"
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-medium text-slate-200 truncate">{rec.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(rec.durationSeconds)} • {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onAttachToDocument && (
                        <button
                          type="button"
                          onClick={() => onAttachToDocument(rec)}
                          className="px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-[11px]"
                          title="Binder Belgesine Not Olarak İliştir"
                        >
                          İliştir
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Sil"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorderModal;
