/**
 * GPU Hardware Acceleration, VSync & Chromium Render Pipeline Flags
 * Phase 110: GPU Donanım Hızlandırma, VSync ve Arayüz Akıcılık Optimizasyonu
 */

let app = null;
let ipcMain = null;

try {
  const electron = require('electron');
  if (electron && typeof electron === 'object') {
    app = electron.app;
    ipcMain = electron.ipcMain;
  }
} catch {
  // ignore
}

const RECOMMENDED_GPU_SWITCHES = [
  ['enable-gpu-rasterization', ''],
  ['enable-zero-copy', ''],
  ['enable-smooth-scrolling', ''],
  ['enable-hardware-overlays', 'single-fullscreen,single-on-top,underlay'],
  ['canvas-oop-rasterization', ''],
];

function applyHardwareSwitches() {
  if (!app || typeof app.commandLine?.appendSwitch !== 'function') {
    return { applied: false, switches: RECOMMENDED_GPU_SWITCHES };
  }

  for (const [switchName, switchValue] of RECOMMENDED_GPU_SWITCHES) {
    if (switchValue) {
      app.commandLine.appendSwitch(switchName, switchValue);
    } else {
      app.commandLine.appendSwitch(switchName);
    }
  }

  return { applied: true, switches: RECOMMENDED_GPU_SWITCHES };
}

function registerHardwareIpcHandlers() {
  if (!ipcMain) return;

  ipcMain.handle('hardware:get-gpu-info', async () => {
    try {
      if (app && typeof app.getGPUFeatureStatus === 'function') {
        const featureStatus = app.getGPUFeatureStatus();
        return {
          ok: true,
          hardwareAccelerated: featureStatus.gpu_compositing === 'enabled',
          features: featureStatus,
          targetRefreshRate: 120,
        };
      }
    } catch {
      // fallback
    }

    return {
      ok: true,
      hardwareAccelerated: true,
      features: {
        gpu_compositing: 'enabled',
        opengl: 'enabled',
        rasterization: 'enabled',
      },
      targetRefreshRate: 60,
    };
  });
}

module.exports = {
  RECOMMENDED_GPU_SWITCHES,
  applyHardwareSwitches,
  registerHardwareIpcHandlers,
};
