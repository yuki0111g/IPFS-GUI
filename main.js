const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process');
const iconv = require("iconv-lite");


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // IPC handler
  ipcMain.handle('click-event', async (_e, _arg) => {
    const options = {
      type: 'info',
      title: 'quick start',
      message: 'hello world!',
      detail: 'description'
    };
    dialog.showMessageBox(options);
  });

  // // IPC handler IPFS実行
  // ipcMain.handle('click-event', async (_e, _arg) => {

  //   // 実行する.batファイルのパス
  //   const batFilePath = '';

  //   const batProcess = spawn('cmd.exe', ['/c', batFilePath],{ shell: true, stdio: 'inherit' });

  //   // 標準出力を取得
  //   batProcess.stdout.on('data', (data) => {
  //     console.log(`出力: ${iconv.decode(data, 'UTF-8')}`);
  //   });

  //   // 標準エラーを取得
  //   batProcess.stderr.on('data', (data) => {
  //     console.error(`エラー: ${iconv.decode(data, 'UTF-8')}`);
  //   });

  //   // プロセス終了時の処理
  //   batProcess.on('close', (code) => {
  //     console.log(`プロセスが終了しました。終了コード: ${code}`);
  //   });
  // });

  ipcMain.on('close', () => {
    app.quit();
  });

  win.loadFile('index.html');

  //win.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

