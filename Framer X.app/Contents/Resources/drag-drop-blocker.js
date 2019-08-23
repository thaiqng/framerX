document.addEventListener('dragover', function(event) {
    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none'
    }
});

document.addEventListener('drop', function(event) {
    event.preventDefault()
});
