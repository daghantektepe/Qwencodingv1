export type PinIconType =
  | 'city'
  | 'castle'
  | 'mountain'
  | 'dungeon'
  | 'port'
  | 'camp'
  | 'landmark'
  | 'forest'
  | 'ruins';

export interface MapPin {
  id: string;
  mapId: string;
  title: string;
  description?: string;
  xPercent: number; // 0 to 100 percentage of width
  yPercent: number; // 0 to 100 percentage of height
  iconType: PinIconType;
  color?: string; // e.g. '#eab308' or '#ef4444'
  codexLocationId?: string;
  relatedSceneIds: string[];
  tags?: string[];
}

export interface WorldMap {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  scaleLabel?: string; // e.g. '1 cm = 50 km'
  pins: MapPin[];
  createdAt: string;
  updatedAt: string;
}

export interface MapViewport {
  zoom: number; // 0.5 to 4.0
  panX: number;
  panY: number;
}
