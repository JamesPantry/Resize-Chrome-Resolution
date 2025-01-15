chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && !tab.url.startsWith('chrome://')) {
        adjustZoomForResolution(tabId);
    }
});

chrome.windows.onBoundsChanged.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && !tabs[0].url.startsWith('chrome://')) {
            adjustZoomForResolution(tabs[0].id);
        }
    });
});

function adjustZoomForResolution(tabId) {
    chrome.storage.sync.get(['zoom1440p', 'zoom1080p', 'zoom720p'], (zoomSettings) => {
        if (!zoomSettings.zoom1440p || !zoomSettings.zoom1080p || !zoomSettings.zoom720p) {
            console.warn('One or more zoom settings are missing!');
        }

        chrome.scripting.executeScript(
            {
                target: { tabId: tabId },
                func: getScreenWidth
            },
            (results) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                }

                const screenWidth = results[0].result;

                let zoomLevel = 1; // Default zoom level (100%)

                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabId },
                        func: getCurrentPageURL
                    },
                    (urlResults) => {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError.message);
                            return;
                        }

                        const currentURL = urlResults[0].result;
                        
// EXCEPTION FOR GOOGLE SEARCH
                        if (currentURL.includes('google.com/search')) 
                            if (screenWidth >= 2560 && zoomSettings.zoom1440p !== undefined) {
                                zoomLevel = 1; 
                            } else if (screenWidth >= 1920 && zoomSettings.zoom1080p !== undefined) {
                                zoomLevel = 0.9;
                            }
                        } else {
                            if (screenWidth >= 2560 && zoomSettings.zoom1440p !== undefined) {
                                zoomLevel = zoomSettings.zoom1440p;
                            } else if (screenWidth >= 1920 && zoomSettings.zoom1080p !== undefined) {
                                zoomLevel = zoomSettings.zoom1080p;
                            } else if (screenWidth < 1920 && zoomSettings.zoom720p !== undefined) {
                                zoomLevel = zoomSettings.zoom720p;
                            }
                        }

                        chrome.tabs.getZoom(tabId, (currentZoomLevel) => {
                            if (currentZoomLevel !== zoomLevel) {
                                chrome.tabs.setZoom(tabId, zoomLevel);
                            }
                        });
                    }
                );
            }
        );
    });
}

function getScreenWidth() {
    return window.screen.width;
}

function getCurrentPageURL() {
    return window.location.href;
}

