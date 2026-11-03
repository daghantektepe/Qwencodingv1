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

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

/**
 * Options for the useAutosave hook.
 */
export interface UseAutosaveOptions {
  /** Delay in milliseconds before auto-saving (default: 1500) */
  delay?: number;
  /** Project ID for document storage (default: 'default') */
  projectId?: string;
  /** Optional .opscriv package path */
  packagePath?: string;
  /** Status change listener */
  onStatusChange?: (status: SaveStatus) => void;
  /** Save success listener */
  onSaveSuccess?: (info: { docId: string; timestamp: string }) => void;
  /** Save error listener */
  onSaveError?: (err: Error) => void;
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
 */
export function defaultSaveFn(docId: string, content: string, projectId?: string, packagePath?: string | null): Promise<void>;

/**
 * High-level save function that wraps defaultSaveFn.
 */
export function saveDocument(docId: string, content: string, projectId?: string): Promise<void>;

/**
 * React hook for automatic document saving with debounce and true save states.
 */
export function useAutosave(
  doc: AutosaveDocument | null,
  options?: UseAutosaveOptions
): {
  /** Manually trigger an immediate save */
  saveNow: () => Promise<void>;
  /** Save lifecycle state */
  saveStatus: SaveStatus;
  /** ISO timestamp of last successful save */
  lastSavedAt: string | null;
  /** Error message if save failed */
  error: string | null;
};

export default useAutosave;
