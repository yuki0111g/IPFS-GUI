const btnTest = document.getElementById('bootStrapNode');
btnTest.addEventListener('click', async () => {
    
    window.apis.startBootstrapNodeEvent();
});

document.getElementById('openExplorer').addEventListener('click', function(event){
    window.apis.openExplorerEvent();
});
