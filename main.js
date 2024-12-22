const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn, execSync } = require('child_process');
const fs = require('fs').promises;
const os = require('os');

let batProcess;
let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  async function bootAndExitIPFS() {
    const p1 = new Promise((resolve, reject) => {
      bootIPFS();
      //10秒IPFSを動かして終了
      console.log('[SETUP] 10秒後にIPFSを終了します');
      setTimeout(() => {
        //ipfsを終了させる。
        try {
          const result = execSync(`taskkill /PID ${batProcess.pid} /T /F`, { encoding: 'utf-8' });
          //console.log(`出力: ${result}`);
        } catch (error) {
          console.error(`エラー: ${error.message}`);
        }
        console.log('[SETUP] 終了しました');
        resolve();
      }, 10000)
    });
    return await p1
  }


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

  async function deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (err) {
      return false;
    }
  }

  async function bootIPFS() {
    // 実行する.batファイルのパス
    const batFilePath = 'run.bat';

    batProcess = spawn('cmd.exe', ['/c', batFilePath]);

    // 標準出力を取得
    batProcess.stdout.on('data', (data) => {
      console.log(`出力: ${data}`);

      win.webContents.send('stdout', String(data));//標準出力をpreload.jsに送信
    });

    // 標準エラーを取得
    batProcess.stderr.on('data', (data) => {
      console.error(`エラー: ${data}`);

      win.webContents.send('stderr', String(data));//エラーもpreload.jsに送信
    });

    // プロセス終了時の処理
    batProcess.on('close', (code) => {
      console.log(`プロセスが終了しました。終了コード: ${code}`);
    });

  }

  async function setupBootStrapNode() {
    /*
   
    2.ipfsを起動できるkadrtt.propertiesに設定
    3.起動して10秒後に終了する(configがある場合は既存のpeerIDを使用する。ない場合は新規生成されたpeerIDを使用する。)
    4.configを読み取ってkadrtt.propertiesのipfs.endpointを設定する
    5..ipfs/config内のBootstrapを設定する
   */

    console.log('Start Setup BootstrapNode');

    //1.
    //バックスラッシュをバックスラッシュでエスケープする必要があります。
    //deleteFile('.ipfs\\config');


    //2.
    let myip; //自身のIPアドレス
    const networkInterfaces = os.networkInterfaces(); // ネットワークインターフェース情報を取得

    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];

      for (const iface of interfaces) {
        // IPv4かつ内部ネットワークでないアドレスを取得
        if (iface.family === 'IPv4' && !iface.internal) {
          //console.log(`IPアドレス (${interfaceName}): ${iface.address}`);
          myip = iface.address;
        }
      }
    }

    //デフォルトに戻す。PeerIDは仮で、configに生成されたPeerIDが正しい
    replaceLine('kadrtt.properties', 36, `ipfs.endpoint=/ip4/${myip}/tcp/4001/ipfs/12D3KooWLnD3DbZRNqXBrwRJamd1iKGVcgmYBjiXLSEssfo2DZzE`);

    //3. 10秒だけ起動
    await bootAndExitIPFS();

    //4. 生成された.ipfs/configのBootstrapID読み取り
    let mypeerID;

    await fs.readFile(".ipfs/config").then(file => {
      const data = JSON.parse(file);
      mypeerID = data.Identity.PeerID;
    }).catch(err => {
      console.error(err);
    });

    console.log(`MyIPaddress is ${myip} `);
    console.log(`MyBootstrapPeerID is ${mypeerID} `);

    replaceLine('kadrtt.properties', 36, `ipfs.endpoint=/ip4/${myip}/tcp/4001/ipfs/${mypeerID}`);

    //5.
    replaceLine('.ipfs/config', 13, `"/ip4/${myip}/tcp/4001/ipfs/${mypeerID}"`);

  }

  //IPC handler bootstrapノードで起動
  ipcMain.handle('click-event', async (_e, _arg) => {
    await setupBootStrapNode();
    bootIPFS();
  });

  //IPC handler 一般ノード起動
  ipcMain.handle('send-text', async (_e, bootstrapIp, bootstrapPeerId) => {

    const configpath = path.join('.ipfs', 'config');
    deleteFile(configpath)

    console.log(`BootstrapIp is ${bootstrapIp}`)
    console.log(`BootstrapPeerID is ${bootstrapPeerId}`)

    //endpointに書き換える。
    replaceLine('kadrtt.properties', 36, `ipfs.endpoint=/ip4/${bootstrapIp}/tcp/4001/ipfs/${bootstrapPeerId}`);

    bootIPFS();
  });

  ipcMain.handle('exitIpfs', () => {
    //ipfsを終了させる。
    console.log('IPFSを終了します');
    try {
      const result = execSync(`taskkill /PID ${batProcess.pid} /T /F`, { encoding: 'utf-8' });
      //console.log(`出力: ${result}`);
    } catch (error) {
      console.error(`エラー: ${error.message}`);
    }
  });

  ipcMain.handle('openExplorer', () => {
    spawn('explorer', [__dirname]);
  });

  ipcMain.on('close', () => {
    app.quit();
  });

  ipcMain.handle('putContent', async (event, { fileName, fileData }) => {
    let savePath;
    //putTMPフォルダに仮保存
    try {
      // 保存先ディレクトリ
      savePath = path.join(__dirname, 'putTmp', fileName);

      // ファイルを保存
      await fs.writeFile(savePath, Buffer.from(fileData));
      console.log('putTMPファイルに仮保存しました');
    } catch (error) {
      return { success: false, error: error.message };
    }

    console.log(`curl -X POST "http://127.0.0.1:5001/api/v0/dht/putvaluewithattr?file=putTMP/${fileName}"`);
    let result = execSync(`curl -X POST "http://127.0.0.1:5001/api/v0/dht/putvaluewithattr?file=putTMP/${fileName}"`);
    result = result.toString();
    result = JSON.parse(result);
    console.log(result);
    const cid = result.CID_file;

    win.webContents.send('stdout', `${fileName}のCIDは ${cid} です。`);

  });

  win.loadFile('./html/index.html');

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
    console.log('IPFSを終了します');
    try {
      const result = execSync(`taskkill /PID ${batProcess.pid} /T /F`, { encoding: 'utf-8' });
      //console.log(`出力: ${result}`);
    } catch (error) {
      console.error(`エラー: ${error.message}`);
    }
    app.quit();
  }
});

