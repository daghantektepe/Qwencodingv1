import React, { useMemo } from 'react';
import './WordCount.css';

/**
 * WordCount — Faz 9: canlı kelime sayımı ve hedef takibi bileşeni.
 *
 * Görevler:
 *  1) Aktif dokümanın canlı kelime + karakter sayısını gösterir.
 *  2) Doküman hedefi varsa ilerleme çubuğu ve yüzde çizer.
 *  3) Proje genelindeki toplam kelime sayısı ve proje hedefi ilerlemesini gösterir.
 *
 * props:
 *   document: { id, title, content, metadata? } | null — aktif doküman
 *   tree: Node[] — proje ağacı (proje toplamı için)
 *   docTarget?: number|null — aktif dokümanın kelime hedefi
 *        (document.metadata.wordTarget varsa ondan önceliklendirilir)
 *   projectTarget?: number|null — proje kelime hedefi
 *        (project.metadata.wordTarget yerine prop olarak gelir)
 */

import { countWords, countChars, countTreeWords, buildProgress } from '../utils/count.js';

function ProgressBar({ progress }) {
  if (!progress || progress.ratio == null) return null;
  const pct = Math.round(progress.ratio * 100);
  return (
    <div className="wc-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`wc-progress__bar${progress.reached ? ' wc-progress__bar--done' : ''}`} style={{ width: `${pct}%` }} />
      <span className="wc-progress__label">{pct}%</span>
    </div>
  );
}

export default function WordCount({ document = null, tree = [], docTarget = null, projectTarget = null }) {
  // --- Canlı sayımlar (her render'da güncel metinden hesaplanır) ---
  const docStats = useMemo(() => {
    const text = document?.content || '';
    return {
      words: countWords(text),
      chars: countChars(text),
      charsNoSpace: countChars(text, { includeSpaces: false }),
    };
  }, [document]);

  const projectTotal = useMemo(() => countTreeWords(tree), [tree]);

  // --- Hedefler: önce düğüm metadata'sı, sonra prop ---
  const activeDocTarget = document?.metadata?.wordTarget ?? docTarget ?? null;
  const docProgress = useMemo(
    () => buildProgress({ current: docStats.words, target: activeDocTarget }),
    [docStats.words, activeDocTarget]
  );
  const projectProgress = useMemo(
    () => buildProgress({ current: projectTotal, target: projectTarget }),
    [projectTotal, projectTarget]
  );

  return (
    <aside className="wordcount" aria-label="Kelime Sayacı">
      <header className="wordcount-header">
        <h2 className="wordcount-header__title">Kelime Sayacı</h2>
      </header>

      <div className="wordcount-body">
        {/* Aktif doküman bölümü */}
        <section className="wordcount-section" aria-label="Aktif doküman istatistikleri">
          <h3 className="wordcount-section__title">
            {document ? document.title : 'Doküman seçilmedi'}
          </h3>
          <dl className="wordcount-stats">
            <div className="wordcount-stat">
              <dt>Kelime</dt>
              <dd>{docStats.words.toLocaleString('tr-TR')}</dd>
            </div>
            <div className="wordcount-stat">
              <dt>Karakter</dt>
              <dd>{docStats.chars.toLocaleString('tr-TR')}</dd>
            </div>
            <div className="wordcount-stat">
              <dt>Karakter (boşluksuz)</dt>
              <dd>{docStats.charsNoSpace.toLocaleString('tr-TR')}</dd>
            </div>
          </dl>
          {activeDocTarget > 0 && (
            <div className="wordcount-target">
              <ProgressBar progress={docProgress} />
              <p className="wordcount-target__text">
                Hedef: {activeDocTarget.toLocaleString('tr-TR')} kelime ·{' '}
                {docProgress.reached
                  ? 'Hedefe ulaşıldı 🎉'
                  : `${docProgress.remaining.toLocaleString('tr-TR')} kelime kaldı`}
              </p>
            </div>
          )}
        </section>

        {/* Proje geneli bölümü */}
        <section className="wordcount-section wordcount-section--project" aria-label="Proje istatistikleri">
          <h3 className="wordcount-section__title">Proje Geneli</h3>
          <div className="wordcount-project-total">
            <span className="wordcount-project-total__num">{projectTotal.toLocaleString('tr-TR')}</span>
            <span className="wordcount-project-total__unit">kelime</span>
          </div>
          {projectTarget > 0 && (
            <div className="wordcount-target">
              <ProgressBar progress={projectProgress} />
              <p className="wordcount-target__text">
                Proje hedefi: {projectTarget.toLocaleString('tr-TR')} kelime ·{' '}
                {projectProgress.reached
                  ? 'Tamamlandı 🎉'
                  : `${projectProgress.remaining.toLocaleString('tr-TR')} kelime kaldı`}
              </p>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
