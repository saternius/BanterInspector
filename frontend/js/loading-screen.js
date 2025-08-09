/**
 * Loading Screen Module
 * Provides visual feedback during Unity Scene Inspector initialization
 */

export class LoadingScreen {
    constructor() {
        this.stages = [
            { id: 'banterScene', label: 'Initializing BS Library...', weight: 25 },
            { id: 'modules', label: 'Loading modules...', weight: 30 },
            { id: 'scene-connect', label: 'Connecting to Unity scene...', weight: 20 },
            { id: 'hierarchy', label: 'Gathering scene hierarchy...', weight: 5 },
            { id: 'slots', label: 'Generating slots...', weight: 20 },
        ];
        
        this.currentStageIndex = -1;
        this.subProgress = 0;
        this.element = null;
        this.progressFillElement = null;
        this.percentageElement = null;
        this.statusElement = null;
        this.substatusElement = null;
        this.errorState = false;
        this.startTime = Date.now();
        this.stageStartTime = Date.now();
    }
    
    /**
     * Create and display the loading screen
     */
    show() {
        // Create loading screen element
        this.element = document.createElement('div');
        this.element.id = 'loadingScreen';
        this.element.className = 'loading-screen';
        
        this.element.innerHTML = `
            <div class="loading-container">
                <div class="loading-logo">
                    <div class="loading-spinner"></div>
                </div>
                <h2 class="loading-title">Banter Scene Inspector</h2>
                <div class="loading-progress-container">
                    <div class="loading-progress-bar">
                        <div class="loading-progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="loading-percentage">0%</div>
                </div>
                <div class="loading-status">Initializing...</div>
                <div class="loading-substatus"></div>
                <div class="loading-error-container" style="display: none;">
                    <div class="loading-error-message"></div>
                    <div class="loading-error-actions">
                        <button class="loading-retry-btn">Retry</button>
                    </div>
                </div>
            </div>
        `;
        
        // Cache element references
        this.progressFillElement = this.element.querySelector('.loading-progress-fill');
        this.percentageElement = this.element.querySelector('.loading-percentage');
        this.statusElement = this.element.querySelector('.loading-status');
        this.substatusElement = this.element.querySelector('.loading-substatus');
        this.errorContainer = this.element.querySelector('.loading-error-container');
        this.errorMessage = this.element.querySelector('.loading-error-message');
        
        // Add to DOM
        document.body.appendChild(this.element);
        
        // Force reflow for animation
        this.element.offsetHeight;
        this.element.classList.add('visible');
        
        // Setup error button handlers
        const retryBtn = this.element.querySelector('.loading-retry-btn');
        
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.clearError();
                window.location.reload();
            });
        }
    }
    
    /**
     * Hide and remove the loading screen
     */
    hide() {
        if (!this.element) return;
        
        const totalTime = Date.now() - this.startTime;
        console.log(`Total load time: ${(totalTime / 1000).toFixed(2)}s`);
        
        // Animate out
        this.element.classList.add('hiding');
        
        // Remove after animation
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
                this.element = null;
            }
        }, 500);
    }
    
    /**
     * Update the current loading stage
     * @param {string} stageId - The stage identifier
     * @param {number} subProgress - Progress within the stage (0-100)
     * @param {string} subText - Additional detail text
     */
    updateStage(stageId, subProgress = 0, subText = '') {
        const stageIndex = this.stages.findIndex(s => s.id === stageId);
        if (stageIndex === -1) {
            console.warn(`Unknown loading stage: ${stageId}`);
            return;
        }
        
        // Log stage timing
        if (stageIndex !== this.currentStageIndex) {
            if (this.currentStageIndex >= 0) {
                const stageDuration = Date.now() - this.stageStartTime;
                console.log(`Stage '${this.stages[this.currentStageIndex].id}' completed in ${(stageDuration / 1000).toFixed(2)}s`);
            }
            this.stageStartTime = Date.now();
            this.currentStageIndex = stageIndex;
        }
        
        this.subProgress = Math.max(0, Math.min(100, subProgress));
        
        // Update UI
        const stage = this.stages[stageIndex];
        if (this.statusElement) {
            this.statusElement.textContent = stage.label;
        }
        
        if (this.substatusElement) {
            this.substatusElement.textContent = subText || '';
        }
        
        // Calculate and update progress
        const progress = this.calculateProgress();
        this.updateProgressBar(progress);
    }
    
    /**
     * Calculate weighted progress percentage
     */
    calculateProgress() {
        if (this.currentStageIndex < 0) return 0;
        
        const totalWeight = this.stages.reduce((sum, stage) => sum + stage.weight, 0);
        let completedWeight = 0;
        
        // Add weight of all completed stages
        for (let i = 0; i < this.currentStageIndex; i++) {
            completedWeight += this.stages[i].weight;
        }
        
        // Add partial weight of current stage
        const currentStage = this.stages[this.currentStageIndex];
        completedWeight += (currentStage.weight * this.subProgress / 100);
        
        return (completedWeight / totalWeight) * 100;
    }
    
    /**
     * Update the progress bar UI
     */
    updateProgressBar(progress) {
        const roundedProgress = Math.round(progress);
        
        if (this.progressFillElement) {
            this.progressFillElement.style.width = `${progress}%`;
        }
        
        if (this.percentageElement) {
            this.percentageElement.textContent = `${roundedProgress}%`;
        }
    }
    
    /**
     * Show error state
     * @param {string} message - Error message to display
     */
    setError(message) {
        this.errorState = true;
        
        if (this.errorContainer) {
            this.errorContainer.style.display = 'block';
        }
        
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
        
        if (this.statusElement) {
            this.statusElement.textContent = 'Initialization Error';
            this.statusElement.classList.add('error');
        }
        
        // Hide progress elements during error
        if (this.progressFillElement) {
            this.progressFillElement.style.background = 'linear-gradient(90deg, #ff4444, #cc0000)';
        }
    }
    
    /**
     * Clear error state
     */
    clearError() {
        this.errorState = false;
        
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
        }
        
        if (this.statusElement) {
            this.statusElement.classList.remove('error');
        }
        
        if (this.progressFillElement) {
            this.progressFillElement.style.background = '';
        }
    }
    
    /**
     * Helper to create module loading progress tracker
     */
    createModuleTracker(totalModules) {
        let loadedModules = 0;
        
        return () => {
            loadedModules++;
            const progress = (loadedModules / totalModules) * 100;
            this.updateStage('modules', progress, `Loading module ${loadedModules} of ${totalModules}`);
            return loadedModules === totalModules;
        };
    }
    
    /**
     * Helper to create timeout promise for BS library
     */
    createBSLibraryTimeout(timeoutMs = 10000) {
        return new Promise((resolve, reject) => {
            let checkInterval;
            let elapsed = 0;
            const checkFrequency = 100;
            
            checkInterval = setInterval(() => {
                elapsed += checkFrequency;
                
                // Update progress based on time elapsed
                const progress = Math.min(90, (elapsed / timeoutMs) * 100);
                this.updateStage('bs-wait', progress, `Waiting... ${(elapsed / 1000).toFixed(1)}s`);
                
                // Check if BS library is available
                if (typeof window.BS !== 'undefined' && window.BS.BanterScene) {
                    clearInterval(checkInterval);
                    this.updateStage('bs-wait', 100, 'BanterScript library loaded');
                    resolve();
                } else if (elapsed >= timeoutMs) {
                    clearInterval(checkInterval);
                    reject(new Error('BanterScript library failed to load after ' + (timeoutMs / 1000) + ' seconds'));
                }
            }, checkFrequency);
        });
    }
}

// Export singleton instance
export const loadingScreen = new LoadingScreen();