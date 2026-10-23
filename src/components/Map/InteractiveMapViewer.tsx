import React, { useState, useRef } from 'react';
import { useMapStore } from '../../services/map/mapStore';
import { MapPin as MapPinType, PinIconType } from '../../types/map';
import {
  Map,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  Castle,
  Anchor,
  Compass,
  Trees,
  Mountain,
  X
} from 'lucide-react';

interface InteractiveMapViewerProps {
  onSelectScene?: (sceneId: string) => void;
  documentTitleLookup?: (sceneId: string) => string;
}

export const InteractiveMapViewer: React.FC<InteractiveMapViewerProps> = ({
  onSelectScene,
  documentTitleLookup = (id) => `Sahne ${id}`
}) => {
  const {
    maps,
    activeMapId,
    getActiveMap,
    setActiveMapId,
    createMap,
    deleteMap,
    addPin,
    updatePin,
    deletePin
  } = useMapStore();

  const activeMap = getActiveMap();

  const [zoom, setZoom] = useState<number>(1);
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);
  const [isPinPlacementMode, setIsPinPlacementMode] = useState<boolean>(false);
  const [newPinTitle, setNewPinTitle] = useState<string>('');
  const [newPinIcon, setNewPinIcon] = useState<PinIconType>('castle');
  const [isNewMapModalOpen, setIsNewMapModalOpen] = useState<boolean>(false);
  const [newMapName, setNewMapName] = useState<string>('');
  const [newMapImageUrl, setNewMapImageUrl] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinPlacementMode || !activeMap) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    const pin = addPin(activeMap.id, {
      title: newPinTitle.trim() || 'Yeni Mekan',
      description: 'Harita üzerinde işaretlenen nokta.',
      xPercent,
      yPercent,
      iconType: newPinIcon,
      color: '#d97706',
      relatedSceneIds: []
    });

    setSelectedPin(pin);
    setIsPinPlacementMode(false);
    setNewPinTitle('');
  };

  const getPinIconComponent = (type: PinIconType) => {
    switch (type) {
      case 'castle':
        return Castle;
      case 'port':
        return Anchor;
      case 'forest':
        return Trees;
      case 'mountain':
        return Mountain;
      case 'city':
      case 'landmark':
      default:
        return MapPin;
    }
  };

  const handleCreateNewMap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim() || !newMapImageUrl.trim()) return;

    createMap({
      name: newMapName.trim(),
      imageUrl: newMapImageUrl.trim(),
      description: 'Özel dünya haritası.'
    });

    setNewMapName('');
    setNewMapImageUrl('');
    setIsNewMapModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-100 select-none overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/90 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-semibold tracking-wide">Dünya & Mekan Haritası</h2>
          </div>

          {/* Map Select */}
          <select
            value={activeMap?.id || activeMapId}
            onChange={(e) => setActiveMapId(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none"
          >
            {maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.pins.length} pin)
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsNewMapModalOpen(true)}
            className="text-xs px-2 py-1 rounded bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-600 dark:text-stone-300 transition-colors"
          >
            + Harita Ekle
          </button>
        </div>

        {/* Controls: Zoom & Add Pin */}
        <div className="flex items-center gap-2">
          {/* Add Pin toggle button */}
          <button
            onClick={() => setIsPinPlacementMode(!isPinPlacementMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isPinPlacementMode
                ? 'bg-amber-600 text-white shadow-md animate-pulse'
                : 'bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isPinPlacementMode ? 'Haritaya Tıkla...' : '+ Pin Yerleştir'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l pl-2 border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
              title="Uzaklaş"
              className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold w-12 text-center">
              %{Math.round(zoom * 100)}
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.2).toFixed(1))))}
              title="Yakınlaş"
              className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              title="Sıfırla"
              className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-6 bg-stone-200/60 dark:bg-stone-950/70"
      >
        {activeMap ? (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out'
            }}
            onClick={handleMapClick}
            className={`relative max-w-full rounded-xl shadow-2xl overflow-hidden border-2 border-stone-300 dark:border-stone-700 bg-stone-50 select-none ${
              isPinPlacementMode ? 'cursor-crosshair' : 'cursor-default'
            }`}
          >
            {/* Map image or SVG representation */}
            <img
              src={activeMap.imageUrl}
              alt={activeMap.name}
              className="block max-h-[75vh] w-auto object-contain pointer-events-none"
            />

            {/* Pins layer */}
            {activeMap.pins.map((pin) => {
              const IconComp = getPinIconComponent(pin.iconType);
              const isSelected = selectedPin?.id === pin.id;

              return (
                <div
                  key={pin.id}
                  style={{
                    left: `${pin.xPercent}%`,
                    top: `${pin.yPercent}%`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin(pin);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-20 group`}
                >
                  <div
                    style={{ backgroundColor: pin.color || '#d97706' }}
                    className={`p-1.5 rounded-full shadow-lg text-white border-2 border-white dark:border-stone-900 ${
                      isSelected ? 'ring-4 ring-amber-400 scale-125 animate-bounce' : ''
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>

                  {/* Pin title badge on hover */}
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                    {pin.title}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-stone-400">Harita yüklenemedi.</div>
        )}
      </div>

      {/* Selected Pin Details Sidebar / Floating Panel */}
      {selectedPin && (
        <div className="absolute right-4 top-16 bottom-4 w-80 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-300 dark:border-stone-700 p-4 flex flex-col gap-3 z-30">
          <div className="flex items-center justify-between border-b pb-2 border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold truncate">{selectedPin.title}</h3>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="p-1 rounded text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            {selectedPin.description || 'Mekan açıklaması girilmemiş.'}
          </p>

          <div className="text-xs text-stone-500 font-mono">
            Konum: %{selectedPin.xPercent} X, %{selectedPin.yPercent} Y
          </div>

          {/* Related Scenes List */}
          <div className="flex-1 overflow-y-auto border-t pt-2 border-stone-100 dark:border-stone-700/60">
            <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-200 mb-2">
              Bu Mekanda Geçen Sahneler ({selectedPin.relatedSceneIds.length})
            </h4>

            {selectedPin.relatedSceneIds.length === 0 ? (
              <p className="text-[11px] text-stone-400 italic">
                Bu mekana henüz bağlı sahne bulunmuyor.
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedPin.relatedSceneIds.map((sceneId) => (
                  <div
                    key={sceneId}
                    className="p-2 rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium truncate">{documentTitleLookup(sceneId)}</span>
                    {onSelectScene && (
                      <button
                        onClick={() => onSelectScene(sceneId)}
                        className="text-amber-600 hover:underline flex items-center gap-1 flex-shrink-0"
                      >
                        <span>Aç</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Pin Button */}
          {activeMap && (
            <div className="border-t pt-2 border-stone-200 dark:border-stone-700 flex justify-end">
              <button
                onClick={() => {
                  deletePin(activeMap.id, selectedPin.id);
                  setSelectedPin(null);
                }}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Pini Sil</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Map Modal */}
      {isNewMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateNewMap}
            className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl max-w-md w-full p-5 border border-stone-300 dark:border-stone-700 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between border-b pb-2 border-stone-200 dark:border-stone-700">
              <h3 className="text-sm font-bold">Yeni Harita Ekle</h3>
              <button
                type="button"
                onClick={() => setIsNewMapModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Harita Adı:</label>
              <input
                type="text"
                required
                placeholder="Örn: Kuzey Krallığı veya Yeraltı Mağaraları"
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Görsel URL veya Data URI:</label>
              <input
                type="text"
                required
                placeholder="https://... veya data:image/..."
                value={newMapImageUrl}
                onChange={(e) => setNewMapImageUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setIsNewMapModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white"
              >
                Haritayı Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
