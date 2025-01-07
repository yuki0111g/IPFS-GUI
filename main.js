const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn, execSync, exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const { json } = require('stream/consumers');

let batProcess;
let win;
let jsonData;//グローバルな設定を参照

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  //ビルド後はexeと同じ階層になる
  const getFilePath = (relativePath) => {
    return app.isPackaged
      ? path.resolve(process.resourcesPath, '../', relativePath) // ビルド後
      : path.resolve(__dirname, relativePath); // 開発中
  };

  //JSONにデータを保存


  function saveData(data) {
    fs.writeFileSync(getFilePath('data.json'), JSON.stringify(data, null, 2), 'utf-8');
  }

  function loadData() {
    if (fs.existsSync(getFilePath('data.json'))) {
      const rawData = fs.readFileSync(getFilePath('data.json'), 'utf-8');
      return JSON.parse(rawData);
    }
    return {}; // デフォルトデータ
  }



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
      const data = fs.readFileSync(filePath, 'utf8');

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
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      console.log('The specified line has been changed.');
    } catch (err) {
      console.error('An error has occurred:', err);
    }
  }

  async function deleteFile(filePath) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (err) {
      return false;
    }
  }

  async function bootIPFS() {
    jsonData = loadData();//まず設定を読む
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
      console.error(`エラー扱い: ${data}`);
      if (jsonData.logLevel == "stderr") {
        win.webContents.send('stderr', String(data));//エラーをpreload.jsに送信
      }

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
    jsonData = loadData();//設定を読み込む

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
    const kpPath = getFilePath('kadrtt.properties');
    console.log('Resolved File Path:', kpPath);
    replaceLine(kpPath, 38, `ipfs.endpoint=/ip4/${myip}/tcp/4001/ipfs/12D3KooWLnD3DbZRNqXBrwRJamd1iKGVcgmYBjiXLSEssfo2DZzE`);

    //3. 10秒だけ起動
    if (jsonData.cleanBoot == "1") {
      //deleteFile(getFilePath(path.join('.ipfs', 'config')));
      await bootAndExitIPFS();
      jsonData.cleanBoot = "0";
      saveData(jsonData);
    }

    //4. 生成された.ipfs/configのBootstrapID読み取り
    let mypeerID;

    const configPath = getFilePath(path.join('.ipfs', 'config'));
    // fs.readFileSync(configPath).then(file => {
    //   const data = JSON.parse(file);
    //   mypeerID = data.Identity.PeerID;
    // }).catch(err => {
    //   console.error(err);
    // });
    // const confResult = fs.readFileSync(configPath, 'utf-8');
    // const data = JSON.parse(confResult);
    // mypeerID = data.Identity.PeerID;
    try {
      // ファイルの内容を同期的に読み取る
      const confResult = fs.readFileSync(configPath, 'utf8');
      const data = JSON.parse(confResult);
      mypeerID = data.Identity.PeerID;
    } catch (error) {
      // エラーが発生した場合の処理
      console.error('ファイルの読み取り中にエラーが発生しました:', error.message);
    }

    console.log(`MyIPaddress is ${myip} `);
    console.log(`MyBootstrapPeerID is ${mypeerID} `);

    replaceLine(kpPath, 38, `ipfs.endpoint=/ip4/${myip}/tcp/4001/ipfs/${mypeerID}`);

    //5.
    replaceLine(configPath, 13, `"/ip4/${myip}/tcp/4001/ipfs/${mypeerID}"`);

  }

  //IPC handler bootstrapノードで起動
  ipcMain.handle('startBootstrapNode', async (_e, _arg) => {
    await setupBootStrapNode();
    bootIPFS();
  });

  ipcMain.handle('get-json-data', () => {
    jsonData = loadData();
    console.log(jsonData);
    return jsonData;
  });

  //IPC handler 一般ノード起動
  ipcMain.handle('startGeneralNode', async (_e, bootstrapIp, bootstrapPeerId) => {
    jsonData = loadData();
    jsonData.btip = bootstrapIp;
    jsonData.btpid = bootstrapPeerId;
    saveData(jsonData);


    const configpath = getFilePath(path.join('.ipfs', 'config'));
    deleteFile(configpath);

    console.log(`BootstrapIp is ${bootstrapIp}`)
    console.log(`BootstrapPeerID is ${bootstrapPeerId}`)

    //endpointに書き換える。
    const kpPath = getFilePath('kadrtt.properties');
    replaceLine(kpPath, 38, `ipfs.endpoint=/ip4/${bootstrapIp}/tcp/4001/ipfs/${bootstrapPeerId}`);

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
    spawn('explorer', [path.resolve(process.resourcesPath, '../')]);
  });

  // ipcMain.handle('openExplorer', () => {
  //   spawn('explorer', [() => {
  //     return app.isPackaged
  //       ? path.resolve(process.resourcesPath, '../') // ビルド後
  //       : __dirname; // 開発中
  //   }]);
  // });
  ipcMain.on('close', () => {
    app.quit();
  });

  ipcMain.handle('putContent', async (event, { fileName, fileData }) => {
    let savePath;
    //putTMPフォルダに仮保存
    try {
      // 保存先ディレクトリ
      savePath = getFilePath(path.join('putTmp', fileName));

      // ファイルを保存
      fs.writeFileSync(savePath, Buffer.from(fileData));
      console.log('putTMPファイルに仮保存しました');
    } catch (error) {
      return { success: false, error: error.message };
    }

    console.log(`curl -X POST "http://127.0.0.1:5001/api/v0/dht/putvaluewithattr?file=putTMP/${fileName}"`);
    win.webContents.send('stdout', `curl -X POST "http://127.0.0.1:5001/api/v0/dht/putvaluewithattr?file=putTMP/${fileName}"`);
    win.webContents.send('stdout', execSync(`cd`).toString());
    let result = execSync(`curl -X POST "http://127.0.0.1:5001/api/v0/dht/putvaluewithattr?file=putTMP/${fileName}"`);
    result = result.toString();
    result = JSON.parse(result);
    console.log(result);
    const cid = result.CID_file;

    win.webContents.send('stdout', `${fileName}のCIDは ${cid} です。`);

  });


  ipcMain.handle('getContent', async (_e, cid) => {
    //let result = execSync(`curl -X POST "http://127.0.0.1:5001/api/v0/dht/getvalue?cid=${cid}"`);


    async function getContentExec(cid) {
      const p1 = new Promise((resolve, reject) => {
        const result = exec(`curl -X POST "http://127.0.0.1:5001/api/v0/dht/getvalue?cid=${cid}"`, (error, stdout, stderr) => {
          console.log(stdout);
          resolve([error, stdout, stderr]);
        });
      });
      return p1
    }
    let result = await getContentExec(cid);
    console.log(result[0]);
    console.log(result[1]);
    console.log(result[2]);
    win.webContents.send('stdout', result[1]);

  });

  win.loadFile('./html/index.html');

  //win.webContents.openDevTools();
};

ipcMain.handle('openCmd', () => {
  // 新しいウィンドウでコマンドプロンプトを起動
  const cmd = spawn('cmd', ['/c', 'start'], {
    detached: true, // 親プロセスから切り離して起動
    stdio: 'ignore' // 標準入出力を無視
  });

  cmd.unref();
});
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

