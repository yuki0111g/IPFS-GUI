const { contextBridge, ipcRenderer } = require('electron');

//bootstrapノード起動
contextBridge.exposeInMainWorld('apis', {
    //BTノード起動
    startBootstrapNodeEvent: async () => ipcRenderer.invoke('startBootstrapNode'),
    //IPFS終了
    exitIpfsEvent: () => ipcRenderer.invoke('exitIpfs'),
    //エクスプローラーを開く
    openExplorerEvent: () => ipcRenderer.invoke('openExplorer'),
    //コンテンツのアップロード
    putContentEvent: (fileName, fileData) => ipcRenderer.invoke('putContent', { fileName, fileData }),
    //コンテンツのダウンロード
    getContentEvent: (cid) => ipcRenderer.invoke('getContent', cid),
    //標準出力をbt_renderer.jsに送信
    onStdout: (callback) => ipcRenderer.on('stdout', (event, message) => callback(message)),
    onStderr: (callback) => ipcRenderer.on('stderr', (event, message) => callback(message)),
    //一般ノード起動
    startGeneralNodeEvent: (testBoxBTIP, testBoxBTPeerID) => ipcRenderer.invoke('startGeneralNode', testBoxBTIP, testBoxBTPeerID),
    //data.jsonの読み込み
    getJsonData: async () => {
        return await ipcRenderer.invoke('get-json-data');
    },
    openCmd: () => ipcRenderer.invoke('openCmd'),
});

