// Popup script for Thorp Card Counter extension
// Based on "Beat the Dealer" by Edward O. Thorp

document.addEventListener('DOMContentLoaded', async () => {
  // Get all UI elements
  const gameDetectedEl = document.getElementById('game-detected');
  const cardsSeenEl = document.getElementById('cards-seen');
  const runningCountEl = document.getElementById('running-count');
  const trueCountEl = document.getElementById('true-count');
  const highLowIndexEl = document.getElementById('high-low-index');
  const playerAdvantageEl = document.getElementById('player-advantage');
  const betRecommendationEl = document.getElementById('bet-recommendation');
  const strategyHintsEl = document.getElementById('strategy-hints');
  const deckCountInput = document.getElementById('deck-count');
  const resetBtn = document.getElementById('reset-btn');
  const refreshBtn = document.getElementById('refresh-btn');

  // Load and display status
  const loadStatus = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Get stored data
      const data = await chrome.storage.local.get([
        'detectedGame',
        'runningCount',
        'trueCount',
        'highLowIndex',
        'playerAdvantage',
        'betRecommendation',
        'cardsSeen',
        'deckCount',
        'strategyAdjustments'
      ]);

      // Update game detection
      if (data.detectedGame) {
        gameDetectedEl.textContent = data.detectedGame.charAt(0).toUpperCase() + data.detectedGame.slice(1);
        gameDetectedEl.parentElement.parentElement.classList.add('detected');
        gameDetectedEl.parentElement.parentElement.classList.remove('not-detected');
      } else {
        gameDetectedEl.textContent = 'Not detected';
        gameDetectedEl.parentElement.parentElement.classList.add('not-detected');
        gameDetectedEl.parentElement.parentElement.classList.remove('detected');
      }

      // Update cards seen
      cardsSeenEl.textContent = data.cardsSeen || 0;

      // Update running count
      const runningCount = data.runningCount || 0;
      runningCountEl.textContent = runningCount > 0 ? `+${runningCount}` : runningCount.toString();
      runningCountEl.className = 'status-value ' + 
        (runningCount > 0 ? 'positive' : runningCount < 0 ? 'negative' : 'neutral');

      // Update true count
      const trueCount = data.trueCount || 0;
      trueCountEl.textContent = trueCount > 0 ? `+${trueCount.toFixed(1)}` : trueCount.toFixed(1);
      trueCountEl.className = 'status-value ' + 
        (trueCount > 2 ? 'positive' : trueCount < -2 ? 'negative' : 'neutral');

      // Update High-Low Index
      const highLowIndex = data.highLowIndex || 0;
      highLowIndexEl.textContent = highLowIndex > 0 ? `+${highLowIndex.toFixed(1)}%` : `${highLowIndex.toFixed(1)}%`;
      highLowIndexEl.className = 'status-value ' + 
        (highLowIndex > 2 ? 'positive' : highLowIndex < -2 ? 'negative' : 'neutral');

      // Update player advantage
      const playerAdvantage = data.playerAdvantage || 0;
      playerAdvantageEl.textContent = playerAdvantage > 0 ? `+${playerAdvantage.toFixed(1)}%` : `${playerAdvantage.toFixed(1)}%`;
      playerAdvantageEl.className = 'status-value ' + 
        (playerAdvantage > 1 ? 'positive' : playerAdvantage < -1 ? 'negative' : 'neutral');

      // Update bet recommendation
      const betRec = data.betRecommendation || 1;
      betRecommendationEl.textContent = `${betRec} unit${betRec > 1 ? 's' : ''}`;
      betRecommendationEl.className = 'status-value ' + 
        (betRec > 1 ? 'positive' : 'neutral');

      // Update deck count input
      if (data.deckCount) {
        deckCountInput.value = data.deckCount;
      }

      // Update strategy hints
      updateStrategyHints(data.strategyAdjustments || {}, trueCount);

      // Request current status from content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
        if (response) {
          if (response.game) {
            gameDetectedEl.textContent = response.game.charAt(0).toUpperCase() + response.game.slice(1);
            gameDetectedEl.parentElement.parentElement.classList.add('detected');
            gameDetectedEl.parentElement.parentElement.classList.remove('not-detected');
          }
          
          cardsSeenEl.textContent = response.cardsSeen || 0;
          
          const runningCount = response.runningCount || 0;
          runningCountEl.textContent = runningCount > 0 ? `+${runningCount}` : runningCount.toString();
          runningCountEl.className = 'status-value ' + 
            (runningCount > 0 ? 'positive' : runningCount < 0 ? 'negative' : 'neutral');

          const trueCount = response.trueCount || 0;
          trueCountEl.textContent = trueCount > 0 ? `+${trueCount.toFixed(1)}` : trueCount.toFixed(1);
          trueCountEl.className = 'status-value ' + 
            (trueCount > 2 ? 'positive' : trueCount < -2 ? 'negative' : 'neutral');

          const highLowIndex = response.highLowIndex || 0;
          highLowIndexEl.textContent = highLowIndex > 0 ? `+${highLowIndex.toFixed(1)}%` : `${highLowIndex.toFixed(1)}%`;
          highLowIndexEl.className = 'status-value ' + 
            (highLowIndex > 2 ? 'positive' : highLowIndex < -2 ? 'negative' : 'neutral');

          const playerAdvantage = response.playerAdvantage || 0;
          playerAdvantageEl.textContent = playerAdvantage > 0 ? `+${playerAdvantage.toFixed(1)}%` : `${playerAdvantage.toFixed(1)}%`;
          playerAdvantageEl.className = 'status-value ' + 
            (playerAdvantage > 1 ? 'positive' : playerAdvantage < -1 ? 'negative' : 'neutral');

          const betRec = response.betRecommendation || 1;
          betRecommendationEl.textContent = `${betRec} unit${betRec > 1 ? 's' : ''}`;
          betRecommendationEl.className = 'status-value ' + 
            (betRec > 1 ? 'positive' : 'neutral');

          updateStrategyHints(response.strategyAdjustments || {}, trueCount);
        }
      } catch (e) {
        console.log('Content script not ready:', e);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  // Update strategy hints based on count
  function updateStrategyHints(adjustments, trueCount) {
    const hints = [];
    
    if (adjustments.insurance) {
      hints.push('✓ Take Insurance (True Count > 0.8)');
    }
    
    if (trueCount > 2) {
      hints.push('Stand more often');
      hints.push('Double down more often');
      hints.push('Split pairs more often');
    } else if (trueCount > 0) {
      hints.push('Slight advantage - use basic strategy');
    } else if (trueCount < -2) {
      hints.push('Draw more often');
      hints.push('Double down less often');
      hints.push('Split pairs less often');
    } else {
      hints.push('Use Basic Strategy');
    }
    
    if (trueCount > 1) {
      hints.push('Deck is favorable');
    } else if (trueCount < -1) {
      hints.push('Deck is unfavorable');
    }
    
    strategyHintsEl.innerHTML = hints.map(h => `<div class="strategy-hint">${h}</div>`).join('');
  }

  // Set deck count
  deckCountInput.addEventListener('change', async () => {
    const deckCount = parseInt(deckCountInput.value) || 1;
    await chrome.storage.local.set({ deckCount });
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'SET_DECK_COUNT',
        count: deckCount
      });
      await loadStatus();
    } catch (e) {
      console.error('Error setting deck count:', e);
    }
  });

  // Reset counter
  resetBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'RESET_COUNT' });
      await chrome.storage.local.set({
        runningCount: 0,
        trueCount: 0,
        highLowIndex: 0,
        playerAdvantage: 0,
        betRecommendation: 1,
        cardsSeen: 0
      });
      await loadStatus();
    } catch (e) {
      console.error('Error resetting count:', e);
    }
  });

  // Refresh status
  refreshBtn.addEventListener('click', async () => {
    await loadStatus();
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      loadStatus();
    }
  });

  // Initial load
  await loadStatus();

  // Auto-refresh every 2 seconds
  setInterval(loadStatus, 2000);
});
