import { useState, useRef, useCallback } from 'react';
import { ResearchMedia } from '../../types/research';
import { getResearchStore } from '../../services/researchStore';
import MediaViewer from './MediaViewer';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';

interface SplitViewProps {
  leftContent: React.ReactNode;
  media: ResearchMedia | null;
  onCloseMedia: () => void;
}

export default function SplitView({ leftContent, media, onCloseMedia }: SplitViewProps) {
  const store = getResearchStore();
  const state = store.getState();
  const [isResizing, setIsResizing] = useState(false);
  const [ratio, setRatio] = useState(state.splitViewRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedRatio = Math.max(20, Math.min(80, newRatio));

      setRatio(clampedRatio);
      store.dispatch({ type: 'SET_SPLIT_RATIO', payload: clampedRatio });
    },
    [isResizing, store]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  if (!media) {
    return <div className="h-full">{leftContent}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="h-full flex relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left panel */}
      <div
        className="h-full overflow-auto"
        style={{ width: `${ratio}%` }}
      >
        {leftContent}
      </div>

      {/* Resize handle */}
      <div
        className={`w-2 bg-gray-200 hover:bg-indigo-400 cursor-col-resize flex items-center justify-center transition-colors ${
          isResizing ? 'bg-indigo-400' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Right panel - Media viewer */}
      <div
        className="h-full overflow-hidden"
        style={{ width: `${100 - ratio}%` }}
      >
        <div className="h-full relative">
          {/* Close button */}
          <button
            onClick={onCloseMedia}
            className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 rounded-lg shadow-md hover:bg-white"
            title="Close media viewer"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* Media content */}
          <MediaContent media={media} />
        </div>
      </div>
    </div>
  );
}

// Inline media content for split view (without modal overlay)
function MediaContent({ media }: { media: ResearchMedia }) {
  const store = getResearchStore();
  const [zoom, setZoom] = useState(media.zoomLevel || 1);
  const [pan, setPan] = useState({ x: media.panX || 0, y: media.panY || 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Save state
    store.dispatch({
      type: 'UPDATE_MEDIA_VIEWER_STATE',
      payload: {
        id: media.id,
        zoomLevel: zoom,
        panX: pan.x,
        panY: pan.y,
      },
    });
  }, [media.id, zoom, pan.x, pan.y, store]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.25, Math.min(5, prev + delta)));
  }, []);

  const renderContent = () => {
    switch (media.type) {
      case 'image':
      case 'map':
        return (
          <img
            src={media.fileData}
            alt={media.title}
            className="max-w-none select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            draggable={false}
          />
        );

      case 'pdf':
        return (
          <iframe
            src={media.fileData}
            className="w-full h-full border-0"
            title={media.title}
          />
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
            <div className="text-6xl">🎵</div>
            <div className="text-lg font-medium text-gray-700">{media.title}</div>
            <audio controls className="w-full max-w-md">
              <source src={media.fileData} type={media.mimeType} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );

      case 'document':
      case 'note':
        return (
          <div className="p-4 overflow-auto h-full">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {media.fileData}
            </pre>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📎</div>
              <p className="text-gray-500">Preview not available</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="w-full h-full bg-gray-50 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{media.type === 'image' ? '🖼️' : media.type === 'pdf' ? '📄' : '📎'}</span>
            <span className="text-sm font-medium text-gray-800 truncate">{media.title}</span>
          </div>
          {(media.type === 'image' || media.type === 'map') && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <button
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="px-1.5 py-0.5 hover:bg-gray-100 rounded"
              >
                -
              </button>
              <span className="min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
                className="px-1.5 py-0.5 hover:bg-gray-100 rounded"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="w-full h-[calc(100%-40px)] flex items-center justify-center overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
