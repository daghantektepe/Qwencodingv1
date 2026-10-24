/**
 * Native Menu Bridge & Dispatcher Service
 * Phase 107: Tam Yerel İşletim Sistemi Menüleri ve Kısayol Haritası (Native Application Menus)
 */

export type NativeMenuAction =
  | 'file:new-project'
  | 'file:open-project'
  | 'file:save'
  | 'file:save-as'
  | 'file:compile'
  | 'file:batch-export'
  | 'edit:find-replace'
  | 'edit:search-project'
  | 'view:editor'
  | 'view:corkboard'
  | 'view:outliner'
  | 'view:timeline'
  | 'view:codex'
  | 'view:toggle-focus'
  | 'view:toggle-theme'
  | 'project:add-doc'
  | 'project:add-folder'
  | 'project:split-doc'
  | 'project:health-dashboard'
  | 'project:backup-manager'
  | 'tools:command-palette'
  | 'tools:scratchpad'
  | 'tools:dictionary'
  | 'tools:snippets'
  | 'tools:toggle-sound'
  | 'window:popout-scratchpad'
  | 'help:docs'
  | 'help:release-notes'
  | 'help:about';

type MenuActionHandler = (payload?: any) => void;

export class NativeMenuBridge {
  private static handlers = new Map<string, Set<MenuActionHandler>>();
  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    this.initialized = true;

    // Electron IPC dinleyici
    if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
      (window as any).electron.ipcRenderer.on(
        'menu:action',
        (_event: any, data: { action: NativeMenuAction; payload: any }) => {
          if (data && data.action) {
            this.dispatch(data.action, data.payload);
          }
        }
      );
    }
  }

  /**
   * Bir menü aksiyonuna abone olur.
   */
  static on(action: NativeMenuAction, handler: MenuActionHandler): () => void {
    this.init();
    if (!this.handlers.has(action)) {
      this.handlers.set(action, new Set());
    }
    this.handlers.get(action)!.add(handler);

    return () => {
      const set = this.handlers.get(action);
      if (set) {
        set.delete(handler);
        if (set.size === 0) this.handlers.delete(action);
      }
    };
  }

  /**
   * Menü aksiyonunu tetikler (tüm aboneleri çağırır).
   */
  static dispatch(action: NativeMenuAction, payload?: any): void {
    this.init();
    const set = this.handlers.get(action);
    if (set) {
      for (const handler of set) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[NativeMenuBridge] Handler error for ${action}:`, err);
        }
      }
    }
  }

  /**
   * Tüm kayıtlı dinleyicileri temizler (testler için).
   */
  static clear(): void {
    this.handlers.clear();
  }
}
