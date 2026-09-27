const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload bridge exposing safe APIs to renderer process.
 * Exposes window.electronAPI, window.api, and window.openScriv.
 */
const bridgeApi = {
  // Generic invoke bridge for all IPC channels
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  // App & System info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

  // Document Persistence (Faz 4)
  saveDocument: (payload) => ipcRenderer.invoke('save-document', payload),
  loadDocument: (payload) => ipcRenderer.invoke('load-document', payload),
  loadProject: (payload) => ipcRenderer.invoke('load-project', payload),
  saveProjectTree: (payload) => ipcRenderer.invoke('save-project-tree', payload),
  loadProjectTree: (payload) => ipcRenderer.invoke('load-project-tree', payload),
  saveProject: (data) => ipcRenderer.invoke('save-project-tree', data),

  // Project Open/New (legacy)
  newProject: () => ipcRenderer.invoke('project:new'),
  openProject: (dir) => ipcRenderer.invoke('project:open', dir),

  // Search (Faz 11)
  searchProject: (payload) => ipcRenderer.invoke('search-project', payload),

  // Snapshots (Faz 10)
  createSnapshot: (payload) => ipcRenderer.invoke('snapshot-create', payload),
  listSnapshots: (payload) => ipcRenderer.invoke('snapshot-list', payload),
  loadSnapshot: (payload) => ipcRenderer.invoke('snapshot-load', payload),
  deleteSnapshot: (payload) => ipcRenderer.invoke('snapshot-delete', payload),

  // Compile / Export (Faz 12)
  compileRun: (payload) => ipcRenderer.invoke('compile:run', payload),
  saveCompiledFile: (payload) => ipcRenderer.invoke('save-compiled-file', payload),

  // Backup & Resilience (Faz 14)
  backup: {
    markDirty: (projectId) => ipcRenderer.invoke('backup-mark-dirty', { projectId }),
    createBackup: (payload) => ipcRenderer.invoke('backup-create', payload),
    listBackups: (projectId) => ipcRenderer.invoke('backup-list', { projectId }),
    restoreBackup: (payload) => ipcRenderer.invoke('backup-restore', payload),
    getCrashRecoveryInfo: (projectId) => ipcRenderer.invoke('backup-crash-info', { projectId }),
    dismissCrashRecovery: (projectId) => ipcRenderer.invoke('backup-crash-dismiss', { projectId }),
  },
};

contextBridge.exposeInMainWorld('electronAPI', bridgeApi);
contextBridge.exposeInMainWorld('api', bridgeApi);
contextBridge.exposeInMainWorld('openScriv', bridgeApi);
