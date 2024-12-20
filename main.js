const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn, execSync } = require('child_process');
const iconv = require("iconv-lite");
const fs = require('fs').promises;
const os = require('os');

let batProcess;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  //ファイルを書き換える
  async function replaceLine(filePath, lineNumber, newText) {
    try {
      // ファイル全体を読み込む
      const data = await fs.readFile(filePath, 'utf8');

      // 行単位で分割
      const lines = data.split('\n');

      // 指定した行を更新
      if (lineNumber >= 1 && lineNumber <= lines.length) {
        lines[lineNumber - 1] = newText;
      } else {
        console.error('The specified line number is out of range.');
        return;
      }

      // ファイルに書き戻す
      await fs.writeFile(filePath, lines.join('\n'), 'utf8');
      console.log('The specified line has been changed.');
    } catch (err) {
      console.error('An error has occurred:', err);
    }
  }


  async function bootIPFS() {
    require('child_process').exec('ipconfig', (err, stdout, stderr) => {

      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
    })

    // 実行する.batファイルのパス
    const batFilePath = 'run.bat';

    batProcess = spawn('cmd.exe', ['/c', batFilePath]);

    // 標準出力を取得
    batProcess.stdout.on('data', (data) => {
      console.log(`出力: ${iconv.decode(data, 'Shift_JIS')}`);
    });

    // 標準エラーを取得
    batProcess.stderr.on('data', (data) => {
      console.error(`エラー: ${iconv.decode(data, 'Shift_JIS')}`);
    });

    // プロセス終了時の処理
    batProcess.on('close', (code) => {
      console.log(`プロセスが終了しました。終了コード: ${code}`);
    });

  }


  // IPC handler bootstrapノードで起動
  ipcMain.handle('click-event', async (_e, _arg) => {


    //bootstrapノード　kadrtt.propertiesと.ipfs/config内のBootstrapの部分の書き換え
    async function setPropertiesConfig() {

      let myip; //自身のIPアドレス
      const networkInterfaces = os.networkInterfaces(); // ネットワークインターフェース情報を取得

      for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];

        for (const iface of interfaces) {
          // IPv4かつ内部ネットワークでないアドレスを取得
          if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`IPアドレス (${interfaceName}): ${iface.address}`);
            myip = iface.address;
          }
        }
      }

      //生成された.ipfs/configのBootstrapID読み取り
      let mypeerID;

      await fs.readFile(".ipfs/config").then(file => {
        const data = JSON.parse(file);
        mypeerID = data.Identity.PeerID;
        console.log(`MyBootstrapPeerID is ${mypeerID} !`);

      }).catch(err => {
        console.error(err);
      });

      replaceLine('kadrtt.properties', 36, `ipfs.endpoint=/ip4/${myip}/tcp/4001/ipfs/${mypeerID}`);
      replaceLine('.ipfs/config', 13, `"/ip4/${myip}/tcp/4001/ipfs/${mypeerID}"`);
    }

    setPropertiesConfig();
    bootIPFS();
  });

  //IPC handler 一般ノード起動
  ipcMain.handle('send-text', async (_e, bootstrapIp, bootstrapPeerId) => {

    //config削除
    function deleteFile(filePath) {
      try {
        fs.unlink(filePath);
        return true;
      } catch (err) {
        return false;
      }
    }

    const configpath = path.join('.ipfs', 'config');
    deleteFile(configpath)

    console.log(`入力されたBootstrapのIp${bootstrapIp}`)
    console.log(`入力されたBootstrapのPeerID${bootstrapPeerId}`)

    //endpointに書き換える。
    replaceLine('kadrtt.properties', 36, `ipfs.endpoint=/ip4/${bootstrapIp}/tcp/4001/ipfs/${bootstrapPeerId}`);

    bootIPFS();
  })


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

    //ipfsを終了させる。
    console.log('タスクを同期的に終了します...');
    try {
      const result = execSync(`taskkill /PID ${batProcess.pid} /T /F`, { encoding: 'utf-8' });
      console.log(`出力: ${result}`);
    } catch (error) {
      console.error(`エラー: ${error.message}`);
    }
    
    console.log("test2");
    app.quit();
  }
});

