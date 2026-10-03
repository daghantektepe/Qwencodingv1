import React, { useState, useEffect, useMemo } from 'react';
import './StatusBar.css';

/**
 * StatusBar — Faz 27: Lüks Durum Çubuğu & Yazım Oturumu Metrikleri.
 *
 * Masaüstü yazım stüdyosunun altındaki ince, şık şerit:
 *  - Canlı kelime / karakter / okuma süresi sayacı
 *  - Bugünkü yazma seansı ilerleme çubuğu + kelime hedefi göstergesi
 *  - Otomatik kayıt zaman damgası ("2 dk önce kaydedildi")
 *  - İmleç pozisyonu (Satır/Sütun)
 *  - Yakınlaştırma (Zoom %) slider'ı
 *
 * props:
 *   content: string                 — aktif dokümanın içeriği
 *   wordTarget: number              — doküman/günlük kelime hedefi (0 = hedef yok)
 *   wordsToday: number              — bugün eklenen net kelime sayısı
 *   lastSavedAt: string | null      — ISO zaman damgası (otomatik kayıt)
 *   cursor: { line: number, column: number } | null — imleç konumu
 *   zoom: number                    — yüzde (80–160)
 *   onZoomChange: (z: number) => void
 */

const WORDS_PER_MINUTE = 220; // ortalama okuma hızı

function countWords(text) {
  if (!text) return 0;
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

function formatReadingTime(words) {
  if (words <= 0) return '0 sn';
  const minutes = words / WORDS_PER_MINUTE;
  if (minutes < 1) {
    const secs = Math.max(1, Math.round(minutes * 60));
    return `${secs} sn`;
  }
  if (minutes < 60) return `${Math.round(minutes)} dk`;
  const h = Math.floor(minutes / 60);
  const mm = Math.round(minutes % 60);
  return mm > 0 ? `${h} sa ${mm} dk` : `${h} sa`;
}

function relativeTime(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diffMs = Date.now() - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return 'az önce kaydedildi';
  if (sec < 60) return `${sec} sn önce kaydedildi`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce kaydedildi`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce kaydedildi`;
  const day = Math.floor(hr / 24);
  return `${day} gün önce kaydedildi`;
}

export default function StatusBar({
  content = '',
  wordTarget = 0,
  wordsToday = 0,
  lastSavedAt = null,
  cursor = null,
  zoom = 100,
  onZoomChange,
}) {
  // Zaman damgasını canlı tutmak için 30 sn'de bir yeniden çiz
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const words = countWords(content);
    const chars = content ? content.length : 0;
    return { words, chars };
  }, [content]);

  const hasTarget = Number(wordTarget) > 0;
  const progressPct = hasTarget
    ? Math.min(100, Math.round((Number(wordsToday) / Number(wordTarget)) * 100))
    : 0;
  const savedLabel = useMemo(() => relativeTime(lastSavedAt), [lastSavedAt]);

  return (
    <footer className="statusbar" role="contentinfo" aria-label="Durum çubuğu">
      {/* --- Sol grup: canlı sayaçlar --- */}
      <div className="statusbar__group statusbar__group--stats">
        <span className="status-metric" title="Kelime sayısı">
          <span className="status-metric__value">{stats.words.toLocaleString('tr-TR')}</span>
          <span className="status-metric__unit">kelime</span>
        </span>
        <span className="statusbar__sep" aria-hidden="true">·</span>
        <span className="status-metric" title="Karakter sayısı">
          <span className="status-metric__value">{stats.chars.toLocaleString('tr-TR')}</span>
          <span className="status-metric__unit">karakter</span>
        </span>
        <span className="statusbar__sep" aria-hidden="true">·</span>
        <span className="status-metric" title={`~${WORDS_PER_MINUTE} kelime/dk okuma hızı`}>
          <span className="status-metric__value">{formatReadingTime(stats.words)}</span>
          <span className="status-metric__unit">okuma</span>
        </span>
      </div>

      {/* --- Orta grup: bugünkü seans ilerlemesi + hedef --- */}
      <div
        className="statusbar__group statusbar__group--session"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={hasTarget ? Number(wordTarget) : 100}
        aria-valuenow={Number(wordsToday)}
        aria-label="Bugünkü yazma seansı"
      >
        {hasTarget ? (
          <>
            <div className="session-bar">
              <div
                className={`session-bar__fill${progressPct >= 100 ? ' is-complete' : ''}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="session-label">
              <strong>{Number(wordsToday).toLocaleString('tr-TR')}</strong>
              <span className="session-label__of">
                {' / '}{Number(wordTarget).toLocaleString('tr-TR')} · bugün
              </span>
              {progressPct >= 100 && <span className="session-label__done">✓</span>}
            </span>
          </>
        ) : (
          <span className="session-label session-label--empty">
            Hedef yok — Inspector’dan kelime hedefi belirle
          </span>
        )}
      </div>

      {/* --- Sağ grup: kayıt, imleç, zoom --- */}
      <div className="statusbar__group statusbar__group--meta">
        <span className={`status-save${savedLabel ? '' : ' is-none'}`} title="Otomatik kayıt">
          <span className="status-save__dot" aria-hidden="true" />
          {savedLabel ?? 'henüz kaydedilmedi'}
        </span>

        {cursor && (
          <span className="status-cursor" title="İmleç konumu">
            Satır {cursor.line}, Sütun {cursor.column}
          </span>
        )}

        <label className="status-zoom" title="Yakınlaştırma">
          <input
            type="range"
            className="status-zoom__slider"
            min={80}
            max={160}
            step={5}
            value={zoom}
            onChange={(e) => onZoomChange?.(Number(e.target.value))}
            aria-label="Yakınlaştırma yüzdesi"
          />
          <span className="status-zoom__value">{zoom}%</span>
        </label>
      </div>
    </footer>
  );
}
