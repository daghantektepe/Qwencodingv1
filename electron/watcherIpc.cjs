/**
 * Native File Watcher & External Synchronization IPC Module
 * Phase 108: Yerel Dosya Değişiklik İzleyicisi ve Otomatik Eşzamanlama (Native File Watcher)
 */

const { ipcMain, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const activeWatchers = new Map();
const recentInternalWrites = new Map();

function markInternalWrite(filePath) {
  const norm = path.normalize(filePath).toLowerCase();
  recentInternalWrites.set(norm, Date.now());
}

function isInternalWrite(filePath) {
  const norm = path.normalize(filePath).toLowerCase();
  const time = recentInternalWrites.get(norm);
  if (!time) return false;
  if (Date.now() - time < 2000) {
    return true; // Uygulamanın kendi kaydı
  }
  recentInternalWrites.delete(norm);
  return false;
}

function startWatching(packagePath, targetWindow) {
  stopWatching(packagePath);

  if (!fs.existsSync(packagePath)) return { ok: false, error: 'Dizin bulunamadı.' };

  try {
    let debounceTimer = null;

    const watcher = fs.watch(packagePath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      const fullPath = path.join(packagePath, filename);

      // Geçici .tmp dosyalarını veya dahili kayıtları yoksay
      if (filename.endsWith('.tmp') || isInternalWrite(fullPath)) {
        return;
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (targetWindow && !targetWindow.isDestroyed() && targetWindow.webContents) {
          targetWindow.webContents.send('watcher:file-changed', {
            packagePath,
            relativePath: filename.replace(/\\/g, '/'),
            eventType,
            timestamp: Date.now(),
          });
        }
      }, 300);
    });

    activeWatchers.set(packagePath, watcher);
    return { ok: true, packagePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function stopWatching(packagePath) {
  if (activeWatchers.has(packagePath)) {
    try {
      activeWatchers.get(packagePath).close();
    } catch {}
    activeWatchers.delete(packagePath);
    return { ok: true };
  }
  return { ok: false };
}

function registerWatcherHandlers(mainWindow) {
  ipcMain.handle('watcher:start', (_evt, { packagePath }) => {
    return startWatching(packagePath, mainWindow);
  });

  ipcMain.handle('watcher:stop', (_evt, { packagePath }) => {
    return stopWatching(packagePath);
  });
}

module.exports = {
  startWatching,
  stopWatching,
  markInternalWrite,
  isInternalWrite,
  registerWatcherHandlers,
};
