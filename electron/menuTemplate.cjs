/**
 * Native Application Menu Template & Action Dispatcher
 * Phase 107: Tam Yerel İşletim Sistemi Menüleri ve Kısayol Haritası (Native Application Menus)
 */

let Menu = null;
let app = null;

try {
  const electron = require('electron');
  if (electron && typeof electron === 'object') {
    Menu = electron.Menu;
    app = electron.app;
  }
} catch {
  // ignore
}

if (!Menu || typeof Menu.buildFromTemplate !== 'function') {
  Menu = {
    setApplicationMenu: () => {},
    buildFromTemplate: (template) => template,
  };
}

if (!app) {
  app = {
    name: 'OpenScriv',
    quit: () => {},
  };
}

function sendAction(win, action, payload = {}) {
  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send('menu:action', { action, payload, timestamp: Date.now() });
  }
}

function buildMenuTemplate(mainWindow, options = {}) {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: 'OpenScriv Hakkında' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: 'OpenScriv’i Gizle' },
              { role: 'hideOthers', label: 'Diğerlerini Gizle' },
              { role: 'unhide', label: 'Tümünü Göster' },
              { type: 'separator' },
              { role: 'quit', label: 'Çıkış' },
            ],
          },
        ]
      : []),

    // 1) Dosya (File)
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Yeni Proje...',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendAction(mainWindow, 'file:new-project'),
        },
        {
          label: 'Projeyi Aç...',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendAction(mainWindow, 'file:open-project'),
        },
        { type: 'separator' },
        {
          label: 'Kaydet',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendAction(mainWindow, 'file:save'),
        },
        {
          label: 'Farklı Kaydet...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendAction(mainWindow, 'file:save-as'),
        },
        { type: 'separator' },
        {
          label: 'Derle ve Dışa Aktar (Compile)...',
          accelerator: 'CmdOrCtrl+E',
          click: () => sendAction(mainWindow, 'file:compile'),
        },
        {
          label: 'Toplu Dışa Aktar (Batch Export)...',
          click: () => sendAction(mainWindow, 'file:batch-export'),
        },
        { type: 'separator' },
        {
          label: isMac ? 'Pencereyi Kapat' : 'Çıkış',
          accelerator: isMac ? 'Cmd+W' : 'Alt+F4',
          role: isMac ? 'close' : 'quit',
        },
      ],
    },

    // 2) Düzen (Edit)
    {
      label: 'Düzen',
      submenu: [
        { role: 'undo', label: 'Geri Al', accelerator: 'CmdOrCtrl+Z' },
        { role: 'redo', label: 'Yinele', accelerator: 'CmdOrCtrl+Y' },
        { type: 'separator' },
        { role: 'cut', label: 'Kes', accelerator: 'CmdOrCtrl+X' },
        { role: 'copy', label: 'Kopyala', accelerator: 'CmdOrCtrl+C' },
        { role: 'paste', label: 'Yapıştır', accelerator: 'CmdOrCtrl+V' },
        { role: 'selectAll', label: 'Tümünü Seç', accelerator: 'CmdOrCtrl+A' },
        { type: 'separator' },
        {
          label: 'Bul ve Değiştir...',
          accelerator: 'CmdOrCtrl+F',
          click: () => sendAction(mainWindow, 'edit:find-replace'),
        },
        {
          label: 'Projeyi Genel Ara...',
          accelerator: 'CmdOrCtrl+K',
          click: () => sendAction(mainWindow, 'edit:search-project'),
        },
      ],
    },

    // 3) Görünüm (View)
    {
      label: 'Görünüm',
      submenu: [
        {
          label: 'Editör Görünümü',
          accelerator: 'CmdOrCtrl+1',
          click: () => sendAction(mainWindow, 'view:editor'),
        },
        {
          label: 'Mantar Pano (Corkboard)',
          accelerator: 'CmdOrCtrl+2',
          click: () => sendAction(mainWindow, 'view:corkboard'),
        },
        {
          label: 'Tablo Görünümü (Outliner)',
          accelerator: 'CmdOrCtrl+3',
          click: () => sendAction(mainWindow, 'view:outliner'),
        },
        {
          label: 'Zaman Çizelgesi (Timeline)',
          accelerator: 'CmdOrCtrl+4',
          click: () => sendAction(mainWindow, 'view:timeline'),
        },
        {
          label: 'Evren & Karakterler (Codex)',
          accelerator: 'CmdOrCtrl+5',
          click: () => sendAction(mainWindow, 'view:codex'),
        },
        { type: 'separator' },
        {
          label: 'Odak Modu (Tam Ekran Yazım)',
          accelerator: 'F11',
          click: () => sendAction(mainWindow, 'view:toggle-focus'),
        },
        {
          label: 'Karanlık / Aydınlık Tema Değiştir',
          click: () => sendAction(mainWindow, 'view:toggle-theme'),
        },
      ],
    },

    // 4) Proje (Project)
    {
      label: 'Proje',
      submenu: [
        {
          label: 'Yeni Doküman Ekle',
          click: () => sendAction(mainWindow, 'project:add-doc'),
        },
        {
          label: 'Yeni Klasör Ekle',
          click: () => sendAction(mainWindow, 'project:add-folder'),
        },
        {
          label: 'Dokümanı İmleçten İkiye Böl',
          accelerator: 'CmdOrCtrl+Shift+K',
          click: () => sendAction(mainWindow, 'project:split-doc'),
        },
        { type: 'separator' },
        {
          label: 'Proje Sağlık Karnesi (Health HUD)...',
          click: () => sendAction(mainWindow, 'project:health-dashboard'),
        },
        {
          label: 'Yedekleme Yöneticisi...',
          click: () => sendAction(mainWindow, 'project:backup-manager'),
        },
      ],
    },

    // 5) Araçlar (Tools)
    {
      label: 'Araçlar',
      submenu: [
        {
          label: 'Komut Paleti...',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => sendAction(mainWindow, 'tools:command-palette'),
        },
        {
          label: 'Hızlı Not Defteri (Scratchpad)...',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => sendAction(mainWindow, 'tools:scratchpad'),
        },
        {
          label: 'Çevrimdışı Sözlük & Etimoloji...',
          click: () => sendAction(mainWindow, 'tools:dictionary'),
        },
        {
          label: 'Metin Genişletici & Makrolar...',
          click: () => sendAction(mainWindow, 'tools:snippets'),
        },
        {
          label: 'Daktilo Tuş Seslerini Aç/Kapat',
          accelerator: 'Alt+S',
          click: () => sendAction(mainWindow, 'tools:toggle-sound'),
        },
      ],
    },

    // 6) Pencere (Window)
    {
      label: 'Pencere',
      submenu: [
        { role: 'minimize', label: 'Simge Durumuna Küçült' },
        { role: 'zoom', label: 'Büyüt / Küçült' },
        { type: 'separator' },
        {
          label: 'Yüzen Ayrık Scratchpad Aç',
          click: () => sendAction(mainWindow, 'window:popout-scratchpad'),
        },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front', label: 'Tümünü Öne Getir' },
            ]
          : []),
      ],
    },

    // 7) Yardım (Help)
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Kullanım Kılavuzu',
          click: () => sendAction(mainWindow, 'help:docs'),
        },
        {
          label: 'Sürüm Notları (v2.0)',
          click: () => sendAction(mainWindow, 'help:release-notes'),
        },
        { type: 'separator' },
        {
          label: 'OpenScriv Hakkında',
          click: () => sendAction(mainWindow, 'help:about'),
        },
      ],
    },
  ];

  return template;
}

function setupApplicationMenu(mainWindow) {
  const template = buildMenuTemplate(mainWindow);
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

module.exports = {
  buildMenuTemplate,
  setupApplicationMenu,
  sendAction,
};
