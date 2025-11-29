// Auto-detecting Card Counter based on "Beat the Dealer" by Edward O. Thorp
// Implements the Complete Point-Count System (Hi-Lo)

class ThorpCardCounter {
  constructor() {
    // Hi-Lo Point Count System
    // Cards 2-6: +1 (low cards)
    // Cards 7-9: 0 (neutral)
    // Cards 10, J, Q, K, A: -1 (high cards)
    
    this.runningCount = 0;  // Total point count
    this.cardsSeen = 0;      // Total cards seen
    this.deckCount = 1;      // Number of decks (user configurable)
    this.trueCount = 0;      // Running count / decks remaining
    this.highLowIndex = 0;   // True count as percentage
    this.playerAdvantage = 0; // Estimated player advantage
    this.betRecommendation = 1; // Recommended bet units
    
    // Strategy tracking
    this.strategyAdjustments = {
      stand: false,
      draw: false,
      doubleDown: false,
      split: false,
      insurance: false
    };
    
    this.detectedGame = null;
    this.init();
  }

  init() {
    this.detectGame();
    this.setupCardObserver();
    this.injectOverlay();
    this.startAutoRefresh();
  }

  // Auto-detect card games
  detectGame() {
    const bodyText = document.body.innerText.toLowerCase();
    const title = document.title.toLowerCase();
    const url = window.location.href.toLowerCase();

    const gamePatterns = {
      blackjack: ['blackjack', '21', 'bj', 'dealer', 'hit', 'stand', 'double down', 'split'],
      poker: ['poker', 'texas hold', 'holdem', 'flop', 'turn', 'river'],
      baccarat: ['baccarat', 'punto', 'banco'],
      'card game': ['cards', 'playing cards', 'deck', 'hand']
    };

    for (const [game, keywords] of Object.entries(gamePatterns)) {
      const matchCount = keywords.filter(keyword => 
        bodyText.includes(keyword) || title.includes(keyword) || url.includes(keyword)
      ).length;

      if (matchCount >= 3 || (game === 'blackjack' && matchCount >= 2)) {
        this.detectedGame = game;
        console.log(`Auto-detected game: ${game}`);
        this.sendDetectionMessage(game);
        return;
      }
    }

    this.detectCardsByVisuals();
  }

  detectCardsByVisuals() {
    const cardSelectors = [
      '[class*="card"]',
      '[id*="card"]',
      '[data-card]',
      '.playing-card',
      '[role="img"][alt*="card"]'
    ];

    let cardElements = [];
    cardSelectors.forEach(selector => {
      try {
        cardElements.push(...document.querySelectorAll(selector));
      } catch (e) {}
    });

    if (cardElements.length >= 2) {
      this.detectedGame = 'card game';
      this.sendDetectionMessage('card game');
    }
  }

  // Hi-Lo point count system from Beat the Dealer
  getCardValue(cardStr) {
    if (!cardStr) return 0;
    
    const str = cardStr.toLowerCase().trim();
    
    // Aces and 10-value cards: -1
    if (['ace', 'a', '1'].includes(str) || str === '10' || 
        ['king', 'queen', 'jack', 'k', 'q', 'j'].includes(str)) {
      return -1;
    }
    
    // Low cards 2-6: +1
    const num = parseInt(str);
    if (num >= 2 && num <= 6) return 1;
    
    // Neutral cards 7-9: 0
    if (num >= 7 && num <= 9) return 0;
    
    return 0;
  }

  // Calculate true count (running count / decks remaining)
  calculateTrueCount() {
    const totalCards = this.deckCount * 52;
    const cardsRemaining = totalCards - this.cardsSeen;
    const decksRemaining = cardsRemaining / 52;
    
    if (decksRemaining <= 0) {
      this.trueCount = 0;
      this.highLowIndex = 0;
      return;
    }
    
    // True count = running count / decks remaining
    this.trueCount = this.runningCount / decksRemaining;
    
    // High-Low Index (as percentage)
    this.highLowIndex = (this.runningCount / cardsRemaining) * 100;
    
    // Estimate player advantage (from Beat the Dealer Chapter 7)
    // Rough approximation based on true count
    if (this.trueCount > 0) {
      this.playerAdvantage = Math.min(this.trueCount * 0.5, 10); // Cap at 10%
    } else {
      this.playerAdvantage = Math.max(this.trueCount * 0.5, -2); // Floor at -2%
    }
    
    // Betting recommendation (from Beat the Dealer)
    this.calculateBetRecommendation();
    
    // Strategy adjustments
    this.calculateStrategyAdjustments();
  }

  // Betting recommendations from Beat the Dealer Chapter 7
  calculateBetRecommendation() {
    const index = Math.round(this.trueCount);
    
    if (index <= 2) {
      this.betRecommendation = 1; // Minimum bet
    } else if (index <= 4) {
      this.betRecommendation = 2;
    } else if (index <= 6) {
      this.betRecommendation = 3;
    } else if (index <= 8) {
      this.betRecommendation = 4;
    } else {
      this.betRecommendation = 5; // Maximum (to avoid casino attention)
    }
  }

