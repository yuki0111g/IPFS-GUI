const btnTest = document.getElementById('bootStrapNode');
btnTest.addEventListener('click', async () => {
    
    await window.apis.startBootstrapNodeEvent();
});

document.getElementById('openExplorer').addEventListener('click', function(event){
    window.apis.openExplorerEvent();
});
