export class ScriptEditor {
    constructor(scriptData) {
        this.currentScript = scriptData;
        this.editor = null;
        this.isModified = false;
        this.monoBehaviorSlots = new Map(); // Map of slotId -> MonoBehavior component
        this.selectedSlots = new Set();
        this.codemirror = null;
        this.pageId = `script-editor-${scriptData.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        this.pageElement = null;
        this.navElement = null;
        this.keydownHandler = null;
    }
    
    open() {
        this.isModified = false;
        // Switch to the editor page
        this.createEditorPage();
        
        this.renderFooter();

        navigation.addDynamicPage(this.pageId, this.pageElement, this.navElement);
        navigation.switchPage(this.pageId);
        
        this.pageSwitchHandler = (e) => {
            console.log("page-switched", e.detail.pageId);
            if(e.detail.pageId === this.pageId){
                this.renderFooter();
                if (this.codemirror) {
                    setTimeout(() => this.codemirror.refresh(), 100);
                }
            }
        };
        window.addEventListener('page-switched', this.pageSwitchHandler);
    }

    renderFooter(){
        this.findMonoBehaviorSlots();
        console.log("Rendering footer...");
        const footer = document.querySelector('.script-editor-footer');
        if(footer){
            footer.innerHTML = `
                <div class="footer-info">
                    <span>Author: ${this.currentScript.author}</span>
                    <span>Created: ${new Date(this.currentScript.created).toLocaleString()}</span>
                </div>
                ${this.monoBehaviorSlots.size > 0 ? `
                <div class="monobehavior-controls">
                    <div class="slot-selector-panel">
                        <div class="slot-selector-title">MonoBehavior Instances:</div>
                        <div class="slot-selector-buttons" id="slotSelectorButtons">
                            ${Array.from(this.monoBehaviorSlots.entries()).map(([slotId, component]) => {
                                const slot = SM.getSlotById(slotId);
                                const slotName = slot?.name || 'Unknown Slot';
                                const isSelected = this.selectedSlots.has(slotId);
                                return `<button class="slot-selector-btn ${isSelected ? 'selected' : ''}" data-slot-id="${slotId}">${slotName}</button>`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="playback-controls">
                        <button class="control-btn play-btn" id="playBtn" title="Start" ${!this.canRun() ? 'disabled' : ''}>
                            ▶️
                        </button>
                        
                        <button class="control-btn stop-btn" id="stopBtn" title="Stop" disabled>
                            ⏹️
                        </button>
                    </div>
                </div>
                ` : ''}
                <div class="console-output" id="consoleOutput" style="display: ${this.monoBehaviorSlots.size > 0 ? 'block' : 'none'};">
                    <div class="console-header">Console Output</div>
                    <div class="console-content" id="consoleContent"></div>
                </div>
            `;
        }
        this.updatePlaybackButtons();
    }
    
    async createEditorPage() {
        // Create the page element
        this.pageElement = document.createElement('div');
        this.pageElement.className = 'page';
        this.pageElement.id = `${this.pageId}-page`;
        
        this.pageElement.innerHTML = `
            <div class="script-editor-container">
                <div class="script-editor-header">
                    <div class="editor-title">
                        <span class="editor-icon">📜</span>
                        <h2>Editing: ${this.currentScript.name}</h2>
                        <span class="modified-indicator" id="modifiedIndicator" style="display: none;">●</span>
                    </div>
                    <div class="editor-controls">
                        <button class="save-btn" id="saveBtn">
                            💾 Save
                        </button>
                    </div>
                </div>
                <div class="script-editor-content">
                    <div class="code-editor-wrapper" id="codeEditorWrapper">
                        <textarea class="code-editor" id="codeEditor">${this.escapeHtml(this.currentScript.content)}</textarea>
                    </div>
                </div>
                <div class="script-editor-footer">
                    
                </div>
            </div>
        `;
        
        // Add to page container
        const pageContainer = document.querySelector('.page-container');
        pageContainer.appendChild(this.pageElement);
        
        // Create nav element
        this.navElement = document.createElement('button');
        this.navElement.className = 'nav-item closeable';
        this.navElement.setAttribute('data-page', this.pageId);
        this.navElement.innerHTML = `
            <span class="nav-icon">📜</span>
            ${this.currentScript.name}
            <span class="close-tab-btn" data-close-script="${this.pageId}">×</span>
        `;
        
        // Setup event listeners and CodeMirror
        setTimeout(() => this.setupEventListeners(), 0);
        await this.initializeCodeMirror();
    }
    
    async initializeCodeMirror() {
        // Load CodeMirror from CDN
        const isProduction = window.location.hostname !== 'localhost';
        const cdnBase = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13';
        
        // Load CSS
        const cssLinks = [
            `${cdnBase}/codemirror.min.css`,
            `${cdnBase}/theme/monokai.min.css`,
            `${cdnBase}/addon/hint/show-hint.min.css`,
            `${cdnBase}/addon/dialog/dialog.min.css`
        ];
        
        cssLinks.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        });
        
        // Load scripts
        await this.loadScript(`${cdnBase}/codemirror.min.js`);
        await Promise.all([
            this.loadScript(`${cdnBase}/mode/javascript/javascript.min.js`),
            this.loadScript(`${cdnBase}/addon/edit/closebrackets.min.js`),
            this.loadScript(`${cdnBase}/addon/edit/matchbrackets.min.js`),
            this.loadScript(`${cdnBase}/addon/comment/comment.min.js`),
            this.loadScript(`${cdnBase}/addon/hint/show-hint.min.js`),
            this.loadScript(`${cdnBase}/addon/hint/javascript-hint.min.js`),
            this.loadScript(`${cdnBase}/addon/search/searchcursor.min.js`),
            this.loadScript(`${cdnBase}/addon/search/search.min.js`),
            this.loadScript(`${cdnBase}/addon/dialog/dialog.min.js`),
            this.loadScript(`${cdnBase}/addon/selection/active-line.min.js`)
        ]);
        
        // Initialize CodeMirror
        const textarea = document.getElementById('codeEditor');
        if (textarea && window.CodeMirror) {
            this.codemirror = CodeMirror.fromTextArea(textarea, {
                mode: 'javascript',
                theme: 'monokai',
                lineNumbers: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                indentUnit: 4,
                tabSize: 4,
                indentWithTabs: false,
                styleActiveLine: true,
                extraKeys: {
                    'Tab': (cm) => {
                        if (cm.somethingSelected()) {
                            cm.indentSelection('add');
                        } else {
                            cm.replaceSelection(cm.getOption('indentWithTabs')? '\t' : 
                                Array(cm.getOption('indentUnit') + 1).join(' '), 'end');
                        }
                    },
                    'Shift-Tab': (cm) => cm.indentSelection('subtract'),
                    'Ctrl-Space': 'autocomplete',
                    'Cmd-Space': 'autocomplete',
                    'Ctrl-/': 'toggleComment',
                    'Cmd-/': 'toggleComment',
                    'Ctrl-F': 'findPersistent',
                    'Cmd-F': 'findPersistent'
                }
            });
            
            // Track modifications
            this.codemirror.on('change', () => {
                this.isModified = true;
                document.getElementById('modifiedIndicator').style.display = 'inline';
            });
            
            // Set initial size
            setTimeout(() => {
                this.codemirror.refresh();
            }, 100);
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupEventListeners() {
        // CodeMirror is now initialized separately
        
        // Save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.save());
        }
        
        // Playback controls
        const playBtn = document.getElementById('playBtn');
        // const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => this.play());
        }
        
        // if (pauseBtn) {
        //     pauseBtn.addEventListener('click', () => this.pause());
        // }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }
        
        // Close button
        const closeBtn = this.pageElement.querySelector(`[data-close-script="${this.pageId}"]`);
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        // Keyboard shortcuts
        const handleKeyDown = (e) => {
            // Only handle if this script editor is active
            if (navigation.currentPage === this.pageId) {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.save();
                }
            }
        };
        this.keydownHandler = handleKeyDown;
        document.addEventListener('keydown', handleKeyDown);
        
        // Slot selector buttons
        const slotButtons = document.querySelectorAll('.slot-selector-btn');
        slotButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const slotId = btn.dataset.slotId;
                this.selectSlot(slotId);
            });
        });
    }
    
    save() {
        if (!this.codemirror) return;
        
        const newContent = this.codemirror.getValue();
        
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
        this.run('refresh')
    }
    
    findMonoBehaviorSlots() {
        this.monoBehaviorSlots.clear();
                
        // Iterate through all slots to find MonoBehavior components using this script
        SM.getAllSlots().forEach((slot) => {
            if (slot.components) {
                slot.components.forEach(component => {
                    if (component.type === 'MonoBehavior' && 
                        component.properties?.file === this.currentScript.name) {
                        this.monoBehaviorSlots.set(slot.id, component);
                        this.wrapConsoleForComponent(component, slot.name);
                    }
                });
            }
        });
        
        this.selectedSlots = new Set(this.monoBehaviorSlots.keys());
        return this.monoBehaviorSlots;
    }
    
    selectSlot(slotId) {
        if(this.selectedSlots.has(slotId)){
            this.selectedSlots.delete(slotId);
        }else{
            this.selectedSlots.add(slotId);
        }
        
        // Update UI
        document.querySelectorAll('.slot-selector-btn').forEach(btn => {
            btn.classList.toggle('selected', this.selectedSlots.has(btn.dataset.slotId));
        });
        
        // Enable/disable playback controls
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.disabled = !this.canRun();
        }
        
        // Clear console when switching slots
        //this.clearConsole();
    }
    
    canRun(){
        let stoppedSelected = Array.from(this.selectedSlots).filter(slotId => {
            let component = this.monoBehaviorSlots.get(slotId);
            return !component.scriptContext._running;
        })
        return stoppedSelected.length > 0;
    }

    canStop(){
        let runningSelected = Array.from(this.selectedSlots).filter(slotId => {
            let component = this.monoBehaviorSlots.get(slotId);
            return component.scriptContext._running;
        })
        return runningSelected.length > 0;
    }
    
    
    wrapConsoleForComponent(component, slotName) {
        // Create a console wrapper that logs to our console
        const consoleWrapper = {
            log: (...args) => this.log('log', args.join(' '), slotName),
            error: (...args) => this.log('error', args.join(' '), slotName),
            warn: (...args) => this.log('warn', args.join(' '), slotName),
            info: (...args) => this.log('info', args.join(' '), slotName)
        };
        
        // Override the console in the script context
        if (component.scriptContext) {
            component.scriptContext.log = consoleWrapper.log;
        }
    }

    run(action){
        console.log("running=>", action);
        let components = Array.from(this.selectedSlots)
        .map(slotId => this.monoBehaviorSlots.get(slotId))

        if(action === 'start'){
            components = components.filter(component => component && component.scriptContext && !component.scriptContext._running);
        }else if(action === 'stop'){
            components = components.filter(component => component && component.scriptContext && component.scriptContext._running);
        }
        
        if (components.length === 0) return;
        components.forEach(component => {
            let slot = component._slot;
            let slotName = slot?.name || 'Unknown';
            try {
                
                component[action]();
                this.wrapConsoleForComponent(component, slotName);
            } catch (error) {
                this.log('error', `Script error: ${error.message}`, slotName);
            }
        })
        setTimeout(()=>{
            this.updatePlaybackButtons();
        }, 100);
    }

    play() {
        this.run('refresh');
    }
    
    stop() {
        this.run('stop');
    }

    
    updatePlaybackButtons(isPaused = false) {
        const playBtn = document.getElementById('playBtn');
        const stopBtn = document.getElementById('stopBtn');
        if(playBtn){
            playBtn.disabled = !this.canRun();
        }
        if(stopBtn){
            stopBtn.disabled = !this.canStop();
        }

    }
    
    log(type, message, slotName) {
        console.log("logging=>", type, message, slotName);
        const consoleContent = document.getElementById('consoleContent');
        if (!consoleContent) return;
        
        const entry = document.createElement('div');
        entry.className = `console-entry console-${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        const slotPrefix = slotName ? `[${slotName}] ` : '';
        entry.innerHTML = `
            <span class="console-timestamp">[${timestamp}]</span>
            <span class="console-slot">${slotPrefix}</span>
            <span class="console-message">${message}</span>
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
        
        // Cleanup CodeMirror
        if (this.codemirror) {
            this.codemirror.toTextArea();
            this.codemirror = null;
        }
        
        // Remove keyboard event listener
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        
        // Remove page switch event listener
        if (this.pageSwitchHandler) {
            window.removeEventListener('page-switched', this.pageSwitchHandler);
        }
        
        navigation.removeDynamicPage(this.pageId);
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