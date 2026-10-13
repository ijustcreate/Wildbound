const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('serverControl', {
  request: (action, token, payload) => ipcRenderer.invoke('persistent-server-control', action, token, payload),
});
