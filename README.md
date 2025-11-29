# Thorp Card Counter Chrome Extension

An auto-detecting Chrome extension that implements the **Complete Point-Count System (Hi-Lo)** from "Beat the Dealer" by Edward O. Thorp. This is the classic card counting system that revolutionized blackjack strategy.

## Features

- **Auto-Detection**: Automatically detects card games on web pages by analyzing content, keywords, and visual elements
- **Hi-Lo Point Count System**: Implements the exact system from "Beat the Dealer":
  - Cards 2-6: +1 (low cards)
  - Cards 7-9: 0 (neutral)
  - Cards 10, J, Q, K, A: -1 (high cards)
- **True Count Calculation**: Calculates true count (running count ÷ decks remaining) as described in Chapter 7
- **Betting Recommendations**: Provides optimal bet sizing based on true count (from Chapter 7)
- **Player Advantage Estimation**: Estimates player advantage percentage
- **Strategy Adjustments**: Provides guidance on when to adjust basic strategy based on count
- **Visual Overlay**: Shows all key metrics directly on the web page
- **Comprehensive Popup**: Full interface with all information from the book

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension folder
6. The extension is now installed and ready to use!

## Usage

1. Navigate to any card game website (blackjack, poker, etc.)
2. The extension will automatically detect card games
3. Cards will be counted as they appear on the page using the Hi-Lo system
4. Check the extension icon in your toolbar:
   - Green checkmark (✓) = Game detected
   - Number badge = True count (if significant)
5. Click the extension icon to open the popup and view detailed statistics
6. The overlay on the page shows running count, true count, advantage, and bet recommendations

## The Hi-Lo System (From "Beat the Dealer")

### Card Values
- **Low Cards (2-6)**: +1 point each
- **Neutral Cards (7-9)**: 0 points
- **High Cards (10, J, Q, K, A)**: -1 point each

### True Count
The true count is calculated as:
```
True Count = Running Count ÷ Decks Remaining
```

This adjusts the running count for the number of decks in play, giving you an accurate measure of the deck's favorability.

### Betting Recommendations
Based on Chapter 7 of "Beat the Dealer":
- True Count ≤ 2: Bet 1 unit (minimum)
- True Count 3-4: Bet 2 units
- True Count 5-6: Bet 3 units
- True Count 7-8: Bet 4 units
- True Count ≥ 9: Bet 5 units (maximum to avoid casino attention)

### Strategy Adjustments
- **Positive True Count**: Stand more, double down more, split pairs more
- **Negative True Count**: Draw more, double down less, split pairs less
- **Insurance**: Take insurance when true count > 0.8

## Controls

- **Deck Count**: Adjust the number of decks being used (1-8, default: 1)
- **Reset Counter**: Reset the running count and all calculations to zero
- **Refresh Status**: Update the display with the latest counts

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension format)
- **Permissions**: 
  - `activeTab`: Access to the active tab
  - `scripting`: Inject content scripts
  - `storage`: Store count data
  - `host_permissions`: Access all URLs

## Based on "Beat the Dealer"

This extension implements the **Complete Point-Count System** (also known as Hi-Lo) as described in Edward O. Thorp's classic book "Beat the Dealer: A Winning Strategy for the Game of Twenty-One" (1966, revised 2016).

Key chapters referenced:
- **Chapter 3**: Basic Strategy
- **Chapter 4**: A Winning Strategy (Five-count system)
- **Chapter 6**: The Simple Point-Count System
- **Chapter 7**: The Complete Point-Count System (Hi-Lo) - **Primary system implemented**
- **Chapter 8**: A Winning Strategy Based on Counting Tens

## Files Structure

```
├── manifest.json      # Extension configuration
├── background.js      # Service worker for background tasks
├── content.js         # Content script implementing Hi-Lo system
├── popup.html         # Popup user interface
├── popup.js           # Popup functionality
├── icon16.png         # Extension icon (16x16)
├── icon48.png         # Extension icon (48x48)
├── icon128.png        # Extension icon (128x128)
└── README.md          # This file
```

## Notes

- This extension is for educational purposes and implements the mathematical system from "Beat the Dealer"
- Card detection accuracy depends on how cards are displayed on the website
- Some sites may require manual counting if cards aren't in standard text format
- The extension works best with text-based card displays
- Always use basic strategy when the count is neutral (true count near 0)

## Development

To modify the extension:
1. Make changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

This project is provided as-is for educational purposes. The card counting system is based on the mathematical work of Edward O. Thorp as described in "Beat the Dealer."

## References

- Thorp, Edward O. (2016). *Beat the Dealer: A Winning Strategy for the Game of Twenty-One*. Vintage Books.
