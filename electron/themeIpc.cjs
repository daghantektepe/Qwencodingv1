/**
 * Native OS Theme & Accent Color Synchronization
 * Phase 116: İşletim Sistemi Tema & Vurgu Rengi Senkronu
 */

let electron = {};
try {
  const req = require('electron');
  if (req && typeof req === 'object') {
    electron = req;
  }
} catch {
  electron = {};
}

const { nativeTheme, systemPreferences, ipcMain, BrowserWindow } = electron;

function getSystemThemeInfo() {
  const isDark = nativeTheme ? nativeTheme.shouldUseDarkColors : false;
  let accentColor = '#3b82f6'; // Fallback mavi

  if (systemPreferences && typeof systemPreferences.getAccentColor === 'function') {
    try {
      const raw = systemPreferences.getAccentColor();
      if (raw) {
        accentColor = `#${raw.slice(0, 6)}`;
      }
    } catch {
      // Platform desteklemiyor olabilir
    }
  }

  return {
    isDark,
    themeSource: nativeTheme ? nativeTheme.themeSource : 'system',
    accentColor,
  };
}

function broadcastThemeChange() {
  const info = getSystemThemeInfo();
  if (BrowserWindow && typeof BrowserWindow.getAllWindows === 'function') {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed() && win.webContents) {
        win.webContents.send('theme:changed', info);
      }
    }
  }
}

function registerThemeIpcHandlers() {
  if (nativeTheme && typeof nativeTheme.on === 'function') {
    nativeTheme.on('updated', () => {
      broadcastThemeChange();
    });
  }

  if (ipcMain && typeof ipcMain.handle === 'function') {
    ipcMain.handle('theme:get-system-info', () => {
      return getSystemThemeInfo();
    });

    ipcMain.handle('theme:set-source', (_evt, { source }) => {
      if (nativeTheme) {
        nativeTheme.themeSource = source; // 'system' | 'light' | 'dark'
        broadcastThemeChange();
      }
      return getSystemThemeInfo();
    });
  }
}

module.exports = {
  getSystemThemeInfo,
  broadcastThemeChange,
  registerThemeIpcHandlers,
};