  // Strategy adjustments based on count (from Beat the Dealer)
  calculateStrategyAdjustments() {
    const tc = this.trueCount;
    
    // Insurance: take if true count > 0.8 (from Chapter 7)
    this.strategyAdjustments.insurance = tc > 0.8;
    
    // General strategy guidance
    // When count is positive: stand more, double more, split more
    // When count is negative: draw more, double less, split less
    this.strategyAdjustments.stand = tc > 0;
    this.strategyAdjustments.draw = tc < 0;
    this.strategyAdjustments.doubleDown = tc > 1;
    this.strategyAdjustments.split = tc > 0;
  }

  // Update count when card is seen
  updateCount(cardValue) {
    this.runningCount += cardValue;
    this.cardsSeen++;
    this.calculateTrueCount();
    this.sendCountUpdate();
    this.updateVisualIndicator();
  }

  // Extract card value from element
  extractCardValue(element) {
    const text = element.innerText?.trim() || '';
    const cardMatch = text.match(/(\d+|ace|king|queen|jack|a|k|q|j|ten)/i);
    
    if (cardMatch && !element.hasAttribute('data-card-counted')) {
      const cardValue = this.getCardValue(cardMatch[1]);
      if (cardValue !== 0 || cardMatch[1]) { // Count all cards, even if value is 0
        this.updateCount(cardValue);
        element.setAttribute('data-card-counted', 'true');
      }
    }
  }

