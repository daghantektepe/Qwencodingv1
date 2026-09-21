const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('openScriv', {
  newProject: () => ipcRenderer.invoke('project:new'),
  openProject: () => ipcRenderer.invoke('project:open'),
  saveProject: (project) => ipcRenderer.invoke('project:save', project),
});
