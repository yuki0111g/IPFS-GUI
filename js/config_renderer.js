// トグルボタンの初期設定
let config;



// 各トグルボタンの要素を取得
const toggles = {
    //右がdata.jsonのキー トグルのキーとdata.jsonのキーを一致させる
    logLevel: document.getElementById('toggleA'),
    alwaysCleanBoot: document.getElementById('toggleB'),
    featureC: document.getElementById('toggleC'),
};

// トグルボタンの変更イベントを設定
//トグルのキー(loglevel,always...)を回す
Object.keys(toggles).forEach((toggleKey) => {
    toggles[toggleKey].addEventListener('change', () => {
        //const featureKey = toggleKey.replace('toggle', 'feature'); // JSONキーに変換
        config[toggleKey] = toggles[toggleKey].checked; // JSONを更新
        window.apis.updateConfig(config); // メインプロセスに送信
        console.log('Updated Config:', config); // コンソールに出力（デバッグ用）
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
       
        config = await window.apis.sendConfig();
        //回すのはトグルのほうのキー
        //data.jsonと同期
        Object.keys(toggles).forEach((toggleKey) => {
            toggles[toggleKey].checked = config[toggleKey];
        });

    } catch (err) {
        console.error('Error in render.js:', err);
        //document.getElementById('output').textContent = 'Failed to load JSON data.';
    }
});