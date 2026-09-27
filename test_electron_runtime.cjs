const { app, BrowserWindow } = require('electron');
const path = require('path');

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
            hasBinder: document.body.innerText.includes('Binder'),
            hasEditor: document.body.innerText.includes('Editör')
          })
        `)
        .then((res) => {
          console.log('[TEST] DOM & IPC Bridge Validation:', JSON.stringify(res));
          if (!res.hasElectronApi || !res.hasBrand || !res.hasRoot || res.rootHtmlLength === 0) {
            console.error('[TEST FAILED] Missing API, Root, or Brand in rendered DOM');
            app.exit(1);
          } else {
            console.log('[TEST SUCCESS] Electron runtime and rendered UI 100% verified!');
            app.exit(0);
          }
        })
        .catch((err) => {
          console.error('[TEST ERROR]', err);
          app.exit(1);
        });
    }, 1000);
  });

  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('[TEST FAILED LOAD]', code, desc);
    app.exit(1);
  });
});
