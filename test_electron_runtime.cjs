const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const testDataDir = process.env.OPENSCRIV_TEST_DATA_DIR;
if (!testDataDir) throw new Error('OPENSCRIV_TEST_DATA_DIR is required');
const testUserDataDir = path.join(testDataDir, 'userData');
fs.mkdirSync(testUserDataDir, { recursive: true });
app.setPath('documents', testDataDir);
app.setPath('userData', testUserDataDir);

function finish(code) {
  setTimeout(() => {
    app.exit(code);
  }, 250);
}

ipcMain.handle('save-document', (_event, payload) => {
  if (!payload?.projectId || !payload?.docId || typeof payload.content !== 'string') {
    throw new Error('Invalid save-document payload');
  }
  return { ok: true };
});

ipcMain.handle('window:get-platform', () => ({ platform: process.platform }));
ipcMain.handle('window:is-maximized', () => ({ isMaximized: false }));
ipcMain.handle('window:minimize', () => ({ ok: true }));
ipcMain.handle('window:toggle-maximize', () => ({ ok: true, isMaximized: true }));
ipcMain.handle('window:close', () => ({ ok: true }));

app.whenReady().then(() => {
  console.log('[TEST] Electron app ready!');
  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log('[RENDERER CONSOLE]', level, message, 'at', sourceId, line);
  });

  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  win.webContents.on('did-finish-load', () => {
    console.log('[TEST] dist/index.html loaded successfully in real Electron window!');
    setTimeout(() => {
      win.webContents
        .executeJavaScript(`
          ({
            title: document.title,
            hasRoot: !!document.getElementById('root'),
            rootHtmlLength: document.getElementById('root')?.innerHTML.length || 0,
            bodyText: document.body.innerText.slice(0, 200),
            hasBrand: document.body.innerText.includes('OpenScriv'),
            hasElectronApi: typeof window.electronAPI !== 'undefined',
            hasApi: typeof window.api !== 'undefined',
            hasBinder: !!document.querySelector('aside[aria-label="Binder"]'),
            hasEditor: document.body.innerText.includes('Editör')
          })
        `)
        .then((res) => {
          console.log('[TEST] DOM & IPC Bridge Validation:', JSON.stringify(res));
          if (
            !res.hasElectronApi ||
            !res.hasBrand ||
            !res.hasRoot ||
            res.rootHtmlLength === 0 ||
            !res.hasBinder ||
            !res.hasEditor
          ) {
            console.error('[TEST FAILED] Missing required UI or Electron bridge elements');
            finish(1);
          } else {
            console.log('[TEST SUCCESS] Electron runtime and rendered UI 100% verified!');
            finish(0);
          }
        })
        .catch((err) => {
          console.error('[TEST ERROR]', err);
          finish(1);
        });
    }, 1000);
  });

  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('[TEST FAILED LOAD]', code, desc);
    finish(1);
  });
});
