const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

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

