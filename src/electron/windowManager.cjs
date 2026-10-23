/**
 * windowManager.cjs — Faz 81: Çoklu Monitör ve Harici Ekran Pencere Yöneticisi
 */

let BrowserWindow, screen, ipcMain;
try {
  const electron = require('electron');
  BrowserWindow = electron.BrowserWindow;
  screen = electron.screen;
  ipcMain = electron.ipcMain;
} catch {
  // Non-electron test environment
}

class WindowManager {
  constructor() {
    this.popoutWindows = new Map();
    this.mainWindow = null;
  }

  publicInit(mainWindow) {
    this.mainWindow = mainWindow;
    this.registerIpcHandlers();
  }

  registerIpcHandlers() {
    if (!ipcMain) return;

    ipcMain.handle('window:get-displays', () => {
      if (!screen) return [];
      const primary = screen.getPrimaryDisplay();
      const all = screen.getAllDisplays();
      return all.map((d) => ({
        id: d.id,
        bounds: d.bounds,
        isPrimary: d.id === primary.id,
        label: d.id === primary.id ? 'Ana Ekran' : 'Harici Ekran',
      }));
    });

    ipcMain.handle('window:open-popout', (event, { viewId, title, displayId, width = 900, height = 700 }) => {
      return this.createPopoutWindow(viewId, title, { displayId, width, height });
    });

    ipcMain.handle('window:close-popout', (event, { popoutId }) => {
      return this.closePopoutWindow(popoutId);
    });

    ipcMain.on('window:sync-state', (event, payload) => {
      this.broadcastSync(payload, event.sender.id);
    });
  }

  createPopoutWindow(viewId, title = 'OpenScriv Panel', { displayId, width = 900, height = 700 } = {}) {
    if (!BrowserWindow) {
      const mockId = `mock-win-${Date.now()}`;
      this.popoutWindows.set(mockId, { viewId, title, id: mockId });
      return { id: mockId, success: true };
    }

    let x, y;
    if (screen && displayId) {
      const targetDisplay = screen.getAllDisplays().find((d) => d.id === displayId);
      if (targetDisplay) {
        x = targetDisplay.bounds.x + 50;
        y = targetDisplay.bounds.y + 50;
      }
    }

    const win = new BrowserWindow({
      width,
      height,
      x,
      y,
      title: `OpenScriv — ${title}`,
      backgroundColor: '#020617',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const popoutId = `popout-${Date.now()}`;
    this.popoutWindows.set(popoutId, win);

    win.on('closed', () => {
      this.popoutWindows.delete(popoutId);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('window:popout-closed', { popoutId, viewId });
      }
    });

    return { id: popoutId, success: true };
  }

  closePopoutWindow(popoutId) {
    const win = this.popoutWindows.get(popoutId);
    if (win) {
      if (typeof win.close === 'function') win.close();
      this.popoutWindows.delete(popoutId);
      return true;
    }
    return false;
  }

  broadcastSync(payload, senderWebContentsId) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.webContents.id !== senderWebContentsId) {
        this.mainWindow.webContents.send('window:state-synced', payload);
      }
    }

    for (const [, win] of this.popoutWindows.entries()) {
      if (win && typeof win.isDestroyed === 'function' && !win.isDestroyed()) {
        if (win.webContents.id !== senderWebContentsId) {
          win.webContents.send('window:state-synced', payload);
        }
      }
    }
  }

  getOpenPopouts() {
    return Array.from(this.popoutWindows.keys());
  }
}

const windowManager = new WindowManager();
module.exports = { WindowManager, windowManager };
