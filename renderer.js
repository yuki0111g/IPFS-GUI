


const btnTest = document.getElementById('btnTest');
btnTest.addEventListener('click', async () => {
    await window.apis.runClickEvent();
});




document.getElementById('btnTest2').addEventListener('click', () => {
    const testBoxBTIP = document.getElementById('bootstrapIp').value;
    const testBoxBTPeerID = document.getElementById('bootstrapPeerId').value;
    window.apis2.sendText(testBoxBTIP,testBoxBTPeerID);
});

const btnTest3 = document.getElementById('btnTest3');
btnTest3.addEventListener('click', async () => {
    await window.apis3.runClickEvent();
});
const btnTest4 = document.getElementById('btnTest4');
btnTest4.addEventListener('click', async () => {
    await window.apis4.runClickEvent();
});


