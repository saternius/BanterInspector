// CoinFlip Extension

// Adds a draggable popup window with a flip button
this.default = {
    flipTarget: {
        "type": "string",
        "value": "Penny"
    }
}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]){
        this.vars[key] = val
    }
})    


class CoinFlip {
    constructor(ctx) {
        this.popup = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isFlipping = false; // Track if a flip is in progress
        this.autoMode = false; // Track if auto mode is enabled
        this.autoFlipInterval = null; // Store the interval ID for auto flipping
        // Preserve bankroll between instances if it exists
        this.bankroll = (window.coinFlipInstance && window.coinFlipInstance.bankroll) || 0; // Bankroll in cents
        // Preserve flip history and statistics between instances
        this.flipHistory = (window.coinFlipInstance && window.coinFlipInstance.flipHistory) || [];
        this.totalFlips = (window.coinFlipInstance && window.coinFlipInstance.totalFlips) || 0;
        this.headsCount = (window.coinFlipInstance && window.coinFlipInstance.headsCount) || 0;
        this.currentStreak = (window.coinFlipInstance && window.coinFlipInstance.currentStreak) || 0;
        this.longestStreak = (window.coinFlipInstance && window.coinFlipInstance.longestStreak) || 0;
        // Preserve airtime statistics
        this.airtimes = (window.coinFlipInstance && window.coinFlipInstance.airtimes) || [];
        this.airtimeQuartiles = (window.coinFlipInstance && window.coinFlipInstance.airtimeQuartiles) || {
            min: 0,
            q1: 0,
            median: 0,
            q3: 0,
            max: 0
        };
        this.ctx = ctx;
        this.updatePropsInterval = null;
    }

    init() {
        this.createPopup();
        this.injectStyles();
        this.startStatsUpdate();
        return this.popup;
    }

