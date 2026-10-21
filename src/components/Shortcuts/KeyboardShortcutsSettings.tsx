import React, { useState, useEffect } from 'react';
import {
  keymapManager,
  ShortcutAction,
  ShortcutCategory,
  ShortcutProfile
} from '../../services/shortcuts/keymapManager';
import { vimModeExtension, VimState } from '../../services/shortcuts/vimModeExtension';

interface KeyboardShortcutsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsSettings: React.FC<KeyboardShortcutsSettingsProps> = ({
  isOpen,
  onClose
}) => {
  const [actions, setActions] = useState<ShortcutAction[]>(() => keymapManager.getActions());
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all');
  const [recordingActionId, setRecordingActionId] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [vimState, setVimState] = useState<VimState>(() => vimModeExtension.getState());

  useEffect(() => {
    const unsubKeymap = keymapManager.subscribe(() => setActions(keymapManager.getActions()));
    const unsubVim = vimModeExtension.subscribe(setVimState);
    return () => {
      unsubKeymap();
      unsubVim();
    };
  }, []);

  useEffect(() => {
    if (!recordingActionId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingActionId(null);
        setConflictMessage(null);
        return;
      }

      // Sadece modifier tuşuna basıldıysa bekle
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      const combo = keymapManager.formatEventToString(e);
      const res = keymapManager.bindKey(recordingActionId, combo);

      if (res.success) {
        setRecordingActionId(null);
        setConflictMessage(null);
      } else if (res.conflictWith) {
        setConflictMessage(
          `"${combo}" kısayolu zaten "${res.conflictWith.name}" eylemine atanmış!`
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [recordingActionId]);

  if (!isOpen) return null;

  const filtered = actions.filter((a) =>
    selectedCategory === 'all' ? true : a.category === selectedCategory
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-settings-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Üst Çubuk */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">⌨️</span>
            <h2 id="shortcuts-settings-title" className="font-semibold text-white text-sm">
              Klavye Kısayolları ve Tuş Haritası (Keymap Settings)
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Profil ve Vim Kontrolleri */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Hazır Profil:</span>
            {(['scrivener', 'vscode', 'word'] as ShortcutProfile[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => keymapManager.loadProfile(p)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 capitalize border border-slate-700"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Vim Modu:</span>
            <button
              type="button"
              onClick={() => vimModeExtension.setEnabled(!vimState.isEnabled)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                vimState.isEnabled
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {vimState.isEnabled ? 'Açık (Normal/Insert)' : 'Kapalı'}
            </button>
          </div>
        </div>

        {/* Çakışma Uyarısı Bildirimi */}
        {conflictMessage && (
          <div className="px-5 py-2 bg-rose-950/80 border-b border-rose-800 text-rose-300 text-xs flex items-center justify-between">
            <span>⚠ {conflictMessage}</span>
            <button
              type="button"
              onClick={() => setConflictMessage(null)}
              className="text-rose-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Kategori Sekmeleri */}
        <div className="flex gap-1.5 px-5 py-2 border-b border-slate-800 bg-slate-900/60 text-xs shrink-0">
          {(['all', 'editor', 'navigation', 'view', 'file', 'tools'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded font-medium ${
                selectedCategory === cat
                  ? 'bg-cyan-700 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all'
                ? 'Tümü'
                : cat === 'editor'
                ? 'Editör'
                : cat === 'navigation'
                ? 'Gezinme'
                : cat === 'view'
                ? 'Görünümler'
                : cat === 'file'
                ? 'Dosya & Proje'
                : 'Araçlar'}
            </button>
          ))}
        </div>

        {/* Kısayol Listesi */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {filtered.map((act) => {
            const isRecording = recordingActionId === act.id;
            const activeKey = keymapManager.getActiveKey(act.id);

            return (
              <div
                key={act.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs hover:border-slate-700"
              >
                <div className="flex flex-col pr-2">
                  <span className="font-semibold text-white">{act.name}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">{act.description}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {act.customKey && (
                    <button
                      type="button"
                      onClick={() => keymapManager.resetToDefault(act.id)}
                      className="text-[10px] text-slate-500 hover:text-rose-400"
                      title="Varsayılana Dön"
                    >
                      Sıfırla
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setConflictMessage(null);
                      setRecordingActionId(act.id);
                    }}
                    className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold border transition-colors ${
                      isRecording
                        ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                    }`}
                  >
                    {isRecording ? 'Tuşlara Basın...' : activeKey || '(Atanmadı)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsSettings;
