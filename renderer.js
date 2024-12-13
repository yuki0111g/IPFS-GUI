const btnTest = document.getElementById('btnTest');
btnTest.addEventListener('click', async () => {
    await window.apis.runClickEvent();
});
