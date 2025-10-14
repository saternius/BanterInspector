// Blend2End Extension
// Generates 3D object specifications from natural language

class Blend2End {
    constructor() {
        this.recording = false;
        this.speechRecognizer = null;
        this.micInited = false;
        this.speechBuffer = '';
        this.rlen = 0;
        this.timeoutId = null;
        this.key = null;

        // Current form state
        this.currentForm = {
            description: '',
            functionality: [],
            style: ''
        };
    }

    async init() {
        await this.get_key();
        const pageElement = this.generateBlend2EndPage();
        this.setupUI();
        return pageElement;
    }

    async get_key() {
        try {
            let key = await fetch(`${window.ngrokUrl}/../something-for-the-time`);
            key = await key.text();
            this.key = key;
        } catch (error) {
            err("blend2end", "Failed to get speech key:", error);
        }
    }

    generateBlend2EndPage() {
        log("blend2end", "generateBlend2EndPage");

        // Check if page already exists
        const existingPage = document.getElementById('blend2end-page');
        if (existingPage) {
            log("blend2end", "Page already exists, skipping creation");
            return existingPage;
        }

        // Create the page element with proper class
        const pageElement = document.createElement('div');
        pageElement.id = 'blend2end-page';
        pageElement.className = 'page';
        pageElement.innerHTML = `
            <div class="blend2end-container" style="padding: 20px; max-width: 1200px; margin: 0 auto; height: 100%; overflow-y: auto;">
                <h1 style="color: #fff; margin-bottom: 10px;">🤖 Blend2End</h1>
                <p style="color: #aaa; margin-bottom: 30px;">Describe your 3D object and we'll create specifications for generation</p>

                <!-- Input Section -->
                <div class="input-section" style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h3 style="color: #fff; margin-bottom: 15px;">Describe Your Object</h3>

                    <div style="position: relative; margin-bottom: 10px;">
                        <textarea
                            id="blend2endInput"
                            placeholder="Example: I want a wooden desk with two drawers that slide open, modern minimalist style..."
                            style="width: 100%; min-height: 150px; padding: 15px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; font-size: 14px; font-family: inherit; resize: vertical;"
                        ></textarea>

                        <button
                            id="blend2endMicBtn"
                            title="Click to record description"
                            style="position: absolute; right: 10px; top: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 8px 12px; color: #fff; cursor: pointer; font-size: 18px;"
                        >
                            <span class="mic-status">🎤</span>
                        </button>
                    </div>

                    <div id="speechStatus" class="speech-status" style="display: none; padding: 8px; margin-bottom: 10px; border-radius: 4px; font-size: 14px;"></div>

                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button
                            id="clearInputBtn"
                            style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 10px 20px; color: #fff; cursor: pointer; font-size: 14px;"
                        >
                            Clear
                        </button>
                        <button
                            id="processBtn"
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 4px; padding: 10px 30px; color: #fff; cursor: pointer; font-size: 14px; font-weight: 600;"
                        >
                            Process Description
                        </button>
                    </div>
                </div>

                <!-- Output Section -->
                <div id="outputSection" style="display: none;">
                    <div class="output-container" style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="color: #fff; margin-bottom: 20px;">Generated Specifications</h3>

                        <!-- Description -->
                        <div class="spec-field" style="margin-bottom: 20px;">
                            <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Description</label>
                            <div
                                id="specDescription"
                                contenteditable="true"
                                style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 12px; color: #fff; font-size: 14px; min-height: 40px;"
                            ></div>
                        </div>

                        <!-- Functionality -->
                        <div class="spec-field" style="margin-bottom: 20px;">
                            <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Functionality</label>
                            <div id="functionalityList" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 12px;">
                                <!-- Functionality items will be added here -->
                            </div>
                            <button
                                id="addFunctionalityBtn"
                                style="margin-top: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px 12px; color: #fff; cursor: pointer; font-size: 12px;"
                            >
                                + Add Functionality
                            </button>
                        </div>

                        <!-- Style -->
                        <div class="spec-field" style="margin-bottom: 20px;">
                            <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Style</label>
                            <div
                                id="specStyle"
                                contenteditable="true"
                                style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 12px; color: #fff; font-size: 14px; min-height: 40px;"
                            ></div>
                        </div>

                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button
                                id="refineBtn"
                                style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 10px 20px; color: #fff; cursor: pointer; font-size: 14px;"
                            >
                                Refine with Voice
                            </button>
                            <button
                                id="generateBtn"
                                style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border: none; border-radius: 4px; padding: 10px 30px; color: #fff; cursor: pointer; font-size: 14px; font-weight: 600;"
                            >
                                Generate Object
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Status Message -->
                <div id="blend2endStatus" class="blend2end-status" style="display: none; padding: 15px; border-radius: 4px; font-size: 14px; margin-top: 20px;"></div>
            </div>
        `;

        // Add to page container
        const pageContainer = document.querySelector('.page-container');
        if (pageContainer) {
            pageContainer.appendChild(pageElement);
            log("blend2end", "Page element added to page-container");
        } else {
            err("blend2end", "Could not find .page-container");
        }

        // Add styles
        this.injectStyles();

        return pageElement;
    }

