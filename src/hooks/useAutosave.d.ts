/**
 * Type definitions for useAutosave hook and related functions.
 */

/**
 * Result of a persist/save operation.
 */
export type PersistResult = {
  success: boolean;
  error?: string;
};

/**
 * Options for the useAutosave hook.
 */
export interface UseAutosaveOptions {
  /** Delay in milliseconds before auto-saving (default: 1500) */
  delay?: number;
  /** Project ID for document storage (default: 'default') */
  projectId?: string;
}

/**
 * Document structure for autosave.
 */
export interface AutosaveDocument {
  /** Unique document identifier */
  docId?: string;
  id?: string;
  /** Document content */
  content: string;
  [key: string]: any;
}

/**
 * Electron API interface for document persistence.
 */
export interface ElectronAPI {
  invoke?: (channel: string, ...args: any[]) => Promise<any>;
  on?: (channel: string, listener: (event: any, ...args: any[]) => void) => any;
  saveDocument: (payload: {
    projectId: string;
    docId: string;
    content: string;
  }) => Promise<PersistResult | void>;
  [key: string]: any;
}

/**
 * Global window interface extension for Electron API.
 */
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    saveDoc?: (projectId: string, docId: string, content: string) => Promise<void>;
  }
}

/**
 * Default save function that handles document persistence.
 * Tries electronAPI.saveDocument first, then falls back to window.saveDoc,
 * and finally uses localStorage as a last resort.
 * 
 * @param docId - The document ID
 * @param content - The document content
 * @param projectId - The project ID (default: 'default')
 * @returns Promise that resolves when save is complete
 */
export function defaultSaveFn(docId: string, content: string, projectId?: string): Promise<void>;

/**
 * High-level save function that wraps defaultSaveFn.
 * 
 * @param docId - The document ID
 * @param content - The document content
 * @param projectId - The project ID (default: 'default')
 * @returns Promise that resolves when save is complete
 */
export function saveDocument(docId: string, content: string, projectId?: string): Promise<void>;

/**
 * React hook for automatic document saving with debounce.
 * 
 * @param doc - The document to autosave (can be null)
 * @param options - Autosave configuration options
 * @returns Object containing saveNow function for manual saves
 */
export function useAutosave(
  doc: AutosaveDocument | null,
  options?: UseAutosaveOptions
): {
  /** Manually trigger an immediate save */
  saveNow: () => Promise<void>;
};

/**
 * Default export of the useAutosave hook.
 */
export default useAutosave;
