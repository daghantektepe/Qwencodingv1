import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useAutosave — secili dokumanin icerigini yerel dosyaya otomatik kaydeden hook.
 *
 * Calisma mantigi:
 *  1. `value` degistiginde icerik "dirty" isaretlenir ve en fazla `intervalMs`
 *     (varsayilan 2000ms) icinde diska yazilir (debounce + max-wait karmasi).
 *  2. Kayit icin `saveFn(docId, value)` kullanilir — Electron'da IPC ile yerel
 *     dosyaya, tarayici/gelistirme ortaminda localStorage fallback'ine yazar.
 *  3. Basarili kayitta console.log + UI geri bildirimi (`status === 'saved'`)
 *     olusur; Editor arayuzu bu status'u rozet/toast olarak gosterir.
 *  4. Dokuman degisince veya bilesen unmount olurken bekleyen kayip yasamamak
 *     icin bekleyen timer hemen flush edilir.
 *
 * @param {Object}   options
 * @param {string|null} options.docId      - Aktif dokumanin id'si
 * @param {string}   options.value         - Kaydedilecek icerik
 * @param {Function} [options.saveFn]      - async (docId, value) => void; verilmezse varsayilan localStorage yazar
 * @param {number}   [options.intervalMs=2000] - Maksimum bekleme suresi (ms)
 * @returns {{ status: string, lastSavedAt: number|null, savedCount: number, flush: Function, retry: Function }}
 */

// Varsayilan kaydedici: Electron API varsa onu, yoksa localStorage'i kullanir.
export async function defaultSaveFn(docId, value) {
  if (typeof window !== 'undefined') {
    if (window.electronAPI && typeof window.electronAPI.saveDocument === 'function') {
      await window.electronAPI.saveDocument({
        projectId: 'default',
        docId,
        content: value,
      });
      return;
    }
    // Gelistirme/tarayici ortami fallback: tamamen yerel kalir, bulut yoktur.
    localStorage.setItem(`openscriv:doc:${docId}`, value);
    return;
  }
  throw new Error('useAutosave: kaydetme ortamı bulunamadı (window tanımsız).');
}

export default function useAutosave({
  docId = null,
  value = '',
  saveFn,
  intervalMs = 2000,
}) {
  const [status, setStatus] = useState('idle'); // idle | dirty | saving | saved | error
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [savedCount, setSavedCount] = useState(0);

  const effectiveSaveFn = saveFn || defaultSaveFn;

  const timerRef = useRef(null);
  const latestValueRef = useRef(value);
  const latestDocIdRef = useRef(docId);
  const saveFnRef = useRef(effectiveSaveFn);
  const savedSnapshotRef = useRef(null); // en son diska yazilan deger

  // Ref'leri her render'da guncel tut
  useEffect(() => {
    latestValueRef.current = value;
    latestDocIdRef.current = docId;
    saveFnRef.current = effectiveSaveFn;
  }, [value, docId, effectiveSaveFn]);

  const doSave = useCallback(async () => {
    const currentDocId = latestDocIdRef.current;
    const currentValue = latestValueRef.current;

    if (currentDocId == null || typeof saveFnRef.current !== 'function') return;
    // Icerik en son kaydedilenle ayniysa gereksiz disk yazmasi yapma
    if (savedSnapshotRef.current === currentValue) return;

    setStatus('saving');
    try {
      await saveFnRef.current(currentDocId, currentValue);
      savedSnapshotRef.current = currentValue;
      const now = Date.now();
      setLastSavedAt(now);
      setSavedCount((c) => c + 1);
      setStatus('saved');
      // Geri bildirim 1: konsol logu
      // eslint-disable-next-line no-console
      console.log(
        `[useAutosave] Dokuman kaydedildi -> ${currentDocId} (${(currentValue || '').length} karakter, ${new Date(now).toLocaleTimeString()})`
      );
    } catch (err) {
      console.error('[useAutosave] Kayit hatasi:', err);
      setStatus('error');
    }
  }, []);

  // Deger degistiginde zamanlayici kur: en fazla intervalMs icinde kaydet
  useEffect(() => {
    if (docId == null) return;

    // Ilk yukleme: editorun yukledigi icerigi "kaydedilmis" kabul et (dirty baslatma)
    if (savedSnapshotRef.current === null) {
      savedSnapshotRef.current = value;
      return;
    }
    if (savedSnapshotRef.current === value) return;

    setStatus('dirty');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      doSave();
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, docId, intervalMs, doSave]);

  // Dokuman degistiginde eski dokumanin bekleyen kaydini hemen yap (veri kaybi yok)
  const prevDocIdRef = useRef(docId);
  useEffect(() => {
    if (prevDocIdRef.current !== docId) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        doSave();
      }
      savedSnapshotRef.current = null;
      setStatus('idle');
      prevDocIdRef.current = docId;
    }
  }, [docId, doSave]);

  /**
   * Bekleyen debounce'u iptal edip kaydi hemen gerceklestirir.
   * Ctrl+S ve pencere kapanisi icin Editor.jsx'ten cagrilir.
   */
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return doSave();
  }, [doSave]);

  /** Hata sonrasi tekrar denemek icin. */
  const retry = useCallback(() => {
    setStatus('dirty');
    return doSave();
  }, [doSave]);

  return { status, lastSavedAt, savedCount, flush, retry };
}
