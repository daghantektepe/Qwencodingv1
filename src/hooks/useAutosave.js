import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * @typedef {Object} PersistResult
 * @property {boolean} success - Whether the save operation succeeded
 * @property {string} [error] - Error message if save failed
 */

/**
 * @typedef {Object} ElectronAPI
 * @property {function({projectId: string, docId: string, content: string}): Promise<PersistResult>} saveDocument
 */

/**
 * defaultSaveFn - Saves document using electronAPI.saveDocument or saveDoc fallback.
 * When called with (docId, content), it triggers:
 *   electronAPI.saveDocument({ projectId: 'default', docId, content })
 * Falls back to window.saveDoc if electronAPI is not available.
 * 
 * @param {string} docId - The document ID
 * @param {string} content - The document content
 * @param {string} [projectId='default'] - The project ID
 * @returns {Promise<void>}
 */
export async function defaultSaveFn(docId, content, projectId = 'default') {
  // Try electronAPI.saveDocument first
  if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.saveDocument === 'function') {
    await window.electronAPI.saveDocument({ projectId: projectId, docId: docId, content: content });
    return;
  }

  // Fallback to saveDoc
  if (typeof window !== 'undefined' && typeof window.saveDoc === 'function') {
    await window.saveDoc(projectId, docId, content);
    return;
  }

  // Final fallback: localStorage for web environment
  try {
    const key = `doc:${projectId}:${docId}`;
    localStorage.setItem(key, content);
  } catch (e) {
    console.warn('[useAutosave] Could not save document:', e);
  }
}

/**
 * saveDocument - High-level save function that wraps defaultSaveFn.
 * Supports both electronAPI.saveDocument and saveDoc.
 * 
 * @param {string} docId - The document ID
 * @param {string} content - The document content
 * @param {string} [projectId='default'] - The project ID
 * @returns {Promise<void>}
 */
export async function saveDocument(docId, content, projectId = 'default') {
  return defaultSaveFn(docId, content, projectId);
}

/**
 * useAutosave - Debounce'lu, dürüst kayıt durum makinesi.
 *
 * state: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
 *   'saved' yalnızca saveFn gerçekten başarılı döndüğünde gösterilir.
 *   saveFn { ok: false } döndürür ya da fırlatırsa 'error' olur ve değer
 *   bir sonraki flush'ta yeniden denenmek üzere bekletilir.
 *
 * @param {(value: any) => Promise<any>} saveFn - Gerçek yazma işlemi
 * @param {{delay?: number}} [options]
 * @returns {{state: string, lastSavedAt: string|null, schedule: (value: any) => void, flush: () => Promise<void>, isDirty: () => boolean}}
 */
export function useAutosave(saveFn, options = {}) {
  const { delay = 800 } = options;
  const [state, setState] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const pendingRef = useRef(undefined);
  const timerRef = useRef(null);
  // Yazmalar sıraya alınır: aynı dosyaya eşzamanlı iki yazma olmaz.
  const chainRef = useRef(Promise.resolve());
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const flush = useCallback(() => {
    clearTimeout(timerRef.current);
    chainRef.current = chainRef.current.then(async () => {
      if (pendingRef.current === undefined) return;
      const value = pendingRef.current;
      pendingRef.current = undefined;
      setState('saving');
      try {
        const res = await saveFnRef.current(value);
        if (res && res.ok === false) throw new Error(res.error || 'Kayıt başarısız');
        setLastSavedAt(new Date().toISOString());
        setState(pendingRef.current === undefined ? 'saved' : 'dirty');
      } catch (error) {
        console.error('[useAutosave] Save failed:', error);
        if (pendingRef.current === undefined) pendingRef.current = value;
        setState('error');
      }
    });
    return chainRef.current;
  }, []);

  const schedule = useCallback((value) => {
    pendingRef.current = value;
    setState('dirty');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, delay);
  }, [delay, flush]);

  const isDirty = useCallback(() => pendingRef.current !== undefined, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { state, lastSavedAt, schedule, flush, isDirty };
}

export default useAutosave;
