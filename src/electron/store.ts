/**
 * Electron store module for document persistence.
 */

export type PersistResult = {
  success: boolean;
  error?: string;
};

export interface ElectronStore {
  saveDocument: (projectId: string, docId: string, content: string) => Promise<PersistResult>;
  loadDocument: (projectId: string, docId: string) => Promise<string | null>;
  deleteDocument: (projectId: string, docId: string) => Promise<PersistResult>;
}

/**
 * Creates an Electron store instance for document persistence.
 */
export function createElectronStore(): ElectronStore {
  return {
    async saveDocument(projectId: string, docId: string, content: string): Promise<PersistResult> {
      try {
        if (typeof window !== 'undefined' && (window as any).electronAPI?.saveDocument) {
          await (window as any).electronAPI.saveDocument({ projectId, docId, content });
          return { success: true };
        }
        return { success: false, error: 'electronAPI.saveDocument not available' };
      } catch (e: any) {
        return { success: false, error: e?.message || 'Unknown error' };
      }
    },

    async loadDocument(projectId: string, docId: string): Promise<string | null> {
      try {
        const key = `doc:${projectId}:${docId}`;
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },

    async deleteDocument(projectId: string, docId: string): Promise<PersistResult> {
      try {
        const key = `doc:${projectId}:${docId}`;
        localStorage.removeItem(key);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e?.message || 'Unknown error' };
      }
    },
  };
}

export default createElectronStore;
