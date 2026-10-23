/**
 * Native Project Store (.opscriv Package Management)
 * Phase 102: Yerel Dosya Sistemi ve Özgün Proje Paketi Formatı (.opscriv)
 */

export interface ProjectManifest {
  name: string;
  formatVersion: string;
  createdAt: string;
  updatedAt: string;
  generator: string;
  checksum?: string;
  description?: string;
}

export interface ProjectPackageData {
  packagePath: string;
  manifest: ProjectManifest;
  binder: any[];
  documents: Record<string, string>;
}

export interface CreateProjectOptions {
  parentDir?: string;
  projectName: string;
  initialTree?: any[];
  initialDocs?: Array<{ id: string; content: string }>;
}

export class NativeProjectStore {
  /**
   * Masaüstü ortamında (Electron) dizin seçici penceresi açar.
   */
  static async pickDirectory(options: { title?: string; buttonLabel?: string } = {}): Promise<string | null> {
    if (window.electronAPI?.invoke) {
      const res = await window.electronAPI.invoke('project:pick-directory', options);
      if (!res.canceled && res.path) {
        return res.path;
      }
      return null;
    }
    // Web fallback
    return 'C:/Users/Default/Documents/OpenScrivProjects';
  }

  /**
   * Yerel diskte yeni bir .opscriv paket dizini oluşturur.
   */
  static async createPackage(options: CreateProjectOptions): Promise<{ ok: boolean; data?: ProjectPackageData; error?: string }> {
    const parentDir = options.parentDir || 'C:/Users/Default/Documents/OpenScrivProjects';
    const projectName = options.projectName.trim();
    if (!projectName) {
      return { ok: false, error: 'Proje adı boş olamaz.' };
    }

    if (window.electronAPI?.invoke) {
      const res = await window.electronAPI.invoke('project:create-package', {
        parentDir,
        projectName,
        initialTree: options.initialTree,
        initialDocs: options.initialDocs,
      });
      if (res.ok) {
        return {
          ok: true,
          data: {
            packagePath: res.packagePath,
            manifest: res.manifest,
            binder: options.initialTree || [
              {
                id: 'manuscript_root',
                title: 'Taslak (Manuscript)',
                type: 'folder',
                children: [{ id: 'doc_1', title: 'Bölüm 1', type: 'document' }],
              },
            ],
            documents: { doc_1: '# Bölüm 1\n\nBuraya hikayenizi yazmaya başlayın...' },
          },
        };
      }
      return { ok: false, error: res.error };
    }

    // Web Fallback: Hafızada veya localStorage'da simüle et
    const now = new Date().toISOString();
    const manifest: ProjectManifest = {
      name: projectName.replace(/\.opscriv$/, ''),
      formatVersion: '2.1',
      createdAt: now,
      updatedAt: now,
      generator: 'OpenScriv Web Sandbox',
    };
    const packagePath = `${parentDir}/${projectName}.opscriv`;
    const binder = options.initialTree || [
      {
        id: 'manuscript_root',
        title: 'Taslak (Manuscript)',
        type: 'folder',
        children: [{ id: 'doc_1', title: 'Bölüm 1', type: 'document' }],
      },
    ];
    const documents: Record<string, string> = {
      doc_1: '# Bölüm 1\n\nBuraya hikayenizi yazmaya başlayın...',
    };

    return {
      ok: true,
      data: {
        packagePath,
        manifest,
        binder,
        documents,
      },
    };
  }

  /**
   * Disk üzerindeki .opscriv paketini okur ve yükler.
   */
  static async openPackage(packagePath: string): Promise<{ ok: boolean; data?: ProjectPackageData; error?: string }> {
    if (!packagePath) {
      return { ok: false, error: 'Paket dizin yolu belirtilmedi.' };
    }

    if (window.electronAPI?.invoke) {
      const res = await window.electronAPI.invoke('project:read-package', { packagePath });
      if (res.ok) {
        return {
          ok: true,
          data: {
            packagePath: res.packagePath,
            manifest: res.manifest,
            binder: res.binder,
            documents: res.documents,
          },
        };
      }
      return { ok: false, error: res.error };
    }

    // Web Fallback
    const mockManifest: ProjectManifest = {
      name: 'Web Simulated Project',
      formatVersion: '2.1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generator: 'OpenScriv Web Sandbox',
    };
    return {
      ok: true,
      data: {
        packagePath,
        manifest: mockManifest,
        binder: [],
        documents: {},
      },
    };
  }

  /**
   * Belgeyi atomik olarak (.tmp -> rename) kaydeder.
   */
  static async saveDocumentAtomic(packagePath: string, docId: string, content: string): Promise<{ ok: boolean; path?: string; savedAt?: number; error?: string }> {
    if (!packagePath || !docId) {
      return { ok: false, error: 'Geçersiz parametreler.' };
    }

    if (window.electronAPI?.invoke) {
      return window.electronAPI.invoke('project:save-doc-atomic', { packagePath, docId, content });
    }

    return { ok: true, path: `${packagePath}/docs/${docId}.md`, savedAt: Date.now() };
  }

  /**
   * Binder ağacını atomik olarak kaydeder.
   */
  static async saveBinderAtomic(packagePath: string, binder: any[]): Promise<{ ok: boolean; path?: string; error?: string }> {
    if (!packagePath || !binder) {
      return { ok: false, error: 'Geçersiz binder ağacı parametresi.' };
    }

    if (window.electronAPI?.invoke) {
      return window.electronAPI.invoke('project:save-binder-atomic', { packagePath, binder });
    }

    return { ok: true, path: `${packagePath}/binder.json` };
  }

  /**
   * Paketin bütünlüğünü ve manifestosunu doğrular.
   */
  static validatePackageIntegrity(manifest: ProjectManifest, binder: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!manifest.name) errors.push('Manifest name eksik.');
    if (!manifest.formatVersion) errors.push('Format versiyonu eksik.');
    if (!Array.isArray(binder)) errors.push('Binder ağacı dizi tipinde değil.');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
