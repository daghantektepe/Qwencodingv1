import React, { useState, useEffect } from 'react';
import { multiWindowBridge, DisplayInfo } from '../../services/window/multiWindowBridge';

interface PopoutButtonProps {
  viewId: string;
  viewTitle: string;
  onPopoutOpened?: (popoutId: string) => void;
  className?: string;
}

export const PopoutButton: React.FC<PopoutButtonProps> = ({
  viewId,
  viewTitle,
  onPopoutOpened,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);

  useEffect(() => {
    multiWindowBridge.getDisplays().then(setDisplays);

    const unsubClosed = multiWindowBridge.subscribe('window:closed', (data: { viewId: string }) => {
      if (data?.viewId === viewId) setIsOpen(false);
    });

    return unsubClosed;
  }, [viewId]);

  const handleOpen = async (displayId?: string) => {
    setShowDisplayMenu(false);
    const popoutId = await multiWindowBridge.openPopout(viewId, viewTitle, {
      displayId,
      width: 1000,
      height: 750,
    });
    setIsOpen(true);
    onPopoutOpened?.(popoutId);
  };

  const handleToggle = () => {
    if (displays.length > 1) {
      setShowDisplayMenu(!showDisplayMenu);
    } else {
      handleOpen();
    }
  };

  return (
    <div className="relative inline-block" data-testid="popout-button-container">
      <button
        type="button"
        onClick={handleToggle}
        className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
          isOpen
            ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
            : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
        } ${className}`}
        title={isOpen ? 'Pencere ayrılmış durumda' : `${viewTitle} panelini harici ekrana ayır`}
        data-testid="popout-button"
      >
        <span className="text-sm">↗</span>
        <span>{isOpen ? 'Ayrıldı' : 'Pencereyi Ayır'}</span>
      </button>

      {/* Multiple Display Picker */}
      {showDisplayMenu && (
        <div className="absolute right-0 top-full mt-1.5 w-52 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs">
          <div className="text-[11px] font-semibold text-slate-400 mb-1 px-1">Hedef Ekranı Seçin</div>
          <div className="space-y-1">
            {displays.map((d) => (
              <button
                key={String(d.id)}
                type="button"
                onClick={() => handleOpen(String(d.id))}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>🖥️ {d.label}</span>
                {d.isPrimary && (
                  <span className="text-[9px] bg-slate-800 px-1 py-0.5 rounded text-cyan-400 font-mono">
                    Birincil
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PopoutButton;
