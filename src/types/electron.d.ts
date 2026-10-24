/**
 * OpenScriv Desktop Mastery - Type-Safe Electron IPC Definitions
 * Phase 101: Gerçek Electron Runtime Entegrasyonu ve Tip-Güvenli IPC Preload Mimarisi
 */

export interface ElectronDocumentPayload {
  projectId: string;
  docId: string;
  content: string;
}

export interface ElectronDocumentResult {
  ok: boolean;
  docId?: string;
  content?: string;
  exists?: boolean;
  path?: string;
  savedAt?: number;
  error?: string;
}

export interface ElectronProjectPayload {
  projectId: string;
}

export interface ElectronProjectTreePayload {
  projectId: string;
  tree: any[];
}

export interface ElectronBackupBridge {
  markDirty: (projectId: string) => Promise<{ ok: boolean; error?: string }>;
  createBackup: (payload: { projectId: string; tree?: any[]; documents?: any[] }) => Promise<{ ok: boolean; backupId?: string; path?: string; error?: string }>;
  listBackups: (projectId: string) => Promise<{ ok: boolean; backups?: any[]; error?: string }>;
  restoreBackup: (payload: { projectId: string; backupId: string }) => Promise<{ ok: boolean; restored?: any; error?: string }>;
  getCrashRecoveryInfo: (projectId: string) => Promise<{ hasCrash?: boolean; lastJournal?: any; error?: string }>;
  dismissCrashRecovery: (projectId: string) => Promise<{ ok: boolean; error?: string }>;
}

export interface ElectronAPIBridge {
  isDesktop?: boolean;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on?: (channel: string, listener: (event: any, ...args: any[]) => void) => (() => void) | void;
  removeListener?: (channel: string, listener: (...args: any[]) => void) => void;
  getAppVersion: () => Promise<string>;
  getUserDataPath: () => Promise<string>;
  saveDocument: (payload: ElectronDocumentPayload) => Promise<ElectronDocumentResult>;
  loadDocument: (payload: { projectId: string; docId: string }) => Promise<ElectronDocumentResult>;
  loadProject: (payload: ElectronProjectPayload) => Promise<{ ok: boolean; documents?: Array<{ docId: string; content: string }>; error?: string }>;
  saveProjectTree: (payload: ElectronProjectTreePayload) => Promise<{ ok: boolean; path?: string; error?: string }>;
  loadProjectTree: (payload: ElectronProjectPayload) => Promise<{ ok: boolean; tree?: any[]; error?: string }>;
  saveProject?: (data: any) => Promise<any>;
  newProject?: () => Promise<any>;
  openProject?: (dir?: string) => Promise<any>;
  searchProject?: (payload: { projectId: string; query: string; caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }) => Promise<{ ok: boolean; results?: any[]; error?: string }>;
  createSnapshot?: (payload: any) => Promise<any>;
  listSnapshots?: (payload: any) => Promise<any>;
  loadSnapshot?: (payload: any) => Promise<any>;
  deleteSnapshot?: (payload: any) => Promise<any>;
  compileRun?: (payload: any) => Promise<any>;
  saveCompiledFile?: (payload: any) => Promise<any>;
  backup: ElectronBackupBridge;
}

export type ElectronAPI = ElectronAPIBridge;

declare global {
  interface Window {
    electronAPI?: ElectronAPIBridge;
    electronBridge?: ElectronAPIBridge;
    api?: ElectronAPIBridge;
    openScriv?: ElectronAPIBridge;
  }
}

export {};
