const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

// 13) GPU Donanım Hızlandırma Bayrakları (Faz 110)
try {
  const { applyHardwareSwitches } = require('./hardwareFlags.cjs');
  applyHardwareSwitches();
} catch (err) {
  console.warn('[main] hardwareFlags uygulanamadı:', err.message);
}

let mainWindow;

// --- Yerel proje dizini ayarlari ---
// Uygulama verileri tamamen kullanicinin makinesinde kalir (bulut/hesap yok).
const PROJECTS_DIR_NAME = 'OpenScrivProjects';

function getProjectsRoot() {
  const root = path.join(app.getPath('documents'), PROJECTS_DIR_NAME);
  return root;
}

function sanitizeId(rawId) {
  return String(rawId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function docFilePath(projectId, docId) {
  return path.join(
    getProjectsRoot(),
    sanitizeId(projectId),
    'docs',
    `${sanitizeId(docId)}.md`
  );
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || Boolean(process.env.VITE_DEV_SERVER_URL);
  const isDebug = isDev || process.env.OPENSCRIV_DEBUG === '1' || process.argv.includes('--debug');

  const { getSanitizedWindowState, trackWindowState } = require('./windowState.cjs');
  const winState = getSanitizedWindowState();

  mainWindow = new BrowserWindow({
    x: winState.x,
    y: winState.y,
    width: winState.width,
    height: winState.height,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#f5f2ea',
    title: 'OpenScriv - Masaüstü Yazı Stüdyosu',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'default',
  });

  if (winState.isMaximized) {
    mainWindow.maximize();
  }

  trackWindowState(mainWindow);

  // Beyaz ekran kalmasını önlemek için: pencere çizilmeye hazır olduğunda göster
  let isShown = false;
  const showWindow = () => {
    if (!isShown && mainWindow && !mainWindow.isDestroyed()) {
      isShown = true;
      mainWindow.show();
    }
  };

  mainWindow.once('ready-to-show', showWindow);

  // Donanım gecikmesi veya GPU beklemesinde pencerenin sonsuza dek gizli kalmasını önle
  setTimeout(showWindow, 1200);

  // F12 veya Ctrl+Shift+I ile geliştirici araçlarını (DevTools) aç/kapat
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (
      input.key === 'F12' ||
      ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i')
    ) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
    }
  });

  // Renderer konsol mesajlarını terminale aktar
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['DEBUG', 'LOG', 'WARN', 'ERROR'];
    const lvlName = levels[level] || 'LOG';
    const srcName = sourceId ? path.basename(sourceId) : 'renderer';
    console.log(`[Renderer ${lvlName}] ${message} (${srcName}:${line})`);
  });

  // Sayfa yükleme hatasını yakala ve kurtar
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn(`[main] did-fail-load: ${errorCode} (${errorDescription}) URL: ${validatedURL}`);
    const distPath = path.join(__dirname, '../dist/index.html');
    if (validatedURL.includes('5173') && distPath) {
      console.log('[main] Geliştirme sunucusuna ulaşılamadı, yerel derleme (dist/index.html) yükleniyor...');
      mainWindow.loadFile(distPath).catch((err) => {
        console.error('[main] dist/index.html yüklenemedi:', err);
      });
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[main] Renderer süreci kapandı/çöktü:', details);
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch(() => mainWindow.loadFile(distPath));
  } else if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173').catch(() => {
      console.log('[main] Dev port 5173 kapalı, yerel dosyadan başlatılıyor...');
      mainWindow.loadFile(distPath);
    });
  } else {
    mainWindow.loadFile(distPath);
  }

  if (isDebug) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // 1) Temel Sistem ve Doküman Kayıt IPC Kanalları
  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('get-user-data-path', () => app.getPath('userData'));

  ipcMain.handle('save-document', async (_evt, payload) => {
    try {
      const { projectId, docId, content } = payload || {};
      if (!projectId || !docId) {
        throw new Error('save-document: projectId ve docId zorunludur.');
      }
      const filePath = docFilePath(projectId, docId);
      await ensureDir(path.dirname(filePath));

      const tmpPath = `${filePath}.tmp`;
      await fs.writeFile(tmpPath, String(content ?? ''), 'utf8');
      await fs.rename(tmpPath, filePath);

      return { ok: true, path: filePath, savedAt: Date.now() };
    } catch (err) {
      console.error('[main] save-document hatasi:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('load-document', async (_evt, payload) => {
    try {
      const { projectId, docId } = payload || {};
      if (!projectId || !docId) {
        throw new Error('load-document: projectId ve docId zorunludur.');
      }
      const filePath = docFilePath(projectId, docId);
      let content = '';
      let exists = true;
      try {
        content = await fs.readFile(filePath, 'utf8');
      } catch (err) {
        if (err.code === 'ENOENT') {
          exists = false;
          content = '';
        } else {
          throw err;
        }
      }
      return { ok: true, docId, content, exists, path: filePath };
    } catch (err) {
      console.error('[main] load-document hatasi:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('load-project', async (_evt, payload) => {
    try {
      const { projectId } = payload || {};
      if (!projectId) throw new Error('load-project: projectId zorunludur.');
      const docsDir = path.join(getProjectsRoot(), sanitizeId(projectId), 'docs');
      let files = [];
      try {
        files = await fs.readdir(docsDir);
      } catch (err) {
        if (err.code === 'ENOENT') return { ok: true, documents: [] };
        throw err;
      }
      const mdFiles = files.filter((f) => f.endsWith('.md'));
      const documents = await Promise.all(
        mdFiles.map(async (f) => {
          const docId = path.basename(f, '.md');
          const content = await fs.readFile(path.join(docsDir, f), 'utf8');
          return { docId, content };
        })
      );
      return { ok: true, documents };
    } catch (err) {
      console.error('[main] load-project hatasi:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('save-project-tree', async (_evt, payload) => {
    try {
      const { projectId, tree } = payload || {};
      if (!projectId) throw new Error('save-project-tree: projectId zorunludur.');
      const projectDir = path.join(getProjectsRoot(), sanitizeId(projectId));
      await ensureDir(projectDir);
      const filePath = path.join(projectDir, 'tree.json');
      const tmpPath = `${filePath}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(tree ?? [], null, 2), 'utf8');
      await fs.rename(tmpPath, filePath);
      return { ok: true, path: filePath };
    } catch (err) {
      console.error('[main] save-project-tree hatasi:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('load-project-tree', async (_evt, payload) => {
    try {
      const { projectId } = payload || {};
      if (!projectId) throw new Error('load-project-tree: projectId zorunludur.');
      const filePath = path.join(getProjectsRoot(), sanitizeId(projectId), 'tree.json');
      let tree = [];
      try {
        tree = JSON.parse(await fs.readFile(filePath, 'utf8'));
      } catch (err) {
        if (err.code !== 'ENOENT' && !(err instanceof SyntaxError)) throw err;
      }
      return { ok: true, tree };
    } catch (err) {
      console.error('[main] load-project-tree hatasi:', err);
      return { ok: false, error: err.message };
    }
  });

  // 2) Compile & Export Modülü (Faz 12)
  try {
    require('./compile.js');
  } catch (err) {
    console.error('[main] compile.js yuklenemedi:', err);
  }

  // 3) Tam Metin Arama Modülü (Faz 11)
  try {
    const { registerSearchHandlers } = require('./search.js');
    if (typeof registerSearchHandlers === 'function') registerSearchHandlers();
  } catch (err) {
    console.error('[main] search.js yuklenemedi:', err);
  }

  // 4) Snapshots Sürümleme Modülü (Faz 10)
  try {
    const snapshots = require('./snapshots.js');
    ipcMain.handle('snapshot-create', (_e, p) => snapshots.createSnapshot(p));
    ipcMain.handle('snapshot-list', (_e, p) => snapshots.listSnapshots(p));
    ipcMain.handle('snapshot-load', (_e, p) => snapshots.loadSnapshot(p));
    ipcMain.handle('snapshot-delete', (_e, p) => snapshots.deleteSnapshot(p));
  } catch (err) {
    console.error('[main] snapshots.js yuklenemedi:', err);
  }

  // 5) Yedekleme & Kurtarma Modülü (Faz 14)
  try {
    const { registerBackupHandlers, initBackups } = require('./backup.js');
    if (typeof initBackups === 'function') initBackups();
    if (typeof registerBackupHandlers === 'function') registerBackupHandlers();
  } catch (err) {
    console.error('[main] backup.js yuklenemedi:', err);
  }

  // 6) Yerel Proje Paketi Formatı (.opscriv) Modülü (Faz 102)
  try {
    const { registerProjectIpcHandlers } = require('./projectIpc.cjs');
    if (typeof registerProjectIpcHandlers === 'function') registerProjectIpcHandlers();
  } catch (err) {
    console.error('[main] projectIpc.cjs yuklenemedi:', err);
  }

  // 8) Çoklu Pencere (Detached Multi-Window) Modülü (Faz 105)
  try {
    const { registerMultiWindowHandlers } = require('./multiWindowManager.cjs');
    if (typeof registerMultiWindowHandlers === 'function') registerMultiWindowHandlers();
  } catch (err) {
    console.error('[main] multiWindowManager.cjs yuklenemedi:', err);
  }

  // 7) Çerçevesiz Özel Başlık Çubuğu ve Pencere Kontrolleri (Faz 103)
  ipcMain.handle('window:minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
    return { ok: true };
  });

  ipcMain.handle('window:toggle-maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      return { ok: true, isMaximized: mainWindow.isMaximized() };
    }
    return { ok: false, isMaximized: false };
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
    return { ok: true };
  });

  ipcMain.handle('window:is-maximized', () => {
    return { isMaximized: mainWindow ? mainWindow.isMaximized() : false };
  });

  ipcMain.handle('window:get-platform', () => {
    return { platform: process.platform };
  });

  createWindow();

  // 9) Sistem Tepsisi ve Global Kısayol Modülü (Faz 106)
  try {
    const { initSystemTray, registerTrayIpcHandlers } = require('./systemTray.cjs');
    initSystemTray(mainWindow);
    registerTrayIpcHandlers(mainWindow);
  } catch (err) {
    console.error('[main] systemTray.cjs yuklenemedi:', err);
  }

  // 10) Tam Yerel İşletim Sistemi Menüleri (Faz 107)
  try {
    const { setupApplicationMenu } = require('./menuTemplate.cjs');
    setupApplicationMenu(mainWindow);
  } catch (err) {
    console.error('[main] menuTemplate.cjs yuklenemedi:', err);
  }

  // 11) Yerel Dosya Değişiklik İzleyicisi (Faz 108)
  try {
    const { registerWatcherHandlers } = require('./watcherIpc.cjs');
    registerWatcherHandlers(mainWindow);
  } catch (err) {
    console.error('[main] watcherIpc.cjs yuklenemedi:', err);
  }

  // 12) SQLite & FTS5 Arama Motoru (Faz 109)
  try {
    const { registerFtsHandlers } = require('./sqliteStore.cjs');
    registerFtsHandlers();
  } catch (err) {
    console.error('[main] sqliteStore.cjs yuklenemedi:', err);
  }

  // 13) GPU Donanım Hızlandırma Bilgi Servisi (Faz 110)
  try {
    const { registerHardwareIpcHandlers } = require('./hardwareFlags.cjs');
    registerHardwareIpcHandlers();
  } catch (err) {
    console.error('[main] hardwareFlags registerIpc yuklenemedi:', err);
  }

  // 14) Yerel Chromium Vektörel PDF ve Matbaa Baskı Motoru (Faz 111)
  try {
    const { registerPdfIpcHandlers } = require('./pdfPrinter.cjs');
    registerPdfIpcHandlers();
  } catch (err) {
    console.error('[main] pdfPrinter.cjs yuklenemedi:', err);
  }

  // 15) Otomatik Güncelleyici ve Sürüm Kontrolü (Faz 112)
  try {
    const { registerUpdaterHandlers } = require('./updater.cjs');
    registerUpdaterHandlers();
  } catch (err) {
    console.error('[main] updater.cjs yuklenemedi:', err);
  }

  // 16) Yerel Pano (Clipboard) ve Zengin Medya Köprüsü (Faz 114)
  try {
    const { registerClipboardHandlers } = require('./clipboardIpc.cjs');
    registerClipboardHandlers();
  } catch (err) {
    console.error('[main] clipboardIpc.cjs yuklenemedi:', err);
  }

  // 17) Yerel İmla Denetimi ve Edebi Sözlük (Faz 115)
  try {
    const { registerSpellcheckerHandlers, spellcheckerInstance } = require('./spellchecker.cjs');
    registerSpellcheckerHandlers();
    spellcheckerInstance.initSessionSpellcheck();
  } catch (err) {
    console.error('[main] spellchecker.cjs yuklenemedi:', err);
  }

  // 18) İşletim Sistemi Tema & Vurgu Rengi Senkronu (Faz 116)
  try {
    const { registerThemeIpcHandlers } = require('./themeIpc.cjs');
    registerThemeIpcHandlers();
  } catch (err) {
    console.error('[main] themeIpc.cjs yuklenemedi:', err);
  }

  // 19) Yerel İşletim Sistemi Bildirimleri (Faz 117)
  try {
    const { registerNotificationIpcHandlers } = require('./notificationIpc.cjs');
    registerNotificationIpcHandlers();
  } catch (err) {
    console.error('[main] notificationIpc.cjs yuklenemedi:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  try {
    const { destroyTray } = require('./systemTray.cjs');
    destroyTray();
  } catch {
    // ignore
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