    createPopup() {
        // Remove any existing popup first (singleton pattern)
        const existingPopup = document.getElementById('coinflip-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create popup container
        this.popup = document.createElement('div');
        this.popup.id = 'coinflip-popup';
        this.popup.className = 'coinflip-popup';
        this.popup.innerHTML = `
            <div class="coinflip-header">
                <span class="coinflip-title">🪙 ${this.ctx._entity.name}</span>
                <button class="coinflip-close" title="Close">&times;</button>
            </div>
            <div class="coinflip-content">
                <div class="coinflip-section coinflip-controls">
                    <div class="coinflip-bankroll">$ <span id="bankroll-amount">0.00</span></div>
                    <div class="coinflip-buttons">
                        <button class="coinflip-btn">Flip!</button>
                        <button class="coinflip-auto-btn">Auto</button>
                    </div>
                </div>
                <div class="coinflip-section coinflip-log-section">
                    <h3>Flip Log</h3>
                    <div class="coinflip-log" id="flip-log"></div>
                </div>
                <div class="coinflip-section coinflip-stats">
                    <h3>Statistics</h3>
                    <div class="stat-item">
                        <span class="stat-label">Total Flips:</span>
                        <span class="stat-value" id="total-flips">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Heads:</span>
                        <span class="stat-value" id="heads-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Longest Streak:</span>
                        <span class="stat-value" id="longest-streak">0</span>
                    </div>
                    <div class="stat-divider"></div>
                    <h3>Airtime (sec)</h3>
                    <div class="stat-item">
                        <span class="stat-label">Min:</span>
                        <span class="stat-value" id="airtime-min">0.00</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Q1:</span>
                        <span class="stat-value" id="airtime-q1">0.00</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Median:</span>
                        <span class="stat-value" id="airtime-median">0.00</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Q3:</span>
                        <span class="stat-value" id="airtime-q3">0.00</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Max:</span>
                        <span class="stat-value" id="airtime-max">0.00</span>
                    </div>
                </div>
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

        // Initialize displays
        this.updateBankrollDisplay();
        this.updateStatisticsDisplay();
        this.updateFlipLog();
    }

    setupEventListeners() {
        const header = this.popup.querySelector('.coinflip-header');
        const closeBtn = this.popup.querySelector('.coinflip-close');
        const flipBtn = this.popup.querySelector('.coinflip-btn');
        const autoBtn = this.popup.querySelector('.coinflip-auto-btn');

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
        flipBtn.addEventListener('mousedown', async () => {
            if (!this.autoMode) { // Only allow manual flip when not in auto mode
                await this.performFlip();
            }
        });

        // Auto button
        autoBtn.addEventListener('mousedown', () => {
            this.toggleAutoMode();
        });

    }

    getCoin(){
        log("FlipController", "getCoin", this.ctx.vars.flipTarget.value);
        let targetPath = `${this.ctx._entity.id}/${this.ctx.vars.flipTarget.value}`;
        let targetEntity = SM.getEntityById(targetPath);
        log("FlipController", "targetEntity", targetEntity);
        if(!targetEntity){
            showNotification(`Error: ${this.ctx.vars.flipTarget.value} not found`);
            return null;
        }
        return targetEntity.GetScript("Flipable");
        // return SM.getScriptByName("Flipable");
    }

    async performFlip() {
        let syncedObject = this.getCoin()._entity.getComponent("SyncedObject")._bs;
        if(!syncedObject.DoIOwn()){
            syncedObject.TakeOwnership();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Prevent multiple flips
        if (this.isFlipping) {
            return;
        }

        const flipBtn = this.popup.querySelector('.coinflip-btn');

        // Set flipping state and disable button
        this.isFlipping = true;
        if (!this.autoMode) { // Only disable button in manual mode
            flipBtn.disabled = true;
            flipBtn.classList.add('disabled');
            flipBtn.textContent = 'Flipping...';
        }

        try {
            //console.log("FLIP!");
            let coin = this.getCoin()
            if(!coin){
                // Re-enable button if flip can't proceed
                this.isFlipping = false;
                if (!this.autoMode && flipBtn) {
                    flipBtn.disabled = false;
                    flipBtn.classList.remove('disabled');
                    flipBtn.textContent = 'Flip!';
                }
                return;
            }
            log("FlipController", "coin", coin);
            const flipResult = await coin.flip();
            if (flipResult) {
                // Handle both simple result string and object with airtime
                const result = typeof flipResult === 'string' ? flipResult : flipResult.result;
                const airtime = typeof flipResult === 'object' ? flipResult.airtime : Math.random() * 2 + 0.5; // Fallback to random if not provided

                // Update statistics
                this.totalFlips++;

                if (result === 'heads') {
                    this.bankroll += 0.01; // Add 1 cent
                    this.headsCount++;
                    this.currentStreak++;
                    if (this.currentStreak > this.longestStreak) {
                        this.longestStreak = this.currentStreak;
                    }
                } else {
                    this.currentStreak = 0;
                }

                // Track airtime
                this.airtimes.push(airtime);
                this.calculateAirtimeQuartiles();

                // Add to history
                const flipData = {
                    result: result,
                    streak: result === 'heads' ? this.currentStreak : 0,
                    airtime: airtime,
                    timestamp: Date.now(),
                    bankroll: this.bankroll
                };
                this.flipHistory.push(flipData);

                // Broadcast flip result event for GameUI and other components
                window.dispatchEvent(new CustomEvent('coinFlipResult', {
                    detail: flipData
                }));

                // Update all displays
                this.updateBankrollDisplay();
                this.updateStatisticsDisplay();
                this.updateFlipLog();
            }
        } finally {
            // Re-enable button after flip completes
            this.isFlipping = false;
            if (!this.autoMode) { // Only re-enable button in manual mode
                flipBtn.disabled = false;
                flipBtn.classList.remove('disabled');
                flipBtn.textContent = 'Flip!';
            }
        }
    }

    toggleAutoMode() {
        const autoBtn = this.popup.querySelector('.coinflip-auto-btn');
        const flipBtn = this.popup.querySelector('.coinflip-btn');

        this.autoMode = !this.autoMode;

        if (this.autoMode) {
            // Enable auto mode
            autoBtn.classList.add('active');
            autoBtn.textContent = 'Stop';
            flipBtn.disabled = true;
            flipBtn.classList.add('disabled');
            flipBtn.textContent = 'Auto...';

            // Start auto flipping
            this.startAutoFlip();
        } else {
            // Disable auto mode
            autoBtn.classList.remove('active');
            autoBtn.textContent = 'Auto';
            flipBtn.disabled = false;
            flipBtn.classList.remove('disabled');
            flipBtn.textContent = 'Flip!';

            // Stop auto flipping
            this.stopAutoFlip();
        }
    }

    startAutoFlip() {
        // Clear any existing interval
        this.stopAutoFlip();

        // Perform immediate flip
        this.performFlip();

        // Set up interval for automatic flips every 3 seconds
        this.autoFlipInterval = setInterval(async () => {
            if (this.autoMode && !this.isFlipping) {
                await this.performFlip();
            }
        }, 3000);
    }

    stopAutoFlip() {
        if (this.autoFlipInterval) {
            clearInterval(this.autoFlipInterval);
            this.autoFlipInterval = null;
        }
    }

    injectStyles() {
        if (document.getElementById('coinflip-styles')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'coinflip-styles';
        styleEl.textContent = `
            .coinflip-popup {
                position: fixed;
                width: 700px;
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
                padding: 15px;
                display: flex;
                flex-direction: row;
                gap: 15px;
                min-height: 250px;
            }

            .coinflip-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 10px;
                border-right: 1px solid rgba(255, 255, 255, 0.1);
            }

            .coinflip-section:last-child {
                border-right: none;
            }

            .coinflip-section h3 {
                color: #fff;
                font-size: 12px;
                font-weight: 600;
                margin: 0 0 10px 0;
                text-transform: uppercase;
                opacity: 0.8;
            }

            .coinflip-controls {
                justify-content: center;
                gap: 20px;
            }

            .coinflip-bankroll {
                color: #fff;
                font-size: 18px;
                font-weight: 600;
                text-align: center;
                padding: 10px 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                min-width: 120px;
            }

            #bankroll-amount {
                color: #4ade80;
                font-family: 'Courier New', monospace;
            }

            .coinflip-buttons {
                display: flex;
                gap: 10px;
            }

            .coinflip-btn,
            .coinflip-auto-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 6px;
                padding: 12px 30px;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.1s, box-shadow 0.2s;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
            }

            .coinflip-btn:hover,
            .coinflip-auto-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
            }

            .coinflip-btn:active,
            .coinflip-auto-btn:active {
                transform: translateY(0);
            }

            .coinflip-btn:disabled,
            .coinflip-btn.disabled {
                background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
                cursor: not-allowed;
                opacity: 0.6;
                transform: none;
                box-shadow: none;
            }

            .coinflip-btn:disabled:hover,
            .coinflip-btn.disabled:hover {
                transform: none;
                box-shadow: none;
            }

            .coinflip-auto-btn.active {
                background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
                animation: pulse 1.5s ease-in-out infinite;
            }

            @keyframes pulse {
                0% {
                    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
                }
                50% {
                    box-shadow: 0 2px 15px rgba(245, 158, 11, 0.8);
                }
                100% {
                    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
                }
            }

            .coinflip-log-section {
                flex: 1.5;
            }

            .coinflip-log {
                width: 100%;
                overflow-y: auto;
                padding: 5px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }

            .flip-entry {
                padding: 4px 8px;
                margin: 2px 0;
                border-radius: 3px;
                font-size: 12px;
                font-weight: 600;
                text-align: center;
            }

            .flip-entry .heads {
                color: #4ade80;
                text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
            }

            .flip-entry .tails {
                color: #888;
            }

            .coinflip-stats {
                gap: 8px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                width: 100%;
                padding: 5px 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                margin: 3px 0;
            }

            .stat-label {
                color: #aaa;
                font-size: 11px;
                font-weight: 500;
            }

            .stat-value {
                color: #fff;
                font-size: 11px;
                font-weight: 700;
                font-family: 'Courier New', monospace;
            }

            .stat-divider {
                width: 100%;
                height: 1px;
                background: rgba(255, 255, 255, 0.1);
                margin: 10px 0;
            }

            /* Scrollbar styling */
            .coinflip-log::-webkit-scrollbar {
                width: 6px;
            }

            .coinflip-log::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
            }

            .coinflip-log::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }

            .coinflip-log::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(styleEl);
    }

    updateBankrollDisplay() {
        // Only update the bankroll display for our popup
        if (!this.popup) return;

        const bankrollElement = this.popup.querySelector('#bankroll-amount');

        if (bankrollElement) {
            bankrollElement.textContent = (this.bankroll).toFixed(2);
        }
    }

    updateStatisticsDisplay() {
        if (!this.popup) return;

        const totalFlipsEl = this.popup.querySelector('#total-flips');
        const headsCountEl = this.popup.querySelector('#heads-count');
        const longestStreakEl = this.popup.querySelector('#longest-streak');

        if (totalFlipsEl) totalFlipsEl.textContent = this.totalFlips;
        if (headsCountEl) headsCountEl.textContent = this.headsCount;
        if (longestStreakEl) longestStreakEl.textContent = this.longestStreak;

        // Update airtime statistics
        const airtimeMinEl = this.popup.querySelector('#airtime-min');
        const airtimeQ1El = this.popup.querySelector('#airtime-q1');
        const airtimeMedianEl = this.popup.querySelector('#airtime-median');
        const airtimeQ3El = this.popup.querySelector('#airtime-q3');
        const airtimeMaxEl = this.popup.querySelector('#airtime-max');

        if (airtimeMinEl) airtimeMinEl.textContent = this.airtimeQuartiles.min.toFixed(2);
        if (airtimeQ1El) airtimeQ1El.textContent = this.airtimeQuartiles.q1.toFixed(2);
        if (airtimeMedianEl) airtimeMedianEl.textContent = this.airtimeQuartiles.median.toFixed(2);
        if (airtimeQ3El) airtimeQ3El.textContent = this.airtimeQuartiles.q3.toFixed(2);
        if (airtimeMaxEl) airtimeMaxEl.textContent = this.airtimeQuartiles.max.toFixed(2);
    }

    updateFlipLog() {
        if (!this.popup) return;

        const logContainer = this.popup.querySelector('#flip-log');
        if (!logContainer) return;

        // Clear and rebuild the log
        logContainer.innerHTML = '';

        // Show last 10 flips (most recent first)
        const recentFlips = this.flipHistory.slice(-10).reverse();

        recentFlips.forEach(flip => {
            const logEntry = document.createElement('div');
            logEntry.className = 'flip-entry';

            if (flip.result === 'heads') {
                const exclamations = '!'.repeat(flip.streak - 1);
                logEntry.innerHTML = `<span class="heads">HEADS${exclamations}</span>`;
            } else {
                logEntry.innerHTML = `<span class="tails">TAILS</span>`;
            }

            logContainer.appendChild(logEntry);
        });

        // Auto-scroll to top (latest flip)
        logContainer.scrollTop = 0;
    }

    calculateAirtimeQuartiles() {
        if (this.airtimes.length === 0) {
            this.airtimeQuartiles = { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
            return;
        }

        // Sort airtimes in ascending order
        const sorted = [...this.airtimes].sort((a, b) => a - b);
        const n = sorted.length;

        // Calculate quartiles
        this.airtimeQuartiles = {
            min: sorted[0],
            q1: this.percentile(sorted, 0.25),
            median: this.percentile(sorted, 0.5),
            q3: this.percentile(sorted, 0.75),
            max: sorted[n - 1]
        };
    }

    percentile(sortedArray, percentile) {
        const index = percentile * (sortedArray.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;

        if (lower === upper) {
            return sortedArray[lower];
        }

        return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
    }

    startStatsUpdate() {
        // Clear any existing interval
        if (this.updatePropsInterval) {
            clearInterval(this.updatePropsInterval);
        }
    }

    stopStatsUpdate() {
        if (this.updatePropsInterval) {
            clearInterval(this.updatePropsInterval);
            this.updatePropsInterval = null;
        }
    }

    close() {
        this.stopStatsUpdate();
        this.stopAutoFlip(); // Stop auto mode if running
        if (this.popup && this.popup.parentNode) {
            this.popup.remove();
        }
    }

    destroy() {
        this.stopAutoFlip(); // Stop auto mode if running
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
    if(this._component.amOwner()){ //initialize app scene vars
        networking.setSpaceProperty("CoinFlip_Bankroll", 0);
        networking.setSpaceProperty("CoinFlip_TotalFlips", 0);
        networking.setSpaceProperty("CoinFlip_Multiplier", 0);
        networking.setSpaceProperty("CoinFlip_MultBase", 0);
        networking.setSpaceProperty("CoinFlip_CoinVal", 0.01);
        networking.setSpaceProperty("CoinFlip_Offset", 0);
        networking.setSpaceProperty("CoinFlip_FlipStrength", 3);
        networking.setSpaceProperty("CoinFlip_MultPrice", 0.01);
        networking.setSpaceProperty("CoinFlip_BasePrice", 0.01);
        networking.setSpaceProperty("CoinFlip_OffsetPrice", 0.01);
        networking.setSpaceProperty("CoinFlip_StrengthPrice", 0.01);
    }

    console.log("CoinFlip extension starting...");

    // Singleton pattern: Destroy any existing instance first
    if (window.coinFlipInstance) {
        console.log("Found existing CoinFlip instance, destroying it...");
        window.coinFlipInstance.destroy();
        window.coinFlipInstance = null;
    }

    // Also check for orphaned popups in the DOM
    const orphanedPopups = document.querySelectorAll('#coinflip-popup, .coinflip-popup');
    orphanedPopups.forEach(popup => {
        console.log("Removing orphaned popup from DOM");
        popup.remove();
    });

    // Create new instance
    coinFlipInstance = new CoinFlip(this);
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