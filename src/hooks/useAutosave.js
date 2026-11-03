import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * @typedef {Object} PersistResult
 * @property {boolean} success - Whether the save operation succeeded
 * @property {string} [error] - Error message if save failed
 */

/**
 * @typedef {'idle' | 'dirty' | 'saving' | 'saved' | 'error'} SaveStatus
 */

/**
 * defaultSaveFn - Saves document using atomic native package, electronAPI.saveDocument, or saveDoc fallback.
 * 
 * @param {string} docId - The document ID
 * @param {string} content - The document content
 * @param {string} [projectId='default'] - The project ID
 * @param {string|null} [packagePath=null] - Optional .opscriv package directory
 * @returns {Promise<void>}
 */
export async function defaultSaveFn(docId, content, projectId = 'default', packagePath = null) {
  // 1) Eğer packagePath verilmişse ve Electron IPC aktifse, atomik olarak pakete yaz
  if (packagePath && typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.invoke === 'function') {
    try {
      const res = await window.electronAPI.invoke('project:save-doc-atomic', { packagePath, docId, content });
      if (res && res.ok === false) {
        throw new Error(res.error || 'Atomik belge kaydetme hatası.');
      }
      return;
    } catch (err) {
      console.warn('[useAutosave] project:save-doc-atomic hatası, standart API deneniyor:', err);
      // Fallback'e devam et
    }
  }

  // 2) Try electronAPI.saveDocument
  if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.saveDocument === 'function') {
    const res = await window.electronAPI.saveDocument({ projectId: projectId, docId: docId, content: content });
    if (res && (res.ok === false || res.success === false)) {
      throw new Error(res.error || 'Belge kaydedilemedi.');
    }
    return;
  }

  // 3) Fallback to window.saveDoc
  if (typeof window !== 'undefined' && typeof window.saveDoc === 'function') {
    await window.saveDoc(projectId, docId, content);
    return;
  }

  // 4) Final fallback: localStorage for web environment
  try {
    const key = `doc:${projectId}:${docId}`;
    localStorage.setItem(key, content);
  } catch (e) {
    console.warn('[useAutosave] Could not save document to localStorage:', e);
    throw e;
  }
}

/**
 * saveDocument - High-level save function that wraps defaultSaveFn.
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
 * useAutosave hook - Automatically saves document content with true save contract states:
 * 'idle' | 'dirty' | 'saving' | 'saved' | 'error'.
 * 
 * @param {{docId?: string, id?: string, content: string} | null} doc - The document to autosave
 * @param {{delay?: number, projectId?: string, packagePath?: string, onStatusChange?: (status: SaveStatus) => void, onSaveSuccess?: (info: { docId: string, timestamp: string }) => void, onSaveError?: (err: Error) => void}} [options={}] - Autosave options
 * @returns {{saveNow: function(): Promise<void>, saveStatus: SaveStatus, lastSavedAt: string | null, error: string | null}}
 */
export function useAutosave(doc, options = {}) {
  const {
    delay = 1500,
    projectId = 'default',
    packagePath = null,
    onStatusChange,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const lastSavedRef = useRef(doc ? doc.content : '');

  const updateStatus = useCallback((status) => {
    setSaveStatus(status);
    if (typeof onStatusChange === 'function') {
      try {
        onStatusChange(status);
      } catch (e) {
        // ignore listener error
      }
    }
  }, [onStatusChange]);

  const save = useCallback(async (docId, content) => {
    if (!docId) return;
    updateStatus('saving');
    try {
      await defaultSaveFn(docId, content, projectId, packagePath);
      lastSavedRef.current = content;
      const nowIso = new Date().toISOString();
      setLastSavedAt(nowIso);
      setError(null);
      updateStatus('saved');
      if (typeof onSaveSuccess === 'function') {
        onSaveSuccess({ docId, timestamp: nowIso });
      }
    } catch (err) {
      console.error('[useAutosave] Save failed:', err);
      const errMsg = err?.message || 'Kaydetme hatası';
      setError(errMsg);
      updateStatus('error');
      if (typeof onSaveError === 'function') {
        onSaveError(err);
      }
    }
  }, [projectId, packagePath, updateStatus, onSaveSuccess, onSaveError]);

  const currentDocId = doc?.docId || doc?.id;
  const currentContent = doc?.content;

  useEffect(() => {
    if (!currentDocId) return;

    // İçerik değiştiyse ve henüz kaydedilmediyse dirty durumuna geç
    if (currentContent !== lastSavedRef.current) {
      updateStatus('dirty');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        save(currentDocId, currentContent);
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentDocId, currentContent, delay, save, updateStatus]);

  const saveNow = useCallback(async () => {
    if (!currentDocId) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    await save(currentDocId, currentContent);
  }, [currentDocId, currentContent, save]);

  return { saveNow, saveStatus, lastSavedAt, error };
}

export default useAutosave;
