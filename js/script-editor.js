export class ScriptEditor {
    constructor() {
        this.currentScript = null;
        this.editor = null;
        this.isModified = false;
        this.monoBehaviorInstance = null;
        this.isPlaying = false;
    }
    
    open(scriptData) {
        this.currentScript = scriptData;
        this.isModified = false;
        
        // Create or update the editor page
        this.createEditorPage();
        
        // Switch to the editor page
        if (window.navigation) {
            window.navigation.addDynamicPage('script-editor', this.pageElement, this.navElement);
            window.navigation.switchPage('script-editor');
        }
    }
    
    createEditorPage() {
        // Remove existing page if any
        const existingPage = document.getElementById('script-editor-page');
        if (existingPage) {
            existingPage.remove();
        }
        
        // Create the page element
        this.pageElement = document.createElement('div');
        this.pageElement.className = 'page';
        this.pageElement.id = 'script-editor-page';
        
        this.pageElement.innerHTML = `
            <div class="script-editor-container">
                <div class="script-editor-header">
                    <div class="editor-title">
                        <span class="editor-icon">📜</span>
                        <h2>Editing: ${this.currentScript.name}</h2>
                        <span class="modified-indicator" id="modifiedIndicator" style="display: none;">●</span>
                    </div>
                    <div class="editor-controls">
                        <div class="playback-controls">
                            <button class="control-btn play-btn" id="playBtn" title="Start">
                                ▶️
                            </button>
                            <button class="control-btn pause-btn" id="pauseBtn" title="Pause" disabled>
                                ⏸️
                            </button>
                            <button class="control-btn stop-btn" id="stopBtn" title="Stop" disabled>
                                ⏹️
                            </button>
                        </div>
                        <button class="save-btn" id="saveBtn">
                            💾 Save
                        </button>
                    </div>
                </div>
                <div class="script-editor-content">
                    <textarea class="code-editor" id="codeEditor">${this.escapeHtml(this.currentScript.content)}</textarea>
                </div>
                <div class="script-editor-footer">
                    <div class="footer-info">
                        <span>Author: ${this.currentScript.author}</span>
                        <span>Created: ${new Date(this.currentScript.created).toLocaleString()}</span>
                    </div>
                    <div class="console-output" id="consoleOutput" style="display: none;">
                        <div class="console-header">Console Output</div>
                        <div class="console-content" id="consoleContent"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to page container
        const pageContainer = document.querySelector('.page-container');
        pageContainer.appendChild(this.pageElement);
        
        // Create nav element
        this.navElement = document.createElement('button');
        this.navElement.className = 'nav-item closeable';
        this.navElement.setAttribute('data-page', 'script-editor');
        this.navElement.innerHTML = `
            <span class="nav-icon">📜</span>
            ${this.currentScript.name}
            <span class="close-tab-btn" id="closeScriptEditor">×</span>
        `;
        
        // Setup event listeners
        setTimeout(() => this.setupEventListeners(), 0);
    }
    
    setupEventListeners() {
        // Code editor
        const codeEditor = document.getElementById('codeEditor');
        if (codeEditor) {
            codeEditor.addEventListener('input', () => {
                this.isModified = true;
                document.getElementById('modifiedIndicator').style.display = 'inline';
            });
            
            // Tab key support
            codeEditor.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = codeEditor.selectionStart;
                    const end = codeEditor.selectionEnd;
                    const value = codeEditor.value;
                    codeEditor.value = value.substring(0, start) + '    ' + value.substring(end);
                    codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
                }
            });
        }
        
        // Save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.save());
        }
        
        // Playback controls
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => this.play());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }
        
        // Close button
        const closeBtn = document.getElementById('closeScriptEditor');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.save();
                }
            }
        });
    }
    
    save() {
        const codeEditor = document.getElementById('codeEditor');
        if (!codeEditor) return;
        
        const newContent = codeEditor.value;
        
        // Send save event back to inventory
        const event = new CustomEvent('save-script', {
            detail: {
                name: this.currentScript.name,
                content: newContent
            }
        });
        window.dispatchEvent(event);
        
        // Update local content
        this.currentScript.content = newContent;
        this.isModified = false;
        document.getElementById('modifiedIndicator').style.display = 'none';
        
        // Show save notification
        this.showNotification('Script saved successfully');
    }
    
    play() {
        try {
            const codeEditor = document.getElementById('codeEditor');
            const code = codeEditor.value;
            
            // Create a new function from the script content
            const scriptFunction = new Function('BS', 'SM', 'console', code);
            
            // Create a mock MonoBehavior context
            this.monoBehaviorInstance = {
                onStart: null,
                onUpdate: null,
                onDestroy: null,
                onPause: null,
                onResume: null,
                gameObject: { name: 'ScriptEditor_TestObject' }
            };
            
            // Create a console wrapper
            const consoleWrapper = {
                log: (...args) => this.log('log', ...args),
                error: (...args) => this.log('error', ...args),
                warn: (...args) => this.log('warn', ...args),
                info: (...args) => this.log('info', ...args)
            };
            
            // Show console
            document.getElementById('consoleOutput').style.display = 'block';
            this.clearConsole();
            
            // Execute the script to define the callbacks
            scriptFunction.call(this.monoBehaviorInstance, window.BS || {}, window.SM || {}, consoleWrapper);
            
            // Call onStart if defined
            if (typeof this.monoBehaviorInstance.onStart === 'function') {
                this.log('info', 'Calling onStart()...');
                this.monoBehaviorInstance.onStart();
            }
            
            this.isPlaying = true;
            this.updatePlaybackButtons();
            
        } catch (error) {
            this.log('error', `Script error: ${error.message}`);
        }
    }
    
    pause() {
        if (!this.isPlaying || !this.monoBehaviorInstance) return;
        
        if (typeof this.monoBehaviorInstance.onPause === 'function') {
            this.log('info', 'Calling onPause()...');
            this.monoBehaviorInstance.onPause();
        }
        
        this.updatePlaybackButtons(true);
    }
    
    stop() {
        if (!this.monoBehaviorInstance) return;
        
        if (typeof this.monoBehaviorInstance.onDestroy === 'function') {
            this.log('info', 'Calling onDestroy()...');
            this.monoBehaviorInstance.onDestroy();
        }
        
        this.monoBehaviorInstance = null;
        this.isPlaying = false;
        this.updatePlaybackButtons();
    }
    
    updatePlaybackButtons(isPaused = false) {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (this.isPlaying) {
            playBtn.disabled = isPaused ? false : true;
            pauseBtn.disabled = isPaused ? true : false;
            stopBtn.disabled = false;
            
            if (!isPaused && playBtn.disabled) {
                playBtn.innerHTML = '▶️';
                playBtn.title = 'Resume';
            }
        } else {
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            playBtn.innerHTML = '▶️';
            playBtn.title = 'Start';
        }
    }
    
    log(type, ...args) {
        const consoleContent = document.getElementById('consoleContent');
        if (!consoleContent) return;
        
        const entry = document.createElement('div');
        entry.className = `console-entry console-${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        entry.innerHTML = `
            <span class="console-timestamp">[${timestamp}]</span>
            <span class="console-message">${args.join(' ')}</span>
        `;
        
        consoleContent.appendChild(entry);
        consoleContent.scrollTop = consoleContent.scrollHeight;
    }
    
    clearConsole() {
        const consoleContent = document.getElementById('consoleContent');
        if (consoleContent) {
            consoleContent.innerHTML = '';
        }
    }
    
    close() {
        if (this.isModified) {
            const confirmClose = confirm('You have unsaved changes. Are you sure you want to close?');
            if (!confirmClose) return;
        }
        
        // Stop any running script
        if (this.isPlaying) {
            this.stop();
        }
        
        // Remove the page
        if (window.navigation) {
            window.navigation.removeDynamicPage('script-editor');
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'editor-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}