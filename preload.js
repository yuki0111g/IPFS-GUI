const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apis', {
    runClickEvent: async () => ipcRenderer.invoke('click-event'),
});