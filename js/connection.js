const outputDiv = document.getElementById('output');

// preloadからの標準出力を受信
window.electronAPI.onStdout((message) => {
    outputDiv.textContent += `[INFO] ${message}\n`;
    outputDiv.scrollTop = outputDiv.scrollHeight;
    //テキストエリアのスクロールを一番下にする。
    // outputTextarea.scrollTop = outputTextarea.scrollHeight;
});

// preloadからの標準エラーを受信
window.electronAPI.onStderr((message) => {
    outputDiv.textContent += `[ERROR] ${message}\n`;
    outputDiv.scrollTop = outputDiv.scrollHeight;
    // outputTextarea.scrollTop = outputTextarea.scrollHeight; 
});

document.getElementById('exit').addEventListener('click', function(event){
    window.apis.exitIpfsEvent();
});