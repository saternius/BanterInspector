// CoinFlip Extension
// Adds a draggable popup window with a flip button
let getPennies = ()=>{
    return SM.getAllEntities()
    .filter(x=>x.penny)
    .map(x=>x.getComponent("MonoBehavior"))
    .filter(x=>x.properties.file === "Flipable.js")
    .map(x=>x.ctx)
}

class CoinFlip {
    constructor() {
        this.popup = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.bankroll = 0; // Bankroll in cents
        this.trackingCoins = new Map(); // Map of coin ID -> interval ID for tracking
    }

    init() {
        this.createPopup();
        this.injectStyles();
        return this.popup;
    }

    createPopup() {
        // Create popup container
        this.popup = document.createElement('div');
        this.popup.id = 'coinflip-popup';
        this.popup.className = 'coinflip-popup';
        this.popup.innerHTML = `
            <div class="coinflip-header">
                <span class="coinflip-title">🪙 Coin Flip</span>
                <button class="coinflip-close" title="Close">&times;</button>
            </div>
            <div class="coinflip-content">
                <div class="coinflip-bankroll">Bankroll: $<span id="bankroll-amount">0.00</span></div>
                <button class="coinflip-btn">Flip</button>
            </div>
        `;

        // Position popup in center of screen initially
        this.popup.style.left = '50%';
        this.popup.style.top = '50%';
        this.popup.style.transform = 'translate(-50%, -50%)';

        // Add to document body
        document.body.appendChild(this.popup);

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const header = this.popup.querySelector('.coinflip-header');
        const closeBtn = this.popup.querySelector('.coinflip-close');
        const flipBtn = this.popup.querySelector('.coinflip-btn');

        // Dragging functionality
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('coinflip-close')) return;

            this.isDragging = true;

            // Get current position
            const rect = this.popup.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;

            // Remove transform for absolute positioning
            this.popup.style.transform = 'none';

            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;

            this.popup.style.left = `${x}px`;
            this.popup.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                header.style.cursor = 'grab';
            }
        });

        // Close button
        closeBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.close();
        });

        // Flip button
        flipBtn.addEventListener('mousedown', () => {
            //console.log("FLIP!");
            const pennies = getPennies();
            pennies.forEach(x => {
                x.flip();
                // Start tracking this coin
                this.trackCoin(x._entity);
            });
        });
    }

    injectStyles() {
        if (document.getElementById('coinflip-styles')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'coinflip-styles';
        styleEl.textContent = `
            .coinflip-popup {
                position: fixed;
                width: 200px;
                background: rgba(30, 30, 30, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .coinflip-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px 8px 0 0;
                cursor: grab;
                user-select: none;
            }

            .coinflip-title {
                color: #fff;
                font-size: 14px;
                font-weight: 600;
            }

            .coinflip-close {
                background: transparent;
                border: none;
                color: #aaa;
                font-size: 24px;
                line-height: 1;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s;
            }

            .coinflip-close:hover {
                color: #fff;
            }

            .coinflip-content {
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }

            .coinflip-bankroll {
                color: #fff;
                font-size: 18px;
                font-weight: 600;
                text-align: center;
                padding: 10px 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                min-width: 150px;
            }

            #bankroll-amount {
                color: #4ade80;
                font-family: 'Courier New', monospace;
            }

            .coinflip-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 6px;
                padding: 12px 40px;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.1s, box-shadow 0.2s;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
            }

            .coinflip-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
            }

            .coinflip-btn:active {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(styleEl);
    }

    updateBankrollDisplay() {
        const bankrollElement = document.getElementById('bankroll-amount');
        if (bankrollElement) {
            bankrollElement.textContent = (this.bankroll / 100).toFixed(2);
        }
    }

    trackCoin(entity) {
        // Prevent tracking the same coin multiple times
        const coinKey = entity.id;
        if (this.trackingCoins.has(coinKey)) {
            return;
        }

        // Wait 500ms before starting to track to let physics kick in
        setTimeout(() => {
            let checkCount = 0;
            let hasMovedSignificantly = false;

            const checkInterval = setInterval(() => {
                const rigidBody = entity.getComponent("BanterRigidbody");
                if (!rigidBody) {
                    clearInterval(checkInterval);
                    this.trackingCoins.delete(coinKey);
                    return;
                }

                // Try to get velocity from the BanterScript rigidbody
                let velocity = rigidBody._bs.velocity;
                if (!velocity) {
                    // Fallback: check position changes
                    const currentPos = entity.Get("position");
                    if (!this.lastCoinPos) {
                        this.lastCoinPos = {};
                    }

                    if (this.lastCoinPos[coinKey]) {
                        const dx = currentPos.x - this.lastCoinPos[coinKey].x;
                        const dy = currentPos.y - this.lastCoinPos[coinKey].y;
                        const dz = currentPos.z - this.lastCoinPos[coinKey].z;
                        velocity = { x: dx * 10, y: dy * 10, z: dz * 10 }; // Approximate velocity
                    } else {
                        velocity = { x: 100, y: 100, z: 100 }; // Force movement detection on first check
                    }
                    this.lastCoinPos[coinKey] = currentPos;
                }

                const speed = Math.sqrt(velocity.x**2 + velocity.y**2 + velocity.z**2);

                // Track if coin has moved significantly
                if (speed > 0.5) {
                    hasMovedSignificantly = true;
                }

                // Debug logging (remove after testing)
                if (checkCount % 10 === 0) {
                    console.log(`Coin ${coinKey} - Speed: ${speed.toFixed(3)}, HasMoved: ${hasMovedSignificantly}`);
                }

                checkCount++;

                // Only consider it settled if it has moved significantly AND is now slow
                if (hasMovedSignificantly && speed < 0.2) {
                    clearInterval(checkInterval);
                    this.trackingCoins.delete(coinKey);

                    // Clean up position tracking
                    if (this.lastCoinPos && this.lastCoinPos[coinKey]) {
                        delete this.lastCoinPos[coinKey];
                    }

                    // Check if it's heads or tails
                    const isHeads = this.isCoinHeads(entity);
                    console.log(`Coin landed: ${isHeads ? 'HEADS' : 'TAILS'}`);

                    if (isHeads) {
                        this.bankroll += 1; // Add 1 cent
                        this.updateBankrollDisplay();
                        console.log(`Won! Bankroll: $${(this.bankroll / 100).toFixed(2)}`);
                    }
                }

                // Timeout after 10 seconds
                if (checkCount > 100) {
                    console.log(`Coin tracking timeout for ${coinKey}`);
                    clearInterval(checkInterval);
                    this.trackingCoins.delete(coinKey);
                    if (this.lastCoinPos && this.lastCoinPos[coinKey]) {
                        delete this.lastCoinPos[coinKey];
                    }
                }
            }, 100); // Check every 100ms

            // Store interval ID so we can clear it later
            this.trackingCoins.set(coinKey, checkInterval);
        }, 500); // Wait 500ms before starting tracking
    }

    isCoinHeads(entity) {
        // Get the rotation of the coin
        const rotation = entity.Get("rotation");

        if (!rotation) {
            return false;
        }

        // Convert quaternion to up vector
        // For a coin, we check if the local "up" vector points upward in world space
        // Quaternion to matrix conversion for the up vector (0,1,0)
        const { x, y, z, w } = rotation;

        // Calculate the world "up" direction from the coin's local up axis
        const upX = 2 * (x*y + w*z);
        const upY = 1 - 2 * (x*x + z*z);
        const upZ = 2 * (y*z - w*x);

        // If the coin's up vector points upward (positive Y), it's heads
        // If it points downward (negative Y), it's tails
        return upY > 0;
    }

    close() {
        if (this.popup && this.popup.parentNode) {
            this.popup.remove();
        }
    }

    destroy() {
        // Clear all tracking intervals
        for (const [, intervalId] of this.trackingCoins.entries()) {
            clearInterval(intervalId);
        }
        this.trackingCoins.clear();

        this.close();

        // Remove styles
        const styles = document.getElementById('coinflip-styles');
        if (styles && styles.parentNode) {
            styles.remove();
        }

        if (window.coinFlipInstance) {
            delete window.coinFlipInstance;
        }
    }
}

// Initialize extension
let coinFlipInstance = null;
let popupElement = null;

this.default = {};

Object.entries(this.default).forEach(([key, val]) => {
    if (!this.vars[key]) this.vars[key] = val;
});

this.onStart = () => {
    console.log("CoinFlip extension starting...");
    coinFlipInstance = new CoinFlip();
    popupElement = coinFlipInstance.init();

    // Make instance globally accessible
    window.coinFlipInstance = coinFlipInstance;
};

this.onUpdate = () => {
    // No update logic needed
};

this.onDestroy = () => {
    console.log("CoinFlip extension destroying...");
    if (coinFlipInstance) {
        coinFlipInstance.destroy();
        coinFlipInstance = null;
        popupElement = null;
    }
};

this.keyDown = (_key) => {
    // Optional: Add keyboard shortcuts if needed
};

this.keyUp = (_key) => {
    // Optional: Add keyboard shortcuts if needed
};