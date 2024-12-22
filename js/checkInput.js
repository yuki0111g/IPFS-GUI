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
        window.apis2.sendText(testBoxBTIP, testBoxBTPeerID);
        window.location.href = "connection.html"; // 接続ページへ遷移
    }
});