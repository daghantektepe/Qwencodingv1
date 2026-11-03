/**
 * OpenScriv Son Projeler Servisi (Recent Projects)
 * Faz 2: Gerçek son projeleri localStorage üzerinde tutar,
 * taşınmış / silinmiş projeleri temizleme veya yönetme imkanı sunar.
 */

export interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: string;
}

const STORAGE_KEY = 'openscriv:recent_projects_v2';
const MAX_RECENT = 8;

export class RecentProjectsService {
  static getRecent(): RecentProject[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return list.sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime());
    } catch (e) {
      console.warn('[RecentProjects] Okuma hatası:', e);
      return [];
    }
  }

  static getLatest(): RecentProject | null {
    const list = this.getRecent();
    return list.length > 0 ? list[0] : null;
  }

  static add(project: { name: string; path: string; id?: string }): RecentProject[] {
    try {
      const list = this.getRecent().filter((p) => p.path !== project.path);
      const entry: RecentProject = {
        id: project.id || `proj_${Date.now()}`,
        name: project.name || 'Adsız Proje',
        path: project.path,
        lastOpenedAt: new Date().toISOString(),
      };
      const updated = [entry, ...list].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('[RecentProjects] Kaydetme hatası:', e);
      return [];
    }
  }

  static remove(path: string): RecentProject[] {
    try {
      const list = this.getRecent().filter((p) => p.path !== path);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return list;
    } catch (e) {
      console.warn('[RecentProjects] Silme hatası:', e);
      return [];
    }
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