  // Observe DOM for new cards
  setupCardObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            this.checkForNewCards(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  checkForNewCards(element) {
    const cardKeywords = ['card', 'ace', 'king', 'queen', 'jack', 'spade', 'heart', 'diamond', 'club', 'ten'];
    const elementText = element.innerText?.toLowerCase() || '';
    const elementClass = element.className?.toLowerCase() || '';
    
    const hasCardKeyword = cardKeywords.some(keyword => 
      elementText.includes(keyword) || elementClass.includes(keyword)
    );

    if (hasCardKeyword && !this.detectedGame) {
      this.detectedGame = 'card game';
      this.sendDetectionMessage('card game');
    }

    if (this.detectedGame) {
      this.extractCardValue(element);
    }
  }

  // Send detection message
  sendDetectionMessage(game) {
    chrome.runtime.sendMessage({
      type: 'GAME_DETECTED',
      game: game,
      url: window.location.href
    });
  }

  // Send count update
  sendCountUpdate() {
    chrome.runtime.sendMessage({
      type: 'COUNT_UPDATE',
      runningCount: this.runningCount,
      trueCount: this.trueCount,
      highLowIndex: this.highLowIndex,
      playerAdvantage: this.playerAdvantage,
      betRecommendation: this.betRecommendation,
      cardsSeen: this.cardsSeen,
      strategyAdjustments: this.strategyAdjustments
    });
  }

  // Inject visual overlay
  injectOverlay() {
    if (document.getElementById('thorp-counter-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'thorp-counter-overlay';
    overlay.innerHTML = `
      <div class="thorp-counter-display">
        <div class="counter-header">
          <div class="counter-title">🎴 Thorp Counter</div>
          <div class="counter-subtitle">Hi-Lo System</div>
        </div>
        <div class="counter-stats">
          <div class="stat-row">
            <span class="stat-label">Running:</span>
            <span id="running-count-display" class="stat-value">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">True Count:</span>
            <span id="true-count-display" class="stat-value">0.0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Index:</span>
            <span id="index-display" class="stat-value">0%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Advantage:</span>
            <span id="advantage-display" class="stat-value">0.0%</span>
          </div>
          <div class="stat-row highlight">
            <span class="stat-label">Bet:</span>
            <span id="bet-display" class="stat-value">1 unit</span>
          </div>
        </div>
        <div class="strategy-hints" id="strategy-hints">
          <div class="hint">Using Basic Strategy</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.injectStyles();
  }

  // Update visual indicator
  updateVisualIndicator() {
    const runningEl = document.getElementById('running-count-display');
    const trueEl = document.getElementById('true-count-display');
    const indexEl = document.getElementById('index-display');
    const advantageEl = document.getElementById('advantage-display');
    const betEl = document.getElementById('bet-display');
    const hintsEl = document.getElementById('strategy-hints');

    if (runningEl) {
      runningEl.textContent = this.runningCount > 0 ? `+${this.runningCount}` : this.runningCount.toString();
      runningEl.style.color = this.runningCount > 0 ? '#4CAF50' : 
                              this.runningCount < 0 ? '#F44336' : '#666';
    }

    if (trueEl) {
      trueEl.textContent = this.trueCount > 0 ? `+${this.trueCount.toFixed(1)}` : this.trueCount.toFixed(1);
      trueEl.style.color = this.trueCount > 2 ? '#4CAF50' : 
                           this.trueCount < -2 ? '#F44336' : '#666';
    }

    if (indexEl) {
      indexEl.textContent = this.highLowIndex > 0 ? `+${this.highLowIndex.toFixed(1)}%` : `${this.highLowIndex.toFixed(1)}%`;
      indexEl.style.color = this.highLowIndex > 2 ? '#4CAF50' : 
                           this.highLowIndex < -2 ? '#F44336' : '#666';
    }

    if (advantageEl) {
      advantageEl.textContent = this.playerAdvantage > 0 ? `+${this.playerAdvantage.toFixed(1)}%` : `${this.playerAdvantage.toFixed(1)}%`;
      advantageEl.style.color = this.playerAdvantage > 1 ? '#4CAF50' : 
                                this.playerAdvantage < -1 ? '#F44336' : '#666';
    }

    if (betEl) {
      betEl.textContent = `${this.betRecommendation} unit${this.betRecommendation > 1 ? 's' : ''}`;
      betEl.style.color = this.betRecommendation > 1 ? '#4CAF50' : '#666';
    }

    if (hintsEl) {
      const hints = [];
      if (this.strategyAdjustments.insurance) {
        hints.push('✓ Take Insurance');
      }
      if (this.trueCount > 2) {
        hints.push('Stand more, Double more');
      } else if (this.trueCount < -2) {
        hints.push('Draw more, Double less');
      } else {
        hints.push('Use Basic Strategy');
      }
      hintsEl.innerHTML = hints.map(h => `<div class="hint">${h}</div>`).join('');
    }
  }

  // Inject CSS styles
  injectStyles() {
    if (document.getElementById('thorp-counter-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'thorp-counter-styles';
    style.textContent = `
      #thorp-counter-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .thorp-counter-display {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 2px solid #fff;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        min-width: 220px;
        color: white;
      }
      .counter-header {
        text-align: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.3);
      }
      .counter-title {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 4px;
      }
      .counter-subtitle {
        font-size: 11px;
        opacity: 0.9;
      }
      .counter-stats {
        margin: 12px 0;
      }
      .stat-row {
        display: flex;
        justify-content: space-between;
        margin: 6px 0;
        font-size: 13px;
      }
      .stat-row.highlight {
        background: rgba(255,255,255,0.2);
        padding: 6px;
        border-radius: 6px;
        margin-top: 8px;
        font-weight: bold;
      }
      .stat-label {
        opacity: 0.9;
      }
      .stat-value {
        font-weight: bold;
        font-size: 14px;
      }
      .strategy-hints {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.3);
        font-size: 11px;
      }
      .hint {
        margin: 4px 0;
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
  }

  // Reset counter
  reset() {
    this.runningCount = 0;
    this.cardsSeen = 0;
    this.trueCount = 0;
    this.highLowIndex = 0;
    this.playerAdvantage = 0;
    this.betRecommendation = 1;
    this.calculateTrueCount();
    this.updateVisualIndicator();
    this.sendCountUpdate();
    
    // Clear all counted markers
    document.querySelectorAll('[data-card-counted]').forEach(el => {
      el.removeAttribute('data-card-counted');
    });
  }

  // Set deck count
  setDeckCount(count) {
    this.deckCount = Math.max(1, Math.min(8, count));
    this.calculateTrueCount();
    this.updateVisualIndicator();
    this.sendCountUpdate();
  }

  // Auto-refresh display
  startAutoRefresh() {
    setInterval(() => {
      this.updateVisualIndicator();
    }, 1000);
  }
}

// Initialize counter
let thorpCounter;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    thorpCounter = new ThorpCardCounter();
  });
} else {
  thorpCounter = new ThorpCardCounter();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'RESET_COUNT') {
    if (thorpCounter) {
      thorpCounter.reset();
      sendResponse({ success: true });
    }
  } else if (request.type === 'SET_DECK_COUNT') {
    if (thorpCounter) {
      thorpCounter.setDeckCount(request.count);
      sendResponse({ success: true });
    }
  } else if (request.type === 'GET_STATUS') {
    sendResponse({
      game: thorpCounter?.detectedGame || null,
      runningCount: thorpCounter?.runningCount || 0,
      trueCount: thorpCounter?.trueCount || 0,
      highLowIndex: thorpCounter?.highLowIndex || 0,
      playerAdvantage: thorpCounter?.playerAdvantage || 0,
      betRecommendation: thorpCounter?.betRecommendation || 1,
      cardsSeen: thorpCounter?.cardsSeen || 0,
      deckCount: thorpCounter?.deckCount || 1,
      strategyAdjustments: thorpCounter?.strategyAdjustments || {}
    });
  }
  return true;
});
