/**
 * System Tray & Global Quick Note Shortcut Engine
 * Phase 106: Sistem Tepsisi (System Tray) ve Global Hızlı Not Alma Kısayolu
 */

const { Tray, Menu, globalShortcut, BrowserWindow, ipcMain, nativeImage } = require('electron');
const path = require('path');

let trayInstance = null;
let quickNoteWindow = null;

function createDummyIcon() {
  try {
    // 16x16 1-piksel şeffaf/renkli PNG buffer simülasyonu
    return nativeImage.createEmpty();
  } catch {
    return null;
  }
}

function createQuickNoteWindow(parentWindow = null) {
  if (quickNoteWindow && !quickNoteWindow.isDestroyed()) {
    quickNoteWindow.show();
    quickNoteWindow.focus();
    return quickNoteWindow;
  }

  const isDev = process.env.NODE_ENV === 'development' || Boolean(process.env.VITE_DEV_SERVER_URL);
  quickNoteWindow = new BrowserWindow({
    width: 480,
    height: 360,
    show: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    backgroundColor: '#faf8f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  if (isDev) {
    quickNoteWindow.loadURL('http://127.0.0.1:5173#quick-note').catch(() => {
      quickNoteWindow.loadFile(distPath, { hash: 'quick-note' });
    });
  } else {
    quickNoteWindow.loadFile(distPath, { hash: 'quick-note' });
  }

  quickNoteWindow.once('ready-to-show', () => {
    quickNoteWindow.show();
    quickNoteWindow.focus();
  });

  quickNoteWindow.on('blur', () => {
    // Kullanıcı dışarı tıkladığında otomatik gizle
    if (quickNoteWindow && !quickNoteWindow.isDestroyed()) {
      quickNoteWindow.hide();
    }
  });

  return quickNoteWindow;
}

function initSystemTray(mainWindow) {
  try {
    if (trayInstance && !trayInstance.isDestroyed()) {
      return trayInstance;
    }

    const icon = createDummyIcon();
    if (!icon) return null;

    trayInstance = new Tray(icon);
    trayInstance.setToolTip('OpenScriv - Yazı Stüdyosu');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'OpenScriv’i Aç',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Hızlı Not Al (Ctrl+Alt+S)',
        click: () => {
          createQuickNoteWindow(mainWindow);
        },
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        role: 'quit',
      },
    ]);

    trayInstance.setContextMenu(contextMenu);
    trayInstance.on('double-click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    // Global kısayol: Ctrl+Alt+S / Cmd+Option+S
    try {
      globalShortcut.register('CommandOrControl+Alt+S', () => {
        createQuickNoteWindow(mainWindow);
      });
    } catch (scErr) {
      console.warn('[systemTray] Global shortcut kaydedilemedi:', scErr.message);
    }

    return trayInstance;
  } catch (err) {
    console.warn('[systemTray] Tray başlatılamadı:', err.message);
    return null;
  }
}

function registerTrayIpcHandlers(mainWindow) {
  ipcMain.handle('tray:toggle-quick-note', () => {
    if (quickNoteWindow && !quickNoteWindow.isDestroyed() && quickNoteWindow.isVisible()) {
      quickNoteWindow.hide();
      return { visible: false };
    }
    createQuickNoteWindow(mainWindow);
    return { visible: true };
  });

  ipcMain.handle('tray:hide-quick-note', () => {
    if (quickNoteWindow && !quickNoteWindow.isDestroyed()) {
      quickNoteWindow.hide();
    }
    return { ok: true };
  });
}

function destroyTray() {
  try {
    globalShortcut.unregisterAll();
    if (trayInstance && !trayInstance.isDestroyed()) {
      trayInstance.destroy();
      trayInstance = null;
    }
    if (quickNoteWindow && !quickNoteWindow.isDestroyed()) {
      quickNoteWindow.destroy();
      quickNoteWindow = null;
    }
  } catch {
    // ignore
  }
}

module.exports = {
  initSystemTray,
  createQuickNoteWindow,
  registerTrayIpcHandlers,
  destroyTray,
};
