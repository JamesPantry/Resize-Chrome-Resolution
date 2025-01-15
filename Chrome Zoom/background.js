chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only adjust zoom if the page has fully loaded and the URL is not a chrome:// page
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
        // Ensure that zoomSettings has the values we're looking for
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

                // Get the current page URL to check if it's a Google Search page
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

                        // Check if the page is a Google Search page
                        if (currentURL.includes('google.com/search')) {
                            // Set custom zoom for Google Search pages
                            if (screenWidth >= 2560 && zoomSettings.zoom1440p !== undefined) {
                                zoomLevel = 1;  // Google Search should be 100% on 1440p
                            } else if (screenWidth >= 1920 && zoomSettings.zoom1080p !== undefined) {
                                zoomLevel = 0.9;  // Google Search should be 90% on 1080p
                            }
                        } else {
                            // Regular zoom logic for non-Google pages
                            if (screenWidth >= 2560 && zoomSettings.zoom1440p !== undefined) {
                                zoomLevel = zoomSettings.zoom1440p;
                            } else if (screenWidth >= 1920 && zoomSettings.zoom1080p !== undefined) {
                                zoomLevel = zoomSettings.zoom1080p;
                            } else if (screenWidth < 1920 && zoomSettings.zoom720p !== undefined) {
                                zoomLevel = zoomSettings.zoom720p;
                            }
                        }

                        // Get current zoom level and compare before setting
                        chrome.tabs.getZoom(tabId, (currentZoomLevel) => {
                            // Only apply the zoom level if it differs from the current zoom level
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

