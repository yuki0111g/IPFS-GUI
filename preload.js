const { contextBridge, ipcRenderer } = require('electron');

//bootstrapノード起動
contextBridge.exposeInMainWorld('apis', {
    runClickEvent: async () => ipcRenderer.invoke('click-event'),
    exitIpfsEvent: () => ipcRenderer.invoke('exitIpfs'),
    openExplorerEvent: () => ipcRenderer.invoke('openExplorer'),
});

//btノード時の標準出力をbt_renderer.jsに送信
contextBridge.exposeInMainWorld('electronAPI', {
    onStdout: (callback) => ipcRenderer.on('stdout', (event, message) => callback(message)),
    onStderr: (callback) => ipcRenderer.on('stderr', (event, message) => callback(message)),
});

//一般ノード起動
contextBridge.exposeInMainWorld('apis2', {
    sendText: (testBoxBTIP,testBoxBTPeerID) => ipcRenderer.invoke('send-text', testBoxBTIP,testBoxBTPeerID),
  });

