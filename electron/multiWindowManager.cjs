/**
 * Detached Multi-Window & Floating Tools Bridge
 * Phase 105: Çoklu Pencere (Detached Multi-Window) ve Yüzen Araçlar Köprüsü
 */

const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const detachedWindows = new Map();

function createDetachedWindow({ windowId, title, width = 800, height = 600, route = '', parent = null }) {
  if (detachedWindows.has(windowId)) {
    const existing = detachedWindows.get(windowId);
    if (!existing.isDestroyed()) {
      existing.show();
      existing.focus();
      return { ok: true, reused: true, windowId };
    }
    detachedWindows.delete(windowId);
  }

  const isDev = process.env.NODE_ENV === 'development' || Boolean(process.env.VITE_DEV_SERVER_URL);
  const win = new BrowserWindow({
    width,
    height,
    title: title || `OpenScriv - ${windowId}`,
    backgroundColor: '#faf8f5',
    parent: parent || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  const targetUrl = isDev
    ? `http://127.0.0.1:5173#${route}`
    : `file://${distPath}#${route}`;

  if (isDev) {
    win.loadURL(targetUrl).catch(() => win.loadFile(distPath, { hash: route }));
  } else {
    win.loadFile(distPath, { hash: route });
  }

  win.on('closed', () => {
    detachedWindows.delete(windowId);
  });

  detachedWindows.set(windowId, win);
  return { ok: true, created: true, windowId };
}

function broadcastToAllWindows(channel, payload, senderId = null) {
  const all = BrowserWindow.getAllWindows();
  for (const win of all) {
    if (!win.isDestroyed()) {
      win.webContents.send('window:sync-event', {
        channel,
        payload,
        senderId,
        timestamp: Date.now(),
      });
    }
  }
}

function registerMultiWindowHandlers() {
  ipcMain.handle('window:open-detached', async (_event, config) => {
    try {
      if (!config?.windowId) throw new Error('windowId zorunludur.');
      return createDetachedWindow(config);
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('window:close-detached', async (_event, { windowId }) => {
    if (detachedWindows.has(windowId)) {
      const win = detachedWindows.get(windowId);
      if (!win.isDestroyed()) win.close();
      detachedWindows.delete(windowId);
      return { ok: true };
    }
    return { ok: false, error: 'Pencere bulunamadı.' };
  });

  ipcMain.handle('window:broadcast-event', async (_event, { channel, payload, senderId }) => {
    broadcastToAllWindows(channel, payload, senderId);
    return { ok: true };
  });
}

module.exports = {
  detachedWindows,
  createDetachedWindow,
  broadcastToAllWindows,
  registerMultiWindowHandlers,
};
