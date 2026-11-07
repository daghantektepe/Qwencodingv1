/**
 * Faz 0: Ana süreç (Electron main) veri güvenliği ve güvenlik korumaları.
 * electron modülü require önbelleğine sahte nesneyle yerleştirilir; modüller gerçek Node require ile yüklenir.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const electronDir = path.resolve(__dirname, '../../electron');
const electronId = require.resolve('electron');

let tmpDir: string;
let mock: ReturnType<typeof makeElectron>;

class FakeWindow extends EventEmitter {
  static all: FakeWindow[] = [];
  opts: any;
  destroyed = false;
  minimized = false;
  webContents = Object.assign(new EventEmitter(), {
    send: vi.fn(),
    openDevTools: vi.fn(),
    toggleDevTools: vi.fn(),
    executeJavaScript: vi.fn(),
  });
  loadFile = vi.fn(async () => {});
  loadURL = vi.fn(async () => {});
  show = vi.fn();
  hide = vi.fn();
  focus = vi.fn();
  restore = vi.fn(() => {
    this.minimized = false;
  });
  maximize = vi.fn();
  constructor(opts: any) {
    super();
    this.opts = opts;
    FakeWindow.all.push(this);
  }
  isDestroyed() {
    return this.destroyed;
  }
  isMinimized() {
    return this.minimized;
  }
  isMaximized() {
    return false;
  }
  isVisible() {
    return !this.destroyed;
  }
  getBounds() {
    return { x: 0, y: 0, width: 800, height: 600 };
  }
  destroy() {
    this.destroyed = true;
    this.emit('closed');
  }
}

function makeElectron() {
  const appHandlers: Record<string, Function[]> = {};
  const ipcHandlers: Record<string, Function> = {};
  let menuTemplate: any[] = [];
  return {
    appHandlers,
    ipcHandlers,
    get menuTemplate() {
      return menuTemplate;
    },
    electron: {
      app: {
        requestSingleInstanceLock: vi.fn(() => true),
        quit: vi.fn(),
        isReady: vi.fn(() => true),
        on: vi.fn((event: string, fn: Function) => {
          (appHandlers[event] ||= []).push(fn);
        }),
        // Hazır olma beklenmez: testler yalnızca üst düzey kurulumu ve olay işleyicilerini sınar.
        whenReady: vi.fn(() => new Promise(() => {})),
        getPath: vi.fn(() => tmpDir),
        getVersion: vi.fn(() => '0.0.0'),
        commandLine: { appendSwitch: vi.fn() },
      },
      BrowserWindow: FakeWindow,
      ipcMain: {
        handle: vi.fn((channel: string, fn: Function) => {
          ipcHandlers[channel] = fn;
        }),
      },
      dialog: { showSaveDialog: vi.fn(async () => ({ canceled: true })), showOpenDialog: vi.fn() },
      shell: { openExternal: vi.fn() },
      screen: { getAllDisplays: () => [{ bounds: { x: 0, y: 0, width: 1920, height: 1080 } }] },
      Tray: class {
        on = vi.fn();
        setToolTip = vi.fn();
        setContextMenu = vi.fn();
        isDestroyed = () => false;
        destroy = vi.fn();
      },
      Menu: {
        buildFromTemplate: vi.fn((t: any[]) => {
          menuTemplate = t;
          return t;
        }),
      },
      globalShortcut: { register: vi.fn(), unregisterAll: vi.fn() },
      nativeImage: { createFromPath: vi.fn(() => ({})), createEmpty: vi.fn(() => ({})) },
      clipboard: {
        readImage: () => ({ isEmpty: () => false, toPNG: () => Buffer.from('png') }),
        readHTML: () => '',
        readText: () => '',
      },
    },
  };
}

function clearElectronModules() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(electronDir)) delete require.cache[key];
  }
}

function load(file: string) {
  return require(path.join(electronDir, file));
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openscriv-faz0-'));
  FakeWindow.all = [];
  mock = makeElectron();
  require.cache[electronId] = { id: electronId, filename: electronId, loaded: true, exports: mock.electron } as any;
  clearElectronModules();
});

afterEach(() => {
  delete require.cache[electronId];
  clearElectronModules();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('0.2 Tek örnek kilidi (main.cjs)', () => {
  it('kilit alınamazsa uygulamayı kapatır ve hiçbir pencere/işleyici kurmaz', () => {
    mock.electron.app.requestSingleInstanceLock.mockReturnValue(false);
    load('main.cjs');
    expect(mock.electron.app.quit).toHaveBeenCalled();
    expect(mock.electron.app.whenReady).not.toHaveBeenCalled();
    expect(mock.appHandlers['second-instance']).toBeUndefined();
  });

  it('--smoke-test ile kilit istemez (geliştirme örneğinin yanında çalışır)', () => {
    process.argv.push('--smoke-test');
    try {
      load('main.cjs');
    } finally {
      process.argv.pop();
    }
    expect(mock.electron.app.requestSingleInstanceLock).not.toHaveBeenCalled();
    expect(mock.electron.app.quit).not.toHaveBeenCalled();
    expect(mock.electron.app.whenReady).toHaveBeenCalled();
  });

  it('ikinci açılışta mevcut pencereyi geri getirip odaklar; pencere yoksa yeniden oluşturur', () => {
    load('main.cjs');
    expect(mock.electron.app.requestSingleInstanceLock).toHaveBeenCalled();
    const [secondInstance] = mock.appHandlers['second-instance'];

    secondInstance({}, ['OpenScriv.exe']);
    expect(FakeWindow.all).toHaveLength(1);
    const win = FakeWindow.all[0];

    win.minimized = true;
    secondInstance({}, ['OpenScriv.exe']);
    expect(FakeWindow.all).toHaveLength(1);
    expect(win.restore).toHaveBeenCalled();
    expect(win.show).toHaveBeenCalled();
    expect(win.focus).toHaveBeenCalled();
  });
});

describe('0.3 Tepsi ve hızlı not yaşam döngüsü', () => {
  it('ana pencere kapanınca gizli hızlı not penceresi yok edilir (window-all-closed tetiklenebilsin)', () => {
    load('main.cjs');
    mock.appHandlers['second-instance'][0]({}, []);
    const mainWin = FakeWindow.all[0];

    const quickNote = load('systemTray.cjs').createQuickNoteWindow();
    quickNote.emit('blur'); // yalnızca gizlenir
    expect(quickNote.isDestroyed()).toBe(false);

    mainWin.destroy();
    expect(quickNote.isDestroyed()).toBe(true);
  });

  it('tepsideki "Aç" ve çift tıklama ana pencereyi bulan/yeniden oluşturan işlevi çağırır', () => {
    const tray = load('systemTray.cjs');
    const showMainWindow = vi.fn();
    const trayInstance = tray.initSystemTray(showMainWindow);

    mock.menuTemplate.find((item) => /Aç/.test(item.label || '')).click();
    const dblClick = trayInstance.on.mock.calls.find(([ev]: [string]) => ev === 'double-click')[1];
    dblClick();
    expect(showMainWindow).toHaveBeenCalledTimes(2);
  });
});

describe('0.1 Hızlı not ana pencereye iletilir', () => {
  it('tray:quick-note-save notu ana pencereye gönderir, boş notu reddeder', async () => {
    const mainWin = new FakeWindow({});
    load('systemTray.cjs').registerTrayIpcHandlers(() => mainWin);
    const handler = mock.ipcHandlers['tray:quick-note-save'];

    const res = await handler({}, { text: '  Yeni fikir  ', category: 'Fikir', createdAt: '2026-01-01T00:00:00.000Z' });
    expect(res).toEqual({ ok: true });
    expect(mainWin.webContents.send).toHaveBeenCalledWith('tray:quick-note-save', {
      text: 'Yeni fikir',
      category: 'Fikir',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(await handler({}, { text: '   ' })).toEqual({ ok: false });
    mainWin.destroyed = true;
    expect(await handler({}, { text: 'not' })).toEqual({ ok: false });
    expect(mainWin.webContents.send).toHaveBeenCalledTimes(1);
  });

  it('preload hızlı not kanalını invoke için izinli listeye alır', () => {
    const preload = fs.readFileSync(path.join(electronDir, 'preload.cjs'), 'utf8');
    const invokeList = preload.slice(preload.indexOf('ALLOWED_INVOKE_CHANNELS'), preload.indexOf('ALLOWED_LISTEN_CHANNELS'));
    expect(invokeList).toContain("'tray:quick-note-save'");
  });
});

describe('0.8 Gezinme koruması', () => {
  function attach() {
    load('main.cjs');
    const [onCreated] = mock.appHandlers['web-contents-created'];
    const contents = Object.assign(new EventEmitter(), {
      getURL: () => 'file:///C:/OpenScriv/dist/index.html',
      setWindowOpenHandler: vi.fn(),
    });
    onCreated({}, contents);
    return contents;
  }

  it('bırakılan dosyaya veya başka bir adrese gidişi engeller, aynı sayfayı yeniden yüklemeye izin verir', () => {
    const contents = attach();
    const dropped = { preventDefault: vi.fn() };
    contents.emit('will-navigate', dropped, 'file:///C:/Users/x/Downloads/evil.html');
    expect(dropped.preventDefault).toHaveBeenCalled();

    const remote = { preventDefault: vi.fn() };
    contents.emit('will-navigate', remote, 'https://example.com/');
    expect(remote.preventDefault).toHaveBeenCalled();

    const reload = { preventDefault: vi.fn() };
    contents.emit('will-navigate', reload, 'file:///C:/OpenScriv/dist/index.html');
    expect(reload.preventDefault).not.toHaveBeenCalled();
  });

  it('yeni pencere açmayı reddeder; http(s) bağlantıları sistem tarayıcısında açılır', () => {
    const contents = attach();
    const openHandler = contents.setWindowOpenHandler.mock.calls[0][0];

    expect(openHandler({ url: 'https://openscriv.example/docs' })).toEqual({ action: 'deny' });
    expect(mock.electron.shell.openExternal).toHaveBeenCalledWith('https://openscriv.example/docs');

    expect(openHandler({ url: 'file:///C:/evil.html' })).toEqual({ action: 'deny' });
    expect(openHandler({ url: '/?popout=true' })).toEqual({ action: 'deny' });
    expect(mock.electron.shell.openExternal).toHaveBeenCalledTimes(1);
  });
});

describe('0.9 Yol güvenliği', () => {
  it('snapshot zaman damgası rakam değilse okumaz ve silmez', async () => {
    const snapshots = load('snapshots.js');
    const outside = path.join(tmpDir, 'outside.json');
    fs.writeFileSync(outside, JSON.stringify({ secret: true }));
    const evil = { projectId: 'p', docId: 'd', timestamp: '../../../outside' };

    expect((await snapshots.loadSnapshot(evil)).ok).toBe(false);
    expect((await snapshots.deleteSnapshot(evil)).ok).toBe(false);
    expect(fs.existsSync(outside)).toBe(true);

    // Normal akış bozulmaz
    const created = await snapshots.createSnapshot({ projectId: 'p', docId: 'd', content: 'Metin' });
    expect(created.ok).toBe(true);
    const loaded = await snapshots.loadSnapshot({ projectId: 'p', docId: 'd', timestamp: created.snapshot.timestamp });
    expect(loaded.ok).toBe(true);
    expect(loaded.snapshot.content).toBe('Metin');
  });

  it('yedek zaman damgası rakam değilse dosya okunmaz/geri yüklenmez', async () => {
    const backup = load('backup.js');
    fs.writeFileSync(path.join(tmpDir, 'outside.json'), JSON.stringify({ data: { secret: true } }));
    const evil = { projectId: 'p', timestamp: '/../../../outside' };

    expect((await backup.loadBackup(evil)).ok).toBe(false);
    expect((await backup.restoreBackup(evil)).ok).toBe(false);
  });

  function registerProject() {
    load('projectIpc.cjs').registerProjectIpcHandlers();
    return (channel: string, payload: any) => mock.ipcHandlers[channel]({}, payload);
  }

  it('açılmamış bir dizine binder/belge/paket yazmayı reddeder', async () => {
    const invoke = registerProject();
    const victim = path.join(tmpDir, 'victim');
    fs.mkdirSync(victim);
    fs.writeFileSync(path.join(victim, 'manifest.json'), JSON.stringify({ id: 'x', name: 'x' }));

    expect((await invoke('project:save-binder-atomic', { packagePath: victim, binder: [] })).ok).toBe(false);
    expect((await invoke('project:save-doc-atomic', { packagePath: victim, docId: 'a', content: 'x' })).ok).toBe(false);
    expect((await invoke('project:save-package', { packagePath: victim, tree: [] })).ok).toBe(false);
    expect(fs.existsSync(path.join(victim, 'binder.json'))).toBe(false);
    expect(fs.existsSync(path.join(victim, 'docs'))).toBe(false);
  });

  it('oluşturulan ve okunarak açılan paketlere yazma çalışmaya devam eder', async () => {
    let invoke = registerProject();
    const created = await invoke('project:create-package', {
      parentDir: tmpDir,
      projectName: 'Roman',
      initialTree: [{ id: 'doc-1', type: 'doc', title: 'Bölüm 1', content: 'İlk' }],
    });
    expect(created.ok).toBe(true);
    const tree = [{ id: 'doc-1', type: 'doc', title: 'Bölüm 1', content: 'İkinci' }];
    expect((await invoke('project:save-package', { packagePath: created.packagePath, name: 'Roman', tree })).ok).toBe(true);
    expect((await invoke('project:save-doc-atomic', { packagePath: created.packagePath, docId: 'doc-2', content: 'x' })).ok).toBe(true);
    expect((await invoke('project:save-binder-atomic', { packagePath: created.packagePath, binder: [] })).ok).toBe(true);

    // Yeni oturum: paket önce okunmadan yazılamaz, okunduktan sonra yazılır.
    clearElectronModules();
    invoke = registerProject();
    expect((await invoke('project:save-package', { packagePath: created.packagePath, tree })).ok).toBe(false);
    const read = await invoke('project:read-package', { packagePath: created.packagePath });
    expect(read.ok).toBe(true);
    expect((await invoke('project:save-package', { packagePath: read.packagePath, tree })).ok).toBe(true);
    expect(fs.readFileSync(path.join(read.packagePath, 'docs', 'doc-1.md'), 'utf8')).toBe('İkinci');
  });

  it('pano görseli yalnızca açılmış pakete yazılır', async () => {
    const { saveClipboardImageAsset } = load('clipboardIpc.cjs');
    const stranger = path.join(tmpDir, 'stranger');
    expect((await saveClipboardImageAsset(stranger)).ok).toBe(false);
    expect(fs.existsSync(path.join(stranger, 'assets'))).toBe(false);
    expect((await saveClipboardImageAsset(undefined)).ok).toBe(false);

    load('projectIpc.cjs').registerProjectIpcHandlers();
    const created = await mock.ipcHandlers['project:create-package']({}, { parentDir: tmpDir, projectName: 'Pano' });
    const saved = await saveClipboardImageAsset(created.packagePath);
    expect(saved.ok).toBe(true);
    expect(fs.existsSync(saved.absolutePath)).toBe(true);
  });

  it('pdf:print-vector renderer yolunu doğrudan yazmaz; her zaman kayıt penceresi açılır', async () => {
    load('pdfPrinter.cjs').registerPdfIpcHandlers();
    const victim = path.join(tmpDir, 'victim.pdf');
    fs.writeFileSync(victim, 'önemli');

    const res = await mock.ipcHandlers['pdf:print-vector']({}, { htmlContent: '<p>x</p>', targetPath: victim });
    expect(res).toEqual({ ok: false, canceled: true });
    expect(mock.electron.dialog.showSaveDialog).toHaveBeenCalledWith(expect.objectContaining({ defaultPath: 'victim.pdf' }));
    expect(fs.readFileSync(victim, 'utf8')).toBe('önemli');
  });
});
