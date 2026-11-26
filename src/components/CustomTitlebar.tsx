import React, { useState, useEffect } from 'react';
import './CustomTitlebar.css';

interface CustomTitlebarProps {
  isDirty?: boolean;
  overridePlatform?: string;
}

export const CustomTitlebar: React.FC<CustomTitlebarProps> = ({ isDirty = false, overridePlatform }) => {
  const [platform, setPlatform] = useState<string>('win32');

  useEffect(() => {
    if (overridePlatform) {
      setPlatform(overridePlatform);
    } else {
      // Detect platform
      const nav = navigator as any;
      if (nav.platform) {
        if (nav.platform.includes('Mac')) {
          setPlatform('darwin');
        } else if (nav.platform.includes('Win')) {
          setPlatform('win32');
        } else {
          setPlatform('linux');
        }
      }
    }
  }, [overridePlatform]);

  const isMac = platform === 'darwin';

  return (
    <div className="custom-titlebar" data-testid="custom-titlebar">
      {isMac ? (
        <div className="mac-traffic-lights" data-testid="mac-traffic-lights">
          <span className="light close"></span>
          <span className="light minimize"></span>
          <span className="light maximize"></span>
        </div>
      ) : (
        <div className="titlebar-controls" data-testid="titlebar-controls">
          <button className="control-btn minimize">_</button>
          <button className="control-btn maximize">□</button>
          <button className="control-btn close">×</button>
        </div>
      )}
      
      <div className="titlebar-content">
        <span className="title">Scrivener</span>
        {isDirty && (
          <span className="dirty-indicator" data-testid="titlebar-dirty-dot">
            ●
          </span>
        )}
      </div>
    </div>
  );
};
