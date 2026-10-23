/**
 * nativeMenu.cjs — Faz 98: Çapraz Platform Sistem Menüsü (macOS, Linux, Windows)
 */

let Menu = null;
let app = null;

try {
  const electron = require('electron');
  Menu = electron.Menu;
  app = electron.app;
} catch {
  // Safe mock in vitest / headless environment
  Menu = {
    setApplicationMenu: () => {},
    buildFromTemplate: (template) => template
  };
  app = {
    name: 'OpenScriv',
    quit: () => {}
  };
}

function buildNativeAppMenu(options = {}) {
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
              { role: 'quit', label: 'Çıkış' }
            ]
          }
        ]
      : []),
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Yeni Proje',
          accelerator: 'CmdOrCtrl+N',
          click: options.onNewProject || (() => {})
        },
        {
          label: 'Projeyi Aç...',
          accelerator: 'CmdOrCtrl+O',
          click: options.onOpenProject || (() => {})
        },
        { type: 'separator' },
        {
          label: 'Kaydet',
          accelerator: 'CmdOrCtrl+S',
          click: options.onSave || (() => {})
        },
        {
          label: 'Derle ve Dışa Aktar...',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: options.onCompile || (() => {})
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Pencereyi Kapat' } : { role: 'quit', label: 'Çıkış' }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { role: 'undo', label: 'Geri Al' },
        { role: 'redo', label: 'Yinele' },
        { type: 'separator' },
        { role: 'cut', label: 'Kes' },
        { role: 'copy', label: 'Kopyala' },
        { role: 'paste', label: 'Yapıştır' },
        { role: 'selectAll', label: 'Tümünü Seç' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        {
          label: 'Dokunmatik Mod HUD',
          accelerator: 'F10',
          click: options.onToggleTouchMode || (() => {})
        },
        { role: 'reload', label: 'Yeniden Yükle' },
        { role: 'forceReload', label: 'Zorla Yeniden Yükle' },
        { role: 'toggleDevTools', label: 'Geliştirici Araçları' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Yakınlaştırmayı Sıfırla' },
        { role: 'zoomIn', label: 'Yakınlaş' },
        { role: 'zoomOut', label: 'Uzaklaş' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tam Ekran Modu' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Kullanım Kılavuzu',
          click: options.onOpenDocs || (() => {})
        },
        {
          label: 'GitHub Deposu',
          click: options.onOpenGitHub || (() => {})
        }
      ]
    }
  ];

  return template;
}

function setupNativeMenu(options = {}) {
  const template = buildNativeAppMenu(options);
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

module.exports = {
  buildNativeAppMenu,
  setupNativeMenu
};
