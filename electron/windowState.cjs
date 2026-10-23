/**
 * Window State Keeper (Size, Position & Multi-Monitor Resilience)
 * Phase 104: Pencere Konumu, Boyutu ve Çoklu Monitör Durum Hafızası
 */

const { app, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 820;

function getStateFilePath() {
  try {
    return path.join(app.getPath('userData'), 'window-state.json');
  } catch {
    return path.join(process.cwd(), 'window-state.json');
  }
}

function loadSavedState() {
  try {
    const file = getStateFilePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return data;
    }
  } catch (err) {
    console.warn('[windowState] Durum dosyası okunamadı, varsayılanlar kullanılacak:', err.message);
  }
  return null;
}

function saveWindowState(state) {
  try {
    const file = getStateFilePath();
    fs.writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[windowState] Durum kaydedilemedi:', err.message);
  }
}

function isInsideDisplays(bounds, displays) {
  if (!bounds || typeof bounds.x !== 'number' || typeof bounds.y !== 'number') {
    return false;
  }
  return displays.some((display) => {
    const db = display.bounds;
    return (
      bounds.x >= db.x &&
      bounds.y >= db.y &&
      bounds.x + 100 <= db.x + db.width &&
      bounds.y + 100 <= db.y + db.height
    );
  });
}

function getSanitizedWindowState() {
  const saved = loadSavedState();
  let displays = [];
  try {
    displays = screen.getAllDisplays();
  } catch {
    displays = [{ bounds: { x: 0, y: 0, width: 1920, height: 1080 } }];
  }

  if (saved && isInsideDisplays(saved, displays)) {
    return {
      x: saved.x,
      y: saved.y,
      width: saved.width || DEFAULT_WIDTH,
      height: saved.height || DEFAULT_HEIGHT,
      isMaximized: Boolean(saved.isMaximized),
    };
  }

  // Güvenli sıfırlama (birincil monitörün ortasında)
  const primary = (displays && displays[0]) || { bounds: { x: 0, y: 0, width: 1920, height: 1080 } };
  const width = Math.min(DEFAULT_WIDTH, primary.bounds.width - 40);
  const height = Math.min(DEFAULT_HEIGHT, primary.bounds.height - 40);
  const x = Math.round(primary.bounds.x + (primary.bounds.width - width) / 2);
  const y = Math.round(primary.bounds.y + (primary.bounds.height - height) / 2);

  return {
    x,
    y,
    width,
    height,
    isMaximized: false,
  };
}

function trackWindowState(win) {
  let debounceTimer = null;

  const updateState = () => {
    if (!win || win.isDestroyed()) return;
    const isMaximized = win.isMaximized();
    let bounds = {};
    if (!isMaximized) {
      bounds = win.getBounds();
    }
    const state = {
      ...bounds,
      isMaximized,
      savedAt: new Date().toISOString(),
    };
    saveWindowState(state);
  };

  const scheduleUpdate = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateState, 500);
  };

  win.on('resize', scheduleUpdate);
  win.on('move', scheduleUpdate);
  win.on('close', updateState);
}

module.exports = {
  loadSavedState,
  saveWindowState,
  isInsideDisplays,
  getSanitizedWindowState,
  trackWindowState,
};
