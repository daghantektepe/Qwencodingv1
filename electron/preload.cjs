/**
 * Strict Security Preload Bridge
 * Phase 120 Sealed: Kanal İzin Listeli (Whitelisted) Tip-Güvenli IPC Köprüsü
 */

const { contextBridge, ipcRenderer } = require('electron');

// Renderer'ın invoke edebileceği izinli kanallar
const ALLOWED_INVOKE_CHANNELS = new Set([
  // Window & Multi-Window
  'window:minimize',
  'window:maximize',
  'window:toggle-maximize',
  'window:close',
  'window:is-maximized',
  'window:get-state',
  'window:get-platform',
  'window:open-detached',
  'window:close-detached',
  'window:get-open-detached',

  // Native .opscriv Projects
  'project:pick-directory',
  'project:create-package',
  'project:read-package',
  'project:save-doc-atomic',
  'project:save-binder-atomic',

  // SQLite FTS5 Search
  'fts:index-project',
  'fts:update-doc',
  'fts:search',

  // PDF Printing
  'pdf:print-to-pdf',

  // Updater
  'updater:check',
  'updater:install-restart',

  // Clipboard & Rich Media
  'clipboard:read-rich',
  'clipboard:save-image',

  // Spellchecker & Custom Dictionary
  'spellchecker:check-word',
  'spellchecker:add-word',
  'spellchecker:get-custom-words',

  // Theme & Accent Color
  'theme:get-system-info',
  'theme:set-source',

  // Notifications
  'notification:show',
  'notification:is-supported',

  // File Watcher
  'watcher:start',
  'watcher:stop',

  // Hardware Flags
  'hardware:get-flags',

  // App Info & System
  'get-app-version',
  'get-user-data-path',
  'save-document',
  'load-document',
  'load-project',
  'save-project-tree',
  'load-project-tree',
  'search-project',
  'snapshot-create',
  'snapshot-list',
  'snapshot-load',
  'snapshot-delete',
  'compile:run',
  'save-compiled-file',
  'backup-mark-dirty',
  'backup-create',
  'backup-list',
  'backup-restore',
  'backup-crash-info',
  'backup-crash-dismiss',
]);

// Renderer'ın dinleyebileceği izinli event kanalları
const ALLOWED_LISTEN_CHANNELS = new Set([
  'window:state-changed',
  'theme:changed',
  'watcher:change',
  'menu:action',
  'tray:quick-note-save',
]);

const secureBridge = {
  isDesktop: true,

  // Güvenli Invoke (Yalnızca Whitelist)
  invoke: (channel, ...args) => {
    if (!ALLOWED_INVOKE_CHANNELS.has(channel)) {
      console.error(`[Preload Security] İzinsiz IPC invoke çağrısı engellendi: ${channel}`);
      return Promise.reject(new Error(`İzinsiz IPC kanalı: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  // Güvenli Event Dinleme (Yalnızca Whitelist)
  on: (channel, listener) => {
    if (!ALLOWED_LISTEN_CHANNELS.has(channel)) {
      console.error(`[Preload Security] İzinsiz IPC dinleme engellendi: ${channel}`);
      return;
    }
    const subscription = (event, ...args) => listener(event, ...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  removeListener: (channel, listener) => {
    if (ALLOWED_LISTEN_CHANNELS.has(channel)) {
      ipcRenderer.removeListener(channel, listener);
    }
  },

  // Yardımcı Kısayollar
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
};

contextBridge.exposeInMainWorld('electronBridge', secureBridge);
contextBridge.exposeInMainWorld('electronAPI', secureBridge);
contextBridge.exposeInMainWorld('api', secureBridge);
contextBridge.exposeInMainWorld('openScriv', secureBridge);
