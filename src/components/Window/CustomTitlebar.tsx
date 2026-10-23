/**
 * Custom Frameless Titlebar Component
 * Phase 103: Çerçevesiz Özel Başlık Çubuğu ve Pencere Kontrolleri
 */

import React, { useState, useEffect } from 'react';
import { Feather, Minus, Square, Copy, X } from 'lucide-react';
import '../../styles/titlebar.css';

export interface CustomTitlebarProps {
  projectName?: string;
  activeDocTitle?: string;
  isDirty?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  overridePlatform?: 'win32' | 'darwin' | 'linux';
}

export const CustomTitlebar: React.FC<CustomTitlebarProps> = ({
  projectName = 'OpenScriv Projesi',
  activeDocTitle,
  isDirty = false,
  onMinimize,
  onMaximize,
  onClose,
  overridePlatform,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [platform, setPlatform] = useState<'win32' | 'darwin' | 'linux'>(
    overridePlatform || 'win32'
  );

  useEffect(() => {
    if (overridePlatform) {
      setPlatform(overridePlatform);
      return;
    }

    if (window.electronAPI?.invoke) {
      window.electronAPI.invoke('window:get-platform').then((res: any) => {
        if (res?.platform) setPlatform(res.platform);
      }).catch(() => {});

      window.electronAPI.invoke('window:is-maximized').then((res: any) => {
        if (typeof res?.isMaximized === 'boolean') setIsMaximized(res.isMaximized);
      }).catch(() => {});
    }
  }, [overridePlatform]);

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
      return;
    }
    if (window.electronAPI?.invoke) {
      window.electronAPI.invoke('window:minimize');
    }
  };

  const handleToggleMaximize = () => {
    if (onMaximize) {
      onMaximize();
      setIsMaximized(!isMaximized);
      return;
    }
    if (window.electronAPI?.invoke) {
      window.electronAPI.invoke('window:toggle-maximize').then((res: any) => {
        if (res?.ok) setIsMaximized(res.isMaximized);
      });
    } else {
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (window.electronAPI?.invoke) {
      window.electronAPI.invoke('window:close');
    }
  };

  const isMac = platform === 'darwin';

  return (
    <header
      className={`custom-titlebar ${isMac ? 'mac-mode' : ''}`}
      data-testid="custom-titlebar"
    >
      {/* macOS Traffic Lights */}
      {isMac && (
        <div className="mac-traffic-lights" data-testid="mac-traffic-lights">
          <button
            className="traffic-dot close"
            onClick={handleClose}
            title="Kapat"
            aria-label="Kapat"
          />
          <button
            className="traffic-dot minimize"
            onClick={handleMinimize}
            title="Simge Durumuna Küçült"
            aria-label="Simge Durumuna Küçült"
          />
          <button
            className="traffic-dot maximize"
            onClick={handleToggleMaximize}
            title="Büyüt/Geri Yükle"
            aria-label="Büyüt"
          />
        </div>
      )}

      {/* Brand & Left Info */}
      <div className="titlebar-brand" data-testid="titlebar-brand">
        <Feather className="titlebar-icon" />
        <span className="titlebar-title-text">{projectName}</span>
        {isDirty && (
          <span
            className="titlebar-dirty-dot"
            title="Kaydedilmemiş Değişiklikler"
            data-testid="titlebar-dirty-dot"
          />
        )}
      </div>

      {/* Draggable Center Area with Double-Click Maximize */}
      <div
        className="titlebar-drag-region"
        onDoubleClick={handleToggleMaximize}
        data-testid="titlebar-drag-region"
      >
        {activeDocTitle && (
          <span className="titlebar-doc-badge" data-testid="titlebar-doc-badge">
            📄 {activeDocTitle}
          </span>
        )}
      </div>

      {/* Windows & Linux Standard Controls */}
      {!isMac && (
        <div className="titlebar-controls" data-testid="titlebar-controls">
          <button
            className="titlebar-btn"
            onClick={handleMinimize}
            title="Simge Durumuna Küçült"
            aria-label="Küçült"
            data-testid="titlebar-btn-minimize"
          >
            <Minus size={14} />
          </button>
          <button
            className="titlebar-btn"
            onClick={handleToggleMaximize}
            title={isMaximized ? 'Aşağı Geri Yükle' : 'Ekranı Kapla'}
            aria-label={isMaximized ? 'Aşağı Geri Yükle' : 'Ekranı Kapla'}
            data-testid="titlebar-btn-maximize"
          >
            {isMaximized ? <Copy size={12} /> : <Square size={12} />}
          </button>
          <button
            className="titlebar-btn close"
            onClick={handleClose}
            title="Kapat"
            aria-label="Kapat"
            data-testid="titlebar-btn-close"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </header>
  );
};

export default CustomTitlebar;