    injectStyles() {
        if (document.getElementById('blend2end-styles')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'blend2end-styles';
        styleEl.textContent = `
            .speech-status.recording {
                background: rgba(255, 0, 0, 0.2);
                border: 1px solid rgba(255, 0, 0, 0.5);
                color: #ff6b6b;
            }
            .speech-status.error {
                background: rgba(255, 0, 0, 0.2);
                border: 1px solid rgba(255, 0, 0, 0.5);
                color: #ff6b6b;
            }
            .speech-status.info {
                background: rgba(66, 153, 225, 0.2);
                border: 1px solid rgba(66, 153, 225, 0.5);
                color: #4299e1;
            }
            .blend2end-status.success {
                background: rgba(72, 187, 120, 0.2);
                border: 1px solid rgba(72, 187, 120, 0.5);
                color: #48bb78;
            }
            .blend2end-status.error {
                background: rgba(255, 0, 0, 0.2);
                border: 1px solid rgba(255, 0, 0, 0.5);
                color: #ff6b6b;
            }
            .blend2end-status.info {
                background: rgba(66, 153, 225, 0.2);
                border: 1px solid rgba(66, 153, 225, 0.5);
                color: #4299e1;
            }
            #blend2endMicBtn.recording {
                background: rgba(255, 0, 0, 0.3);
                border-color: rgba(255, 0, 0, 0.5);
            }
            .functionality-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
                padding: 8px;
                background: rgba(255,255,255,0.05);
                border-radius: 4px;
            }
            .functionality-item input {
                flex: 1;
                background: transparent;
                border: none;
                color: #fff;
                font-size: 14px;
                outline: none;
            }
            .functionality-item button {
                background: rgba(255, 0, 0, 0.3);
                border: 1px solid rgba(255, 0, 0, 0.5);
                border-radius: 4px;
                padding: 4px 8px;
                color: #ff6b6b;
                cursor: pointer;
                font-size: 12px;
            }
            .processing-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                z-index: 1000;
            }
            .processing-content {
                text-align: center;
                color: #fff;
            }
            .processing-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255,255,255,0.3);
                border-top-color: #fff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleEl);
    }

    setupUI() {
        // Process button
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.addEventListener('mousedown', () => this.processDescription());
        }

        // Clear button
        const clearBtn = document.getElementById('clearInputBtn');
        if (clearBtn) {
            clearBtn.addEventListener('mousedown', () => this.clearInput());
        }

        // Mic button
        const micBtn = document.getElementById('blend2endMicBtn');
        if (micBtn) {
            micBtn.addEventListener('mousedown', () => {
                if (!this.micInited) {
                    this.initializeMic();
                } else {
                    this.toggleRecording();
                }
            });
        }

        // Add functionality button
        const addFuncBtn = document.getElementById('addFunctionalityBtn');
        if (addFuncBtn) {
            addFuncBtn.addEventListener('mousedown', () => this.addFunctionalityItem());
        }

        // Refine button
        const refineBtn = document.getElementById('refineBtn');
        if (refineBtn) {
            refineBtn.addEventListener('mousedown', () => this.startRefining());
        }

        // Generate button
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('mousedown', () => this.generateObject());
        }

        // Listen for page switches to ensure proper visibility
        window.addEventListener('page-switched', (e) => {
            const page = document.getElementById('blend2end-page');
            if (!page) return;

            if (e.detail.pageId === 'blend2end') {
                log("blend2end", "Page switched to blend2end");
                page.classList.add('active');
            } else {
                // Hide our page when switching to other pages
                page.classList.remove('active');
            }
        });
    }

    initializeMic() {
        if (this.micInited) return;

        try {
            log("blend2end", "[mic] initializing..");

            if (!this.key) {
                this.showSpeechStatus('Speech recognition not configured', 'error');
                return;
            }

            const speechConfig = window.SpeechSDK.SpeechConfig.fromSubscription(this.key, 'eastus');
            speechConfig.speechRecognitionLanguage = 'en-US';

            const audioConfig = window.SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
            this.speechRecognizer = new window.SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

            this.speechRecognizer.recognizing = (s, e) => {
                const recognizingText = e.result.text;
                const newText = recognizingText.slice(this.rlen);
                log("blend2end", "[mic] recognizing..", newText);
                this.speechBuffer += newText;
                this.updateTextarea();
                this.rlen = recognizingText.length;

                clearTimeout(this.timeoutId);
                this.timeoutId = setTimeout(() => {
                    this.completeRecognition();
                }, 2000);
            };

            this.speechRecognizer.recognized = (s, e) => {
                if (e.result.reason === window.SpeechSDK.ResultReason.RecognizedSpeech) {
                    log("blend2end", "[mic] recognized:", e.result.text);
                    this.completeRecognition();
                    this.rlen = 0;
                }
            };

            this.speechRecognizer.canceled = (s, e) => {
                err("blend2end", 'Speech recognition canceled:', e.reason);
                if (e.reason === window.SpeechSDK.CancellationReason.Error) {
                    this.showSpeechStatus('Speech recognition error: ' + e.errorDetails, 'error');
                }
                this.stopRecording();
            };

            this.speechRecognizer.sessionStopped = (s, e) => {
                log("blend2end", "[mic] session stopped");
                this.stopRecording();
            };

            this.micInited = true;
            this.toggleRecording();

        } catch (error) {
            err("blend2end", 'Failed to initialize speech recognition:', error);
            this.showSpeechStatus('Failed to initialize microphone', 'error');
        }
    }

    toggleRecording() {
        if (!this.recording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    startRecording() {
        const micBtn = document.getElementById('blend2endMicBtn');
        const textarea = document.getElementById('blend2endInput');
        const micStatus = micBtn.querySelector('.mic-status');

        this.speechBuffer = textarea.value ? textarea.value + ' ' : '';
        this.rlen = 0;

        micStatus.textContent = '⏳';

        this.speechRecognizer.startContinuousRecognitionAsync(
            () => {
                micStatus.textContent = '🔴';
                this.recording = true;
                micBtn.classList.add('recording');
                this.showSpeechStatus('Listening...', 'recording');
            },
            (error) => {
                err("blend2end", 'Failed to start recording:', error);
                this.showSpeechStatus('Failed to start recording', 'error');
                micStatus.textContent = '🎤';
            }
        );
    }

    stopRecording() {
        if (!this.recording) return;

        const micBtn = document.getElementById('blend2endMicBtn');
        const micStatus = micBtn.querySelector('.mic-status');

        this.speechRecognizer.stopContinuousRecognitionAsync(
            () => {
                this.recording = false;
                micBtn.classList.remove('recording');
                micStatus.textContent = '🎤';
                this.hideSpeechStatus();
                clearTimeout(this.timeoutId);
                log("blend2end", "[mic] stopped recording");
            },
            (error) => {
                err("blend2end", 'Failed to stop recording:', error);
            }
        );
    }

    completeRecognition() {
        this.updateTextarea();
        this.speechBuffer = document.getElementById('blend2endInput').value + "\n";
        this.rlen = 0;
    }

    updateTextarea() {
        const textarea = document.getElementById('blend2endInput');
        textarea.value = this.speechBuffer;
        textarea.dispatchEvent(new Event('input'));
    }

    showSpeechStatus(message, type) {
        const statusEl = document.getElementById('speechStatus');
        statusEl.textContent = message;
        statusEl.className = `speech-status ${type}`;
        statusEl.style.display = 'block';
    }

    hideSpeechStatus() {
        const statusEl = document.getElementById('speechStatus');
        statusEl.style.display = 'none';
    }

    clearInput() {
        document.getElementById('blend2endInput').value = '';
        this.speechBuffer = '';
        this.hideSpeechStatus();
    }

    async processDescription() {
        const text = document.getElementById('blend2endInput').value.trim();

        if (!text) {
            this.showStatus('Please enter or record a description', 'error');
            return;
        }

        this.showProcessingUI();

        try {
            const response = await fetch(`${window.blend2endServiceUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    existing_form: this.currentForm,
                    intent: ''
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();

            this.currentForm = {
                description: result.description || '',
                functionality: result.functionality || [],
                style: result.style || ''
            };

            this.displayOutput();
            this.hideProcessingUI();
            this.showStatus('Description processed successfully!', 'success');

        } catch (error) {
            err("blend2end", "Failed to process description:", error);
            this.hideProcessingUI();
            this.showStatus('Failed to process description. Please try again.', 'error');
        }
    }

    displayOutput() {
        const outputSection = document.getElementById('outputSection');
        outputSection.style.display = 'block';

        // Display description
        const descEl = document.getElementById('specDescription');
        descEl.textContent = this.currentForm.description;

        // Display functionality
        const funcList = document.getElementById('functionalityList');
        funcList.innerHTML = '';
        this.currentForm.functionality.forEach((item, index) => {
            this.addFunctionalityItem(item, index);
        });

        // Display style
        const styleEl = document.getElementById('specStyle');
        styleEl.textContent = this.currentForm.style;

        // Scroll to output
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    addFunctionalityItem(text = '', index = null) {
        const funcList = document.getElementById('functionalityList');

        if (index === null) {
            index = this.currentForm.functionality.length;
            this.currentForm.functionality.push(text);
        }

        const itemHTML = `
            <div class="functionality-item" data-index="${index}">
                <input type="text" value="${text}" placeholder="Enter functionality requirement..." />
                <button onclick="blend2endInstance.removeFunctionalityItem(${index})">Remove</button>
            </div>
        `;

        funcList.insertAdjacentHTML('beforeend', itemHTML);

        // Add input listener
        const input = funcList.querySelector(`.functionality-item[data-index="${index}"] input`);
        input.addEventListener('input', (e) => {
            this.currentForm.functionality[index] = e.target.value;
        });
    }

    removeFunctionalityItem(index) {
        this.currentForm.functionality.splice(index, 1);
        this.displayOutput();
    }

    startRefining() {
        const textarea = document.getElementById('blend2endInput');
        textarea.value = '';
        textarea.focus();

        this.showStatus('Describe your refinements and click Process', 'info');

        if (this.micInited && !this.recording) {
            this.startRecording();
        } else if (!this.micInited) {
            this.initializeMic();
        }
    }

    async generateObject() {
        // Update form from editable fields
        this.currentForm.description = document.getElementById('specDescription').textContent.trim();
        this.currentForm.style = document.getElementById('specStyle').textContent.trim();

        if (!this.currentForm.description) {
            this.showStatus('Please provide a description', 'error');
            return;
        }

        this.showStatus('Object generation coming soon! Specifications ready.', 'success');
        log("blend2end", "Ready to generate:", this.currentForm);

        // TODO: Integrate with actual 3D generation service
    }

    showProcessingUI() {
        const inputSection = document.querySelector('.input-section');
        if (inputSection) {
            const overlay = document.createElement('div');
            overlay.id = 'blend2endProcessingOverlay';
            overlay.className = 'processing-overlay';
            overlay.innerHTML = `
                <div class="processing-content">
                    <div class="processing-spinner"></div>
                    <p>Processing your description...</p>
                </div>
            `;
            inputSection.style.position = 'relative';
            inputSection.appendChild(overlay);
        }
    }

    hideProcessingUI() {
        const overlay = document.getElementById('blend2endProcessingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('blend2endStatus');
        statusEl.innerHTML = message;
        statusEl.className = `blend2end-status ${type}`;
        statusEl.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize when script loads
let blend2endInstance = null;
let navButton = null;
let pageElement = null;

let generateToolBtn = (pageEl) => {
    log("blend2end", "generateToolBtn");

    // Create nav button with proper structure
    navButton = document.createElement("button");
    navButton.classList.add("nav-item");
    navButton.setAttribute("data-page", "blend2end");
    navButton.innerHTML = `
        <span class="nav-icon">🤖</span>
        Blend2End
    `;

    // Add nav button to navigation
    const navItems = document.querySelector(".nav-items");
    if (navItems) {
        navItems.appendChild(navButton);
        log("blend2end", "Nav button added to navigation");
    } else {
        err("blend2end", "Could not find .nav-items");
        return;
    }

    // Set up click handler to switch pages
    navButton.addEventListener("mousedown", () => {
        log("blend2end", "Nav button clicked");

        // Try to use navigation system if available
        if (window.navigation && typeof window.navigation.switchPage === 'function') {
            log("blend2end", "Using navigation.switchPage()");
            window.navigation.switchPage('blend2end');
        } else {
            // Fallback: manually switch pages
            log("blend2end", "Using fallback page switching");

            // Remove active from all pages and nav items
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            // Activate our page and nav button
            const blend2endPage = document.getElementById('blend2end-page');
            if (blend2endPage) {
                blend2endPage.classList.add('active');
            }
            navButton.classList.add('active');

            // Dispatch event
            window.dispatchEvent(new CustomEvent('page-switched', {
                detail: { pageId: 'blend2end' }
            }));
        }
    });

    // Try to register with navigation system if available
    if (window.navigation && pageEl && typeof window.navigation.addDynamicPage === 'function') {
        try {
            log("blend2end", "Registering with navigation system");
            window.navigation.addDynamicPage('blend2end', pageEl, navButton);
        } catch (error) {
            err("blend2end", "Failed to register with navigation:", error);
        }
    }
};

let bounds = null;
this.onStart = async () => {
    log("blend2end", "onStart - initializing Blend2End extension");
    blend2endInstance = new Blend2End();

    // Wait for page to be created
    pageElement = await blend2endInstance.init();

    // Generate navigation button
    generateToolBtn(pageElement);

    // Make instance globally accessible for button callbacks
    window.blend2endInstance = blend2endInstance;
    bounds = await LoadItem('Blend2EndBounds', `People/${SM.myName()}`, {name: 'Blend2EndBounds_'+SM.myName()});
};

this.onDestroy = () => {
    log("blend2end", "onDestroy - cleaning up");

    // Use navigation system to remove if available
    if (window.navigation && typeof window.navigation.removeDynamicPage === 'function') {
        try {
            window.navigation.removeDynamicPage('blend2end');
            log("blend2end", "Removed via navigation system");
        } catch (error) {
            err("blend2end", "Error removing from navigation:", error);
        }
    }

    // Always do manual cleanup as well (in case navigation system doesn't fully clean up)
    if (navButton && navButton.parentNode) {
        navButton.remove();
    }

    const page = document.getElementById('blend2end-page');
    if (page && page.parentNode) {
        page.remove();
    }

    // Remove styles
    const styles = document.getElementById('blend2end-styles');
    if (styles && styles.parentNode) {
        styles.remove();
    }

    if (window.blend2endInstance) {
        delete window.blend2endInstance;
    }

    blend2endInstance = null;
    navButton = null;
    pageElement = null;
    RemoveEntity(bounds.id);
    bounds = null;
};
