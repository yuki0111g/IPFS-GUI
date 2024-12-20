const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apis', {
    runClickEvent: async () => ipcRenderer.invoke('click-event'),
});

contextBridge.exposeInMainWorld('apis2', {
    sendText: (testBoxBTIP,testBoxBTPeerID) => ipcRenderer.invoke('send-text', testBoxBTIP,testBoxBTPeerID),
  });

contextBridge.exposeInMainWorld('apis3', {
    runClickEvent: async () => ipcRenderer.invoke('click-event3'),
});

contextBridge.exposeInMainWorld('apis4', {
    runClickEvent: async () => ipcRenderer.invoke('click-event4'),
});