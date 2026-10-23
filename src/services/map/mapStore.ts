import { useSyncExternalStore } from 'react';
import { WorldMap, MapPin, PinIconType } from '../../types/map';

const STORAGE_KEY = 'openscriv_world_maps_data';

export const DEFAULT_MAP: WorldMap = {
  id: 'map_default_eldoria',
  name: 'Eldoria Krallık Haritası',
  description: 'Ana hikayenin geçtiği kuzey ve güney eyaletleri.',
  imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23e8dec8"/><path d="M50 150 Q200 80 400 120 T750 200 L700 500 Q500 550 250 480 Z" fill="%23d6c7a1" stroke="%238c7b5b" stroke-width="4"/><text x="350" y="300" font-family="serif" font-size="24" fill="%237a6949">ELDORIA</text></svg>',
  scaleLabel: '1 cm = 100 mil',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pins: [
    {
      id: 'pin_capital',
      mapId: 'map_default_eldoria',
      title: 'Başkent Valenor',
      description: 'Kraliyet sarayı ve büyük kütüphanenin bulunduğu kadim şehir.',
      xPercent: 48,
      yPercent: 42,
      iconType: 'castle',
      color: '#dc2626',
      relatedSceneIds: ['doc-1']
    },
    {
      id: 'pin_port',
      mapId: 'map_default_eldoria',
      title: 'Sisli Liman',
      description: 'Tüccar gemilerinin ve kaçakçıların buluşma noktası.',
      xPercent: 72,
      yPercent: 65,
      iconType: 'port',
      color: '#2563eb',
      relatedSceneIds: ['doc-2']
    }
  ]
};

export interface MapStoreSnapshot {
  maps: WorldMap[];
  activeMapId: string;
}

