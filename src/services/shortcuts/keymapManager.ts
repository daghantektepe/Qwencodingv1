/**
 * keymapManager.ts — Faz 70: Tam Özelleştirilebilir Klavye Kısayolları Yöneticisi
 */

export type ShortcutCategory = 'editor' | 'navigation' | 'view' | 'file' | 'tools';
export type ShortcutProfile = 'scrivener' | 'vscode' | 'word' | 'custom';

export interface ShortcutAction {
  id: string;
  name: string;
  category: ShortcutCategory;
  defaultKey: string;
  customKey?: string;
  description: string;
}

const DEFAULT_ACTIONS: ShortcutAction[] = [
  { id: 'file.save', name: 'Projeyi Kaydet', category: 'file', defaultKey: 'Ctrl+S', description: 'Tüm projeyi yerel veritabanına kaydeder' },
  { id: 'file.compile', name: 'Derle ve Dışa Aktar', category: 'file', defaultKey: 'Ctrl+Shift+E', description: 'Derleme penceresini açar' },
  { id: 'editor.split', name: 'İmleçten Belgeyi Böl', category: 'editor', defaultKey: 'Ctrl+Shift+K', description: 'Metni imleç hizasından ikiye böler' },
  { id: 'editor.bold', name: 'Kalın Metin', category: 'editor', defaultKey: 'Ctrl+B', description: 'Seçili metni kalınlaştırır' },
  { id: 'editor.italic', name: 'İtalik Metin', category: 'editor', defaultKey: 'Ctrl+I', description: 'Seçili metni italik yapar' },
  { id: 'view.corkboard', name: 'Mantar Pano Görünümü', category: 'view', defaultKey: 'Ctrl+1', description: 'Mantar pano moduna geçer' },
  { id: 'view.outliner', name: 'Hiyerarşik Taslak Görünümü', category: 'view', defaultKey: 'Ctrl+2', description: 'Outliner görünümüne geçer' },
  { id: 'view.editor', name: 'Metin Editörü', category: 'view', defaultKey: 'Ctrl+3', description: 'Standart editör görünümüne geçer' },
  { id: 'nav.quickSearch', name: 'Hızlı Arama & Komut Paleti', category: 'navigation', defaultKey: 'Ctrl+P', description: 'Genel arama penceresini açar' },
  { id: 'tools.tts', name: 'Sesli Okuma (TTS) Oynat/Duraklat', category: 'tools', defaultKey: 'Ctrl+Alt+Space', description: 'Metin seslendirmesini başlatır veya duraklatır' },
  { id: 'tools.sprint', name: 'Yazma Koşusu Başlat', category: 'tools', defaultKey: 'Ctrl+Shift+S', description: 'Hızlı sprint sayacını açar' },
];

export class KeymapManager {
  private actions: Map<string, ShortcutAction> = new Map();
  private listeners = new Set<() => void>();

  constructor() {
    this.resetToDefault();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getActions(): ShortcutAction[] {
    return Array.from(this.actions.values());
  }

  public getAction(id: string): ShortcutAction | undefined {
    return this.actions.get(id);
  }

  public getActiveKey(actionId: string): string {
    const act = this.actions.get(actionId);
    return act?.customKey || act?.defaultKey || '';
  }

  public findConflict(keyCombination: string, excludeActionId?: string): ShortcutAction | undefined {
    const normalized = this.normalizeKey(keyCombination);
    for (const act of this.actions.values()) {
      if (act.id === excludeActionId) continue;
      const actKey = this.normalizeKey(act.customKey || act.defaultKey);
      if (actKey === normalized) {
        return act;
      }
    }
    return undefined;
  }

  public bindKey(actionId: string, newKeyCombination: string): { success: boolean; conflictWith?: ShortcutAction } {
    const act = this.actions.get(actionId);
    if (!act) return { success: false };

    const conflict = this.findConflict(newKeyCombination, actionId);
    if (conflict) {
      return { success: false, conflictWith: conflict };
    }

    act.customKey = this.normalizeKey(newKeyCombination);
    this.notify();
    return { success: true };
  }

  public resetToDefault(actionId?: string): void {
    if (actionId) {
      const act = this.actions.get(actionId);
      if (act) {
        delete act.customKey;
        this.notify();
      }
      return;
    }

    this.actions.clear();
    DEFAULT_ACTIONS.forEach((a) => {
      this.actions.set(a.id, { ...a });
    });
    this.notify();
  }

  public normalizeKey(combo: string): string {
    if (!combo) return '';
    const parts = combo.split('+').map((p) => p.trim());
    const modifiers: string[] = [];
    let mainKey = '';

    parts.forEach((p) => {
      const lower = p.toLowerCase();
      if (lower === 'ctrl' || lower === 'control') modifiers.push('Ctrl');
      else if (lower === 'shift') modifiers.push('Shift');
      else if (lower === 'alt') modifiers.push('Alt');
      else if (lower === 'meta' || lower === 'cmd' || lower === 'command') modifiers.push('Meta');
      else mainKey = p.toUpperCase();
    });

    return [...modifiers, mainKey].filter(Boolean).join('+');
  }

  public matchesEvent(actionId: string, event: KeyboardEvent): boolean {
    const activeKey = this.getActiveKey(actionId);
    if (!activeKey) return false;

    const eventKey = this.formatEventToString(event);
    return this.normalizeKey(activeKey) === this.normalizeKey(eventKey);
  }

  public formatEventToString(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Meta');

    const key = event.key;
    if (key && !['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      if (key === ' ') parts.push('Space');
      else parts.push(key.toUpperCase());
    }

    return parts.join('+');
  }

  public loadProfile(profile: ShortcutProfile): void {
    this.resetToDefault();
    if (profile === 'vscode') {
      this.bindKey('nav.quickSearch', 'Ctrl+P');
      this.bindKey('file.save', 'Ctrl+S');
      this.bindKey('view.corkboard', 'Ctrl+Shift+1');
      this.bindKey('view.outliner', 'Ctrl+Shift+2');
    } else if (profile === 'word') {
      this.bindKey('editor.bold', 'Ctrl+B');
      this.bindKey('editor.italic', 'Ctrl+I');
      this.bindKey('file.save', 'Ctrl+S');
    }
  }

  public exportKeymapJson(): string {
    const customMap: Record<string, string> = {};
    for (const act of this.actions.values()) {
      if (act.customKey) {
        customMap[act.id] = act.customKey;
      }
    }
    return JSON.stringify(customMap, null, 2);
  }

  public importKeymapJson(json: string): void {
    try {
      const parsed = JSON.parse(json);
      for (const [id, key] of Object.entries(parsed)) {
        if (this.actions.has(id) && typeof key === 'string') {
          this.bindKey(id, key);
        }
      }
    } catch (e: any) {
      throw new Error(`Kısayollar yüklenemedi: ${e.message}`);
    }
  }
}

export const keymapManager = new KeymapManager();
export default keymapManager;
