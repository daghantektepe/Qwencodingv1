import { useCallback, useRef, useEffect } from 'react';

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
 * useAutosave hook - Automatically saves document content after a debounce delay.
 * Supports electronAPI.saveDocument and saveDoc.
 * 
 * @param {{docId: string, content: string} | null} doc - The document to autosave
 * @param {{delay?: number, projectId?: string}} [options={}] - Autosave options
 * @returns {{saveNow: function(): Promise<void>}}
 */
export function useAutosave(doc, options = {}) {
  const { delay = 1500, projectId = 'default' } = options;
  const timerRef = useRef(null);
  const lastSavedRef = useRef('');

  const save = useCallback(async (docId, content) => {
    try {
      await defaultSaveFn(docId, content, projectId);
      lastSavedRef.current = content;
    } catch (error) {
      console.error('[useAutosave] Save failed:', error);
    }
  }, [projectId]);

  useEffect(() => {
    if (!doc) return;

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Only save if content changed
    if (doc.content !== lastSavedRef.current) {
      timerRef.current = setTimeout(() => {
        save(doc.docId, doc.content);
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [doc, delay, save]);

  const saveNow = useCallback(async () => {
    if (!doc) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    await save(doc.docId, doc.content);
  }, [doc, save]);

  return { saveNow };
}

export default useAutosave;
