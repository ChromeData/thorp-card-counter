// Background service worker for Card Counter extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GAME_DETECTED') {
    // Store detection info
    chrome.storage.local.set({
      detectedGame: message.game,
      detectedUrl: message.url,
      lastDetection: Date.now()
    });

    // Update badge
    chrome.action.setBadgeText({
      text: '✓',
      tabId: sender.tab?.id
    });

    chrome.action.setBadgeBackgroundColor({
      color: '#4CAF50'
    });
  } else if (message.type === 'COUNT_UPDATE') {
    // Store current count (Hi-Lo system from Beat the Dealer)
    chrome.storage.local.set({
      runningCount: message.runningCount,
      trueCount: message.trueCount,
      highLowIndex: message.highLowIndex,
      playerAdvantage: message.playerAdvantage,
      betRecommendation: message.betRecommendation,
      cardsSeen: message.cardsSeen,
      strategyAdjustments: message.strategyAdjustments,
      lastUpdate: Date.now()
    });

    // Update badge with true count if significant
    if (Math.abs(message.trueCount) > 1) {
      chrome.action.setBadgeText({
        text: message.trueCount > 0 ? '+' + Math.floor(message.trueCount) : Math.floor(message.trueCount).toString(),
        tabId: sender.tab?.id
      });
      chrome.action.setBadgeBackgroundColor({
        color: message.trueCount > 0 ? '#4CAF50' : '#F44336',
        tabId: sender.tab?.id
      });
    } else {
      chrome.action.setBadgeText({
        text: '',
        tabId: sender.tab?.id
      });
    }
  }

  return true;
});

// Listen for tab updates to reset badge on new pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({
      text: '',
      tabId: tabId
    });
  }
});