export class MapStore {
  private maps: WorldMap[] = [];
  private activeMapId: string = DEFAULT_MAP.id;
  private cachedSnapshot: MapStoreSnapshot;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.cachedSnapshot = { maps: this.maps, activeMapId: this.activeMapId };
    this.loadFromStorage();
    this.updateSnapshot();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.maps = parsed;
            this.activeMapId = this.maps[0].id;
            return;
          }
        }
      }
    } catch {
      // Ignore
    }
    this.maps = [{ ...DEFAULT_MAP }];
    this.activeMapId = DEFAULT_MAP.id;
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.maps));
      }
    } catch {
      // Ignore
    }
    this.updateSnapshot();
    this.notify();
  }

  private updateSnapshot() {
    this.cachedSnapshot = {
      maps: [...this.maps],
      activeMapId: this.activeMapId
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): MapStoreSnapshot => {
    return this.cachedSnapshot;
  };

  public getState() {
    return {
      ...this.getSnapshot(),
      getActiveMap: this.getActiveMap.bind(this),
      setActiveMapId: this.setActiveMapId.bind(this),
      createMap: this.createMap.bind(this),
      updateMap: this.updateMap.bind(this),
      deleteMap: this.deleteMap.bind(this),
      addPin: this.addPin.bind(this),
      updatePin: this.updatePin.bind(this),
      deletePin: this.deletePin.bind(this),
      linkSceneToPin: this.linkSceneToPin.bind(this),
      unlinkSceneFromPin: this.unlinkSceneFromPin.bind(this),
      exportToJson: this.exportToJson.bind(this),
      importFromJson: this.importFromJson.bind(this),
      resetToDefault: this.resetToDefault.bind(this)
    };
  }

  public getActiveMap(): WorldMap | undefined {
    return this.maps.find((m) => m.id === this.activeMapId) || this.maps[0];
  }

  public setActiveMapId(id: string) {
    if (this.maps.some((m) => m.id === id)) {
      this.activeMapId = id;
      this.updateSnapshot();
      this.notify();
    }
  }

  public createMap(data: Omit<WorldMap, 'id' | 'createdAt' | 'updatedAt' | 'pins'>): WorldMap {
    const id = `map_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMap: WorldMap = {
      ...data,
      id,
      pins: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.maps.push(newMap);
    this.activeMapId = id;
    this.saveToStorage();
    return newMap;
  }

  public updateMap(id: string, partial: Partial<Omit<WorldMap, 'id' | 'pins'>>) {
    const idx = this.maps.findIndex((m) => m.id === id);
    if (idx === -1) return;
    this.maps[idx] = {
      ...this.maps[idx],
      ...partial,
      updatedAt: new Date().toISOString()
    };
    this.saveToStorage();
  }

  public deleteMap(id: string): boolean {
    if (this.maps.length <= 1) return false; // Keep at least one
    const initial = this.maps.length;
    this.maps = this.maps.filter((m) => m.id !== id);
    if (this.maps.length < initial) {
      if (this.activeMapId === id) {
        this.activeMapId = this.maps[0].id;
      }
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public addPin(mapId: string, pinData: Omit<MapPin, 'id' | 'mapId'>): MapPin {
    const map = this.maps.find((m) => m.id === mapId);
    if (!map) throw new Error('Harita bulunamadı');

    const newPin: MapPin = {
      ...pinData,
      id: `pin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mapId,
      xPercent: Math.max(0, Math.min(100, pinData.xPercent)),
      yPercent: Math.max(0, Math.min(100, pinData.yPercent))
    };

    map.pins.push(newPin);
    map.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return newPin;
  }

  public updatePin(mapId: string, pinId: string, partial: Partial<Omit<MapPin, 'id' | 'mapId'>>) {
    const map = this.maps.find((m) => m.id === mapId);
    if (!map) return;

    const pinIdx = map.pins.findIndex((p) => p.id === pinId);
    if (pinIdx === -1) return;

    map.pins[pinIdx] = {
      ...map.pins[pinIdx],
      ...partial,
      xPercent:
        partial.xPercent !== undefined
          ? Math.max(0, Math.min(100, partial.xPercent))
          : map.pins[pinIdx].xPercent,
      yPercent:
        partial.yPercent !== undefined
          ? Math.max(0, Math.min(100, partial.yPercent))
          : map.pins[pinIdx].yPercent
    };
    map.updatedAt = new Date().toISOString();
    this.saveToStorage();
  }

  public deletePin(mapId: string, pinId: string): boolean {
    const map = this.maps.find((m) => m.id === mapId);
    if (!map) return false;

    const initial = map.pins.length;
    map.pins = map.pins.filter((p) => p.id !== pinId);
    if (map.pins.length < initial) {
      map.updatedAt = new Date().toISOString();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public linkSceneToPin(mapId: string, pinId: string, sceneId: string) {
    const map = this.maps.find((m) => m.id === mapId);
    if (!map) return;
    const pin = map.pins.find((p) => p.id === pinId);
    if (!pin) return;

    if (!pin.relatedSceneIds.includes(sceneId)) {
      pin.relatedSceneIds.push(sceneId);
      this.saveToStorage();
    }
  }

  public unlinkSceneFromPin(mapId: string, pinId: string, sceneId: string) {
    const map = this.maps.find((m) => m.id === mapId);
    if (!map) return;
    const pin = map.pins.find((p) => p.id === pinId);
    if (!pin) return;

    pin.relatedSceneIds = pin.relatedSceneIds.filter((id) => id !== sceneId);
    this.saveToStorage();
  }

  public exportToJson(): string {
    return JSON.stringify(this.maps, null, 2);
  }

  public importFromJson(jsonString: string): number {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return 0;
      let count = 0;
      for (const m of parsed) {
        if (m.name && m.imageUrl) {
          this.maps.push({
            ...m,
            id: `map_imp_${Date.now()}_${count}`,
            pins: Array.isArray(m.pins) ? m.pins : []
          });
          count++;
        }
      }
      if (count > 0) this.saveToStorage();
      return count;
    } catch {
      return 0;
    }
  }

  public resetToDefault() {
    this.maps = [{ ...DEFAULT_MAP, pins: [...DEFAULT_MAP.pins] }];
    this.activeMapId = DEFAULT_MAP.id;
    this.saveToStorage();
  }
}

export const mapStore = new MapStore();

export function useMapStore() {
  const snapshot = useSyncExternalStore(mapStore.subscribe, mapStore.getSnapshot, mapStore.getSnapshot);

  return {
    ...snapshot,
    getActiveMap: mapStore.getActiveMap.bind(mapStore),
    setActiveMapId: mapStore.setActiveMapId.bind(mapStore),
    createMap: mapStore.createMap.bind(mapStore),
    updateMap: mapStore.updateMap.bind(mapStore),
    deleteMap: mapStore.deleteMap.bind(mapStore),
    addPin: mapStore.addPin.bind(mapStore),
    updatePin: mapStore.updatePin.bind(mapStore),
    deletePin: mapStore.deletePin.bind(mapStore),
    linkSceneToPin: mapStore.linkSceneToPin.bind(mapStore),
    unlinkSceneFromPin: mapStore.unlinkSceneFromPin.bind(mapStore),
    exportToJson: mapStore.exportToJson.bind(mapStore),
    importFromJson: mapStore.importFromJson.bind(mapStore),
    resetToDefault: mapStore.resetToDefault.bind(mapStore)
  };
}

useMapStore.getState = () => mapStore.getState();
