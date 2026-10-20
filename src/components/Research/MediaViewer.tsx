import { useState, useRef, useCallback, useEffect } from 'react';
import { ResearchMedia, MEDIA_TYPE_LABELS, MEDIA_TYPE_ICONS, MEDIA_CATEGORY_LABELS } from '../../types/research';
import { getResearchStore } from '../../services/researchStore';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, X, Download } from 'lucide-react';

interface MediaViewerProps {
  media: ResearchMedia;
  onClose: () => void;
}

export default function MediaViewer({ media, onClose }: MediaViewerProps) {
  const store = getResearchStore();
  const [zoom, setZoom] = useState(media.zoomLevel || 1);
  const [pan, setPan] = useState({ x: media.panX || 0, y: media.panY || 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save viewer state on unmount
  useEffect(() => {
    return () => {
      store.dispatch({
        type: 'UPDATE_MEDIA_VIEWER_STATE',
        payload: {
          id: media.id,
          zoomLevel: zoom,
          panX: pan.x,
          panY: pan.y,
        },
      });
    };
  }, [media.id, zoom, pan.x, pan.y, store]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

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
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.25, Math.min(5, prev + delta)));
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = media.fileData;
    link.download = media.fileName;
    link.click();
  }, [media.fileData, media.fileName]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const renderContent = () => {
    switch (media.type) {
      case 'image':
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
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-6xl">{MEDIA_TYPE_ICONS.audio}</div>
            <div className="text-lg font-medium text-gray-700">{media.title}</div>
            <audio controls className="w-full max-w-md">
              <source src={media.fileData} type={media.mimeType} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );

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

      case 'web-archive':
        return (
          <iframe
            src={media.fileData}
            className="w-full h-full border-0"
            title={media.title}
            sandbox="allow-same-origin"
          />
        );

      case 'document':
      case 'note':
        return (
          <div className="p-6 overflow-auto h-full">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {media.fileData}
              </pre>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">{MEDIA_TYPE_ICONS[media.type]}</div>
              <p className="text-gray-500">Preview not available for this file type</p>
            </div>
          </div>
        );
    }
  };

  const showZoomControls = media.type === 'image' || media.type === 'map';

  return (
    <div
      data-testid="media-viewer-backdrop"
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 ${
        isFullscreen ? 'p-0' : 'p-8'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        data-testid="media-viewer-content"
        className={`bg-white rounded-xl shadow-2xl flex flex-col ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[80vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{MEDIA_TYPE_ICONS[media.type]}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{media.title}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{MEDIA_TYPE_LABELS[media.type]}</span>
                <span>·</span>
                <span>{MEDIA_CATEGORY_LABELS[media.category]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            {showZoomControls && (
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 px-1 min-w-[40px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-gray-400 hover:text-gray-600 border-l border-gray-200"
                  title="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Actions */}
            <button
              onClick={handleDownload}
              className="p-1.5 text-gray-400 hover:text-gray-600"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-gray-400 hover:text-gray-600"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative bg-gray-50"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            {renderContent()}
          </div>
        </div>

        {/* Footer - Notes */}
        {media.notes && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">Notes</div>
            <p className="text-sm text-gray-700">{media.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
