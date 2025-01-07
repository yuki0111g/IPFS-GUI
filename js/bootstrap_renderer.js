const outputDiv = document.getElementById('output');

// preloadからの標準出力を受信
window.apis.onStdout((message) => {
    outputDiv.textContent += `[INFO] ${message}\n`;
    outputDiv.scrollTop = outputDiv.scrollHeight;
    //テキストエリアのスクロールを一番下にする。
    // outputTextarea.scrollTop = outputTextarea.scrollHeight;
});

// preloadからの標準エラーを受信
window.apis.onStderr((message) => {
    outputDiv.textContent += `[ERROR] ${message}\n`;
    outputDiv.scrollTop = outputDiv.scrollHeight;
    // outputTextarea.scrollTop = outputTextarea.scrollHeight; 
});

document.getElementById('exit').addEventListener('click', function (event) {
    window.apis.exitIpfsEvent();
});

// ファイルアップロードの処理
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const state = document.getElementById('state');

uploadButton.addEventListener('click', async () => {
    if (fileInput.files.length === 0) {
        state.textContent = "ファイルを選択してください。";
        return;
    }

    const file = fileInput.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Electron のメインプロセスにファイルを送信
    const result = await window.apis.putContentEvent(file.name, fileData);

    if (result.success) {
        state.textContent = "ファイルが保存されました。";
    } else {
        state.textContent = `エラー: ${result.error}`;
    }
});

document.getElementById('downloadButton').addEventListener('click', function(event){
    const cid = document.getElementById('CID').value;
    window.apis.getContentEvent(cid);
});

document.getElementById('openCmd').addEventListener('click', function(event){
    window.apis.openCmd();
});

// すべてのコピーボタンを取得
const copyButtons = document.querySelectorAll('.copy-button');
// 各ボタンにイベントリスナーを追加
copyButtons.forEach(button => {
    button.addEventListener('click', function () {
        // data-target属性からコピー対象のIDを取得
        const targetId = button.getAttribute('data-target');
        const textToCopy = document.getElementById(targetId).innerText;

        // クリップボードにコピー
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert('テキストをコピーしました: ' + textToCopy);
            
            })
            .catch(err => {
                console.error('コピーに失敗しました:', err);
            });
    });
});

window.apis.btInfoFromMain((ipaddress,peerid) =>{
    const btip = document.getElementById('text-to-copy-1');
    const btpid = document.getElementById('text-to-copy-2');
    btip.innerText = ipaddress;
    btpid.innerText = peerid;
});