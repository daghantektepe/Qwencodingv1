import React from 'react';
import {
  useNightFilterStore,
  NightModeType
} from '../../services/theme/nightFilterService';
import {
  Moon,
  Sun,
  Sliders,
  Clock,
  Sparkles,
  Eye,
  RotateCcw
} from 'lucide-react';

interface NightFilterSettingsProps {
  onClose?: () => void;
}

export const NightFilterSettings: React.FC<NightFilterSettingsProps> = ({ onClose }) => {
  const {
    mode,
    intensity,
    contrastBoost,
    autoSchedule,
    startHour,
    endHour,
    setMode,
    setIntensity,
    setContrastBoost,
    setAutoSchedule,
    setScheduleHours,
    reset,
    getFilterStyleString
  } = useNightFilterStore();

  const modes: { id: NightModeType; title: string; desc: string; icon: any }[] = [
    {
      id: 'normal',
      title: 'Standart Işık',
      desc: 'Varsayılan uygulama renkleri ve doğal ekran parlaklığı.',
      icon: Sun
    },
    {
      id: 'amber',
      title: 'Kehribar Sarı Işık',
      desc: 'Zararlı mavi ışığı bloke eden yumuşak sarı/kehribar filtresi.',
      icon: Moon
    },
    {
      id: 'oled',
      title: 'Saf Siyah OLED',
      desc: 'Pikselleri tamamen kapatan #000000 gerçek siyah zemin.',
      icon: Sparkles
    },
    {
      id: 'paper_dim',
      title: 'Loş Kağıt Dokusu',
      desc: 'Gece okumalarında gözü yormayan yumuşak sepia parşömen tonu.',
      icon: Eye
    }
  ];

  return (
    <div className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-xl max-w-lg w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-4">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-semibold tracking-wide">
            Gece Aydınlatma Laboratuvarı & OLED
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => reset()}
            title="Ayarları Sıfırla"
            className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Mode Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {modes.map((item) => {
          const Icon = item.icon;
          const isSelected = mode === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-sm'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'
                  }`}
                />
                <span className="text-xs font-semibold">{item.title}</span>
              </div>
              <p className="text-[11px] leading-tight text-stone-500 dark:text-stone-400">
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Sliders (Only if not normal) */}
      {mode !== 'normal' && (
        <div className="space-y-3.5 mb-5 p-3.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              Filtre Şiddeti:
            </span>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              %{intensity}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
            className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              Kontrast Güçlendirici:
            </span>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              +{contrastBoost}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={contrastBoost}
            onChange={(e) => setContrastBoost(parseInt(e.target.value, 10))}
            className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none"
          />
        </div>
      )}

      {/* Auto Schedule Toggle */}
      <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-400" />
            <div>
              <p className="text-xs font-medium">Gün Batımı Otomatik Modu</p>
              <p className="text-[11px] text-stone-400">
                Belirlenen saatlerde otomatik gece filtresine geç
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoSchedule}
            onChange={(e) => setAutoSchedule(e.target.checked)}
            className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
          />
        </label>

        {autoSchedule && (
          <div className="flex items-center gap-3 pl-6">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-stone-400">Başlangıç:</span>
              <input
                type="number"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) =>
                  setScheduleHours(parseInt(e.target.value, 10) || 0, endHour)
                }
                className="w-14 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-center text-xs"
              />
              <span className="text-stone-400">:00</span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-stone-400">Bitiş:</span>
              <input
                type="number"
                min="0"
                max="23"
                value={endHour}
                onChange={(e) =>
                  setScheduleHours(startHour, parseInt(e.target.value, 10) || 0)
                }
                className="w-14 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-center text-xs"
              />
              <span className="text-stone-400">:00</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Sample Preview Text */}
      <div className="mt-4 p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-100/50 dark:bg-stone-800/30">
        <p className="text-[10px] uppercase font-semibold text-stone-400 mb-1">
          Canlı Tipografi & Okunabilirlik Önizlemesi
        </p>
        <p
          style={{ filter: getFilterStyleString() }}
          className="text-xs leading-relaxed text-stone-900 dark:text-stone-100 transition-all font-serif"
        >
          "Gecenin sessizliğinde sadece daktilonun tuş sesleri yankılanıyordu. Karakterin iç dünyası bu sakin odada yeniden şekilleniyordu."
        </p>
      </div>
    </div>
  );
};
