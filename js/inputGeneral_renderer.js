document.addEventListener('DOMContentLoaded', () => {
   
    window.apis.getJsonData().then((data) => {
        const ipValues = [data.btip];
        const pidValues = [data.btpid];
        const ipDataList = document.getElementById('ipdatalist');
        const pidDataList = document.getElementById('piddatalist');

        // 配列の値を基に <option> 要素を生成
        ipValues.forEach((value) => {
            const option = document.createElement('option'); // <option> を作成
            option.value = value; // value を設定
            ipDataList.appendChild(option); // datalist に追加
        });

        pidValues.forEach((value) => {
            const option = document.createElement('option'); // <option> を作成
            option.value = value; // value を設定
            pidDataList.appendChild(option); // datalist に追加
        });
    });
});



document.getElementById('connectBtn').addEventListener('click', function (event) {
   
    event.preventDefault(); // ページのリロードを防止

    const ipInput = document.getElementById('ipaddress');
    const peerInput = document.getElementById('peerID');
    const ipError = document.getElementById('ipError');
    const peerError = document.getElementById('peerError');

    // エラー表示をリセット
    ipError.style.display = 'none';
    peerError.style.display = 'none';

    const ipValue = ipInput.value.trim();
    const peerValue = peerInput.value.trim();

    // IPアドレスの正規表現
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    let isValid = true;

    // IPアドレスの検証
    if (ipValue === "" || !ipRegex.test(ipValue)) {
        ipError.style.display = 'block';
        isValid = false;
    }

    // PeerIDの検証（空欄チェック）
    if (peerValue === "") {
        peerError.style.display = 'block';
        isValid = false;
    }

    // 検証がすべて成功した場合、次のページへ遷移
    if (isValid) {
        const testBoxBTIP = document.getElementById('ipaddress').value;
        const testBoxBTPeerID = document.getElementById('peerID').value;
        console.log(testBoxBTIP);
        console.log(testBoxBTPeerID);
        window.apis.startGeneralNodeEvent(testBoxBTIP,testBoxBTPeerID);
        window.location.href = "general.html"; // 接続ページへ遷移
    }
});
