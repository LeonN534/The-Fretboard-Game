const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  quit: () => ipcRenderer.send('quit'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
})
