import React, { useState, useEffect } from 'react';
import { soundscapeEngine, SoundscapeTrack } from '../../services/audio/soundscapeEngine';

interface SoundscapeMixerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundscapeMixerPopover: React.FC<SoundscapeMixerPopoverProps> = ({
  isOpen,
  onClose
}) => {
  const [tracks, setTracks] = useState<SoundscapeTrack[]>(() => soundscapeEngine.getTracks());
  const [masterVol, setMasterVol] = useState<number>(() => soundscapeEngine.getMasterVolume());
  const [isMuted, setIsMuted] = useState<boolean>(() => soundscapeEngine.isMuted());

  useEffect(() => {
    const unsub = soundscapeEngine.subscribe(() => {
      setTracks(soundscapeEngine.getTracks());
      setMasterVol(soundscapeEngine.getMasterVolume());
      setIsMuted(soundscapeEngine.isMuted());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="soundscape-mixer-popover absolute bottom-12 right-4 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 w-72 text-slate-200 text-xs flex flex-col gap-3"
      role="dialog"
      aria-label="Ortam Sesleri ve Daktilo Mikseri"
    >
      {/* Başlık ve Master Kontrol */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="font-semibold text-white flex items-center gap-1.5">
          <span>🎧</span> Odak Ambiyansı & Daktilo
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-0.5 text-xs"
        >
          ✕
        </button>
      </div>

      {/* Master Ses Kontrolü */}
      <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded border border-slate-800">
        <button
          type="button"
          onClick={() => soundscapeEngine.toggleMute()}
          className="text-sm p-1 rounded hover:bg-slate-800"
          title={isMuted ? 'Sesi Aç' : 'Sessize Al'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={masterVol}
          disabled={isMuted}
          onChange={(e) => soundscapeEngine.setMasterVolume(parseFloat(e.target.value))}
          className="flex-1 mx-2 accent-cyan-500 cursor-pointer"
        />

        <span className="font-mono text-[10px] text-slate-400 w-8 text-right">
          {isMuted ? '%0' : `%${Math.round(masterVol * 100)}`}
        </span>
      </div>

      {/* Ses Katmanları Listesi */}
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {tracks.map((t) => (
          <div
            key={t.id}
            className={`flex items-center justify-between p-2 rounded border transition-colors ${
              t.isEnabled
                ? 'bg-slate-800/80 border-slate-700'
                : 'bg-slate-950/40 border-slate-900 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate pr-2">
              <button
                type="button"
                onClick={() => soundscapeEngine.toggleTrack(t.id)}
                className={`text-sm p-1 rounded ${
                  t.isEnabled ? 'bg-cyan-900/60 text-cyan-300' : 'text-slate-500 hover:text-white'
                }`}
                title={t.isEnabled ? 'Kapat' : 'Etkinleştir'}
              >
                {t.icon}
              </button>
              <span className="text-[11px] font-medium text-slate-200 truncate">
                {t.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={t.volume}
                disabled={!t.isEnabled || isMuted}
                onChange={(e) => soundscapeEngine.setTrackVolume(t.id, parseFloat(e.target.value))}
                className="w-16 accent-cyan-500 cursor-pointer"
              />

              {t.id === 'typewriter' && (
                <button
                  type="button"
                  onClick={() => soundscapeEngine.playTypewriterClick('return')}
                  className="text-[10px] bg-slate-700 hover:bg-slate-600 px-1 py-0.5 rounded text-white font-mono"
                  title="Daktilo Zilini Test Et (Ding!)"
                >
                  Ding!
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundscapeMixerPopover;
