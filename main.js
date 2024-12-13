const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { exec } = require('child_process');

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

  // IPC handler IPFS実行
  ipcMain.handle('click-event', async (_e, _arg) => {
    // 実行する.batファイルのパス
    const batFilePath = 'path/to/your/script.bat';

    exec(`"${batFilePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`エラーが発生しました: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`エラー出力: ${stderr}`);
        return;
      }
      console.log(`出力: ${stdout}`);
    });
  });

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

