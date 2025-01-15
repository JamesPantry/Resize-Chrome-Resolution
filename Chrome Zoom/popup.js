document.getElementById('saveButton').addEventListener('click', () => {
    const zoom1440p = parseFloat(document.getElementById('zoom1440p').value);
    const zoom1080p = parseFloat(document.getElementById('zoom1080p').value);
    const zoom720p = parseFloat(document.getElementById('zoom720p').value);

    // Save the zoom levels to Chrome's storage
    chrome.storage.sync.set(
        { zoom1440p, zoom1080p, zoom720p },
        () => {
            alert('Zoom levels saved!');
        }
    );
});

// Load saved zoom levels when the popup is opened
window.onload = () => {
    chrome.storage.sync.get(['zoom1440p', 'zoom1080p', 'zoom720p'], (data) => {
        if (data.zoom1440p !== undefined) {
            document.getElementById('zoom1440p').value = data.zoom1440p;
        }
        if (data.zoom1080p !== undefined) {
            document.getElementById('zoom1080p').value = data.zoom1080p;
        }
        if (data.zoom720p !== undefined) {
            document.getElementById('zoom720p').value = data.zoom720p;
        }
    });
};
