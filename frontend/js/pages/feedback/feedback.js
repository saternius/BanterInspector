const { StatementBlockEditor } = await import(`${window.repoUrl}/pages/feedback/statement-block-editor.js`);
const { confirm } = await import(`${window.repoUrl}/utils.js`);
export class Feedback {
    constructor() {
        this.selectedType = 'feature';
        this.recording = false;
        this.speechRecognizer = null;
        this.micInited = false;
        this.speechBuffer = '';
        this.rlen = 0;
        this.timeoutId = null;
        this.tickets = [];
        this.currentTicket = null;
        this.editingTicket = null;
        this.statementBlockEditor = null;
        this.useBlockMode = true; // Feature flag
        this.blockEditorContainer = null;
        this.isAddingToBlocks = false;
        this.init();
    }
    
    async init() {
        await this.get_key();
        this.setupTypeButtons();
        this.setupSubmitButton();
        this.setupSpeechRecognition();
        this.setupTicketLookup();
        this.setupTicketsList();
        this.setupBlockEditor();
        
        window.addEventListener('page-switched', (e)=>{
            log("inspector", "page-switched", e.detail.pageId)
            if(e.detail.pageId === 'feedback'){
                this.loadAllTickets();
            }
        })
        
        // Add keyboard event listeners for modal
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('ticketEditModal').style.display === 'flex') {
                if (e.key === 'Escape') {
                    this.closeEditModal();
                } else if (e.key === 'Enter' && e.target.id !== 'ticketEditContent' && !e.shiftKey) {
                    // Only save on Enter if not in the textarea
                    this.saveTicketEdit();
                }
            }
        });
    }
    

    async get_key(){
        let key = await fetch(`${window.ngrokUrl}/../something-for-the-time`);
        key = await key.text();
        this.key = key;
    }
    
    setupTypeButtons() {
        const typeButtons = document.querySelectorAll('.feedback-type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedType = btn.getAttribute('data-type');
            });
        });
    }
    
    setupSubmitButton() {
        const submitBtn = document.getElementById('submitFeedbackBtn');
        submitBtn.addEventListener('click', () => this.submitFeedback());
    }
    
    setupBlockEditor() {
        this.blockEditorContainer = document.getElementById('blockEditorContainer');
        
        if (!this.blockEditorContainer) {
            log("inspector", 'Block editor container not found in DOM');
            return;
        }
        
        // Initialize the block editor
        this.statementBlockEditor = new StatementBlockEditor({
            serviceUrl: window.blockServiceUrl || 'http://localhost:5000/process-text',
            onBlocksChanged: (blocks) => {
                // Auto-save draft when blocks change
                if (this.statementBlockEditor) {
                    this.statementBlockEditor.saveDraft();
                }
            }
        });
        
        // Check for existing draft
        const draft = this.statementBlockEditor.loadDraft();
        if (draft && draft.blocks.length > 0) {
            this.showBlockEditor(draft.blocks);
            this.showStatus('Draft restored from previous session', 'info');
        }
        
        // Setup dual submit buttons
        const submitOriginalBtn = document.getElementById('submitOriginalBtn');
        const submitRefinementBtn = document.getElementById('submitRefinementBtn');
        
        if (submitOriginalBtn) {
            submitOriginalBtn.addEventListener('click', () => this.submitOriginal());
        }
        
        if (submitRefinementBtn) {
            submitRefinementBtn.addEventListener('click', () => this.submitRefinement());
        }
        
        // Setup clear draft button
        const clearDraftBtn = document.getElementById('clearDraftBtn');
        if (clearDraftBtn) {
            clearDraftBtn.addEventListener('click', () => this.clearDraft());
        }
    }
    
    setupSpeechRecognition() {
        const micButton = document.getElementById('micButton');
        if (!micButton) return;
        
        // Store the original mic handler
        this.originalMicHandler = () => {
            if (!this.micInited) {
                this.initializeMic();
            } else {
                this.toggleRecording();
            }
        };
        
        micButton.addEventListener('click', this.originalMicHandler);
    }
    
    initializeMic() {
        if (this.micInited) return;
        
        try {
            log("inspector", "[mic] initializing..")
            // You'll need to provide your Azure subscription key and region
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
                const delta = recognizingText.length - this.rlen;
                const newText = recognizingText.slice(this.rlen);
                log("inspector", "[mic] recognizing..", newText)
                this.speechBuffer += newText;
                this.updateTextarea();
                this.rlen = recognizingText.length;
                
                // Reset timeout for auto-stop
                clearTimeout(this.timeoutId);
                this.timeoutId = setTimeout(() => {
                    this.completeRecognition();
                }, 2000);
            };
            
            this.speechRecognizer.recognized = (s, e) => {
                if (e.result.reason === window.SpeechSDK.ResultReason.RecognizedSpeech) {
                    log("inspector", "[mic] recognized: ", e.result.text)
                    this.completeRecognition();
                    this.rlen = 0;
                }
            };
            
            this.speechRecognizer.canceled = (s, e) => {
                err("inspector", 'Speech recognition canceled:', e.reason);
                if (e.reason === window.SpeechSDK.CancellationReason.Error) {
                    this.showSpeechStatus('Speech recognition error: ' + e.errorDetails, 'error');
                }
                this.stopRecording();
            };
            
            this.speechRecognizer.sessionStopped = (s, e) => {
                log("inspector", "[mic] session stopped")
                this.stopRecording();
            };
            this.micInited = true;
            this.toggleRecording();
            
        } catch (error) {
            err("inspector", 'Failed to initialize speech recognition:', error);
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
        const micButton = document.getElementById('micButton');
        const textarea = document.getElementById('feedbackDetails');
        const micStatus = document.getElementById('micButton').querySelector('.mic-status');
        // Save current textarea content
        this.speechBuffer = textarea.value ? textarea.value + ' ' : '';
        this.rlen = 0;
        let lastStatus = micStatus.textContent;
        micStatus.textContent = '⏳';
        this.speechRecognizer.startContinuousRecognitionAsync(
            () => {
                micStatus.textContent = lastStatus;
                this.recording = true;
                micButton.classList.add('recording');
                this.showSpeechStatus('Listening...', 'recording');
                
                // Visual feedback
                this.animateRecording();
            },
            (error) => {
                err("inspector", 'Failed to start recording:', error);
                this.showSpeechStatus('Failed to start recording', 'error');
            }
        );
    }
    
    stopRecording() {
        if(!this.recording) return;
        const micButton = document.getElementById('micButton');
        
        this.speechRecognizer.stopContinuousRecognitionAsync(
            async () => {
                this.recording = false;
                micButton.classList.remove('recording');
                this.hideSpeechStatus();
                clearTimeout(this.timeoutId);
                log("inspector", "[mic] stopped recording")
                
                // Update button icon back to "Add More" if in block mode
                if (this.blockEditorContainer && this.blockEditorContainer.style.display !== 'none') {
                    const micStatus = micButton.querySelector('.mic-status');
                    if (micStatus) {
                        micStatus.textContent = '➕';
                    }
                    micButton.title = 'Add more content';
                }
                
                // Process transcript with block editor if enabled
                if (this.useBlockMode && this.statementBlockEditor) {
                    const transcript = document.getElementById('feedbackDetails').value.trim();
                    
                    if (transcript) {
                        if (this.isAddingToBlocks) {
                            // Adding to existing blocks
                            await this.processAdditionalTranscript(transcript);
                            this.isAddingToBlocks = false;
                        } else {
                            // Process new transcript
                            if(transcript.length > 60){
                                await this.processTranscriptWithBlocks(transcript);
                            }
                        }
                    }
                }
            },
            (error) => {
                err("inspector", 'Failed to stop recording:', error);
            }
        );
    }
    
    completeRecognition() {
        this.updateTextarea();
        this.speechBuffer = document.getElementById('feedbackDetails').value+"\n";
        this.rlen = 0;
    }
    
    updateTextarea() {
        const textarea = document.getElementById('feedbackDetails');
        textarea.value = this.speechBuffer;
        // Trigger input event for any listeners
        textarea.dispatchEvent(new Event('input'));
    }
    
    animateRecording() {
        const indicator = document.querySelector('.recording-indicator');
        if (!indicator || !this.recording) return;
        
        // Pulse animation
        let scale = 1;
        const animate = () => {
            if (!this.recording) return;
            
            scale = scale === 1 ? 1.2 : 1;
            indicator.style.transform = `scale(${scale})`;
            setTimeout(() => animate(), 500);
        };
        animate();
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
    
    async processTranscriptWithBlocks(transcript) {
        log("inspector", "[block] processing transcript..", transcript)
        try {
            this.showProcessingUI();
            const blocks = await this.statementBlockEditor.processTranscript(transcript);
            this.hideProcessingUI();
            
            if (blocks && blocks.length > 0) {
                this.showBlockEditor(blocks);
                // Keep the original transcript visible
            } else {
                this.showFallbackOption(transcript);
            }
        } catch (error) {
                err("inspector", 'Block processing failed:', error);
            this.hideProcessingUI();
            this.showFallbackOption(transcript);
        }
    }
    
    async processAdditionalTranscript(transcript) {
        log("inspector", "[block] processing additional transcript..", transcript)
        try {
            this.showProcessingUI();
            // Get existing blocks to send as context
            const existingBlocks = this.statementBlockEditor.getBlocks();
            
            // Process the new transcript with existing blocks as context
            const blocks = await this.statementBlockEditor.processTranscript(transcript);
            this.hideProcessingUI();
            
            if (blocks && blocks.length > 0) {
                this.showBlockEditor(blocks);
                // Re-enable the textarea and make it read-only again
                const textarea = document.getElementById('feedbackDetails');
                if (textarea) {
                    textarea.readOnly = true;
                    textarea.style.opacity = '0.7';
                }
            }
        } catch (error) {
            err("inspector", 'Failed to add additional content:', error);
            this.hideProcessingUI();
            this.showStatus('Failed to process additional content', 'error');
        }
    }
    
    showProcessingUI() {
        const processingOverlay = document.createElement('div');
        processingOverlay.id = 'processingOverlay';
        processingOverlay.className = 'processing-overlay';
        processingOverlay.innerHTML = `
            <div class="processing-content">
                <div class="processing-spinner"></div>
                <p>Processing your feedback...</p>
            </div>
        `;
        
        const feedbackSection = document.querySelector('.feedback-section');
        if (feedbackSection) {
            feedbackSection.appendChild(processingOverlay);
        }
    }
    
    hideProcessingUI() {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    showBlockEditor(blocks) {
        if (!this.blockEditorContainer || !this.statementBlockEditor) return;
        
        // Keep the original textarea visible but make it read-only
        const textarea = document.getElementById('feedbackDetails');
        if (textarea) {
            textarea.readOnly = true;
            textarea.style.opacity = '0.7';
        }
        
        // Show the block editor
        this.blockEditorContainer.style.display = 'block';
        
        // Show the clear draft button
        const clearDraftBtn = document.getElementById('clearDraftBtn');
        if (clearDraftBtn) {
            clearDraftBtn.style.display = 'inline-flex';
        }
        
        // Render the blocks
        this.statementBlockEditor.renderBlocks(this.blockEditorContainer);
        
        // Update UI for block mode
        this.updateUIForBlockMode();
    }
    
    hideBlockEditor() {
        if (!this.blockEditorContainer) return;
        
        this.blockEditorContainer.style.display = 'none';
        
        // Hide the clear draft button
        const clearDraftBtn = document.getElementById('clearDraftBtn');
        if (clearDraftBtn) {
            clearDraftBtn.style.display = 'none';
        }
        
        // Reset textarea to editable
        const textarea = document.getElementById('feedbackDetails');
        if (textarea) {
            textarea.readOnly = false;
            textarea.style.opacity = '1';
        }
        
        // Reset UI to normal mode
        this.resetUIFromBlockMode();
    }
    
    toggleTranscriptView() {
        const originalView = document.querySelector('.original-transcript');
        const blocksList = document.getElementById('blocksList');
        const toggleBtn = document.querySelector('.toggle-view-btn');
        
        if (!originalView || !blocksList) return;
        
        if (originalView.style.display === 'none') {
            // Show original transcript
            originalView.style.display = 'block';
            blocksList.style.display = 'none';
            toggleBtn.textContent = 'View Blocks';
            
            // Display the original transcript
            const originalTextDiv = document.getElementById('originalText');
            if (originalTextDiv) {
                originalTextDiv.textContent = this.statementBlockEditor.getRawTranscript();
            }
        } else {
            // Show blocks
            originalView.style.display = 'none';
            blocksList.style.display = 'block';
            toggleBtn.textContent = 'View Original';
        }
    }
    
    showFallbackOption(transcript) {
        const message = `
            <div>Unable to process into blocks. Would you like to:</div>
            <div class="fallback-options">
                <button onclick="feedback.useOriginalTranscript()">Use Original Text</button>
                <button onclick="feedback.retryBlockProcessing()">Try Again</button>
            </div>
        `;
        this.showStatus(message, 'warning');
        
        // Keep the transcript in the textarea
        document.getElementById('feedbackDetails').value = transcript;
    }
    
    useOriginalTranscript() {
        this.useBlockMode = false;
        this.hideBlockEditor();
        this.hideSpeechStatus();
        this.showStatus('Using original transcript', 'info');
    }
    
    retryBlockProcessing() {
        const transcript = document.getElementById('feedbackDetails').value.trim();
        if (transcript) {
            this.processTranscriptWithBlocks(transcript);
        }
    }
    
    startAddingToBlocks() {
        // If currently recording, stop it first
        if (this.recording) {
            this.stopRecording();
            return;
        }
        
        this.isAddingToBlocks = true;
        const textarea = document.getElementById('feedbackDetails');
        
        // Clear and enable textarea for new input
        if (textarea) {
            textarea.value = '';
            textarea.readOnly = false;
            textarea.style.opacity = '1';
            textarea.focus();
        }
        
        this.showStatus('Record additional content to add to your blocks', 'info');
        
        // Start recording if mic is initialized
        if (this.micInited) {
            this.startRecording();
        }else{
            this.initializeMic();
        }
    }
    
    updateUIForBlockMode() {
        // Hide single submit button, show dual buttons
        const singleSubmit = document.getElementById('submitFeedbackBtn');
        const dualSubmit = document.getElementById('dualSubmitButtons');
        const fixWithVoice = document.getElementById('fixWithVoice');
        
        if (singleSubmit) singleSubmit.style.display = 'none';
        if (dualSubmit) dualSubmit.style.display = 'flex';
        if (fixWithVoice) fixWithVoice.style.display = 'flex';
        // Convert mic button to "Add More" button
        const micButton = document.getElementById('micButton');
        this.addMoreHandler = () => this.startAddingToBlocks();

        if (micButton) {
            const micStatus = micButton.querySelector('.mic-status');
            if (micStatus && !this.recording) {
                micStatus.textContent = '➕';
            }
            micButton.title = this.recording ? 'Stop recording' : 'Add more content';
            
            // Update click handler for add more functionality
            micButton.removeEventListener('click', this.originalMicHandler);
            micButton.addEventListener('click', this.addMoreHandler);
        }
        if(fixWithVoice){
            fixWithVoice.addEventListener('click', this.addMoreHandler);
        }
    }
    
    resetUIFromBlockMode() {
        // Show single submit button, hide dual buttons
        const singleSubmit = document.getElementById('submitFeedbackBtn');
        const dualSubmit = document.getElementById('dualSubmitButtons');
        const fixWithVoice = document.getElementById('fixWithVoice');
        if (singleSubmit) singleSubmit.style.display = 'block';
        if (dualSubmit) dualSubmit.style.display = 'none';
        if (fixWithVoice) fixWithVoice.style.display = 'none';
        
        // Reset mic button to original state
        const micButton = document.getElementById('micButton');
        if (micButton) {
            const micStatus = micButton.querySelector('.mic-status');
            if (micStatus) {
                micStatus.textContent = '';
            }
            micButton.title = 'Click to record feedback';
            
            // Restore original click handler
            if (this.addMoreHandler) {
                micButton.removeEventListener('click', this.addMoreHandler);
            }
            micButton.addEventListener('click', this.originalMicHandler);
        }
        
        // Clear blocks
        if (this.statementBlockEditor) {
            this.statementBlockEditor.clear();
        }
    }
    
    async submitOriginal() {
        // Get the original transcript from the textarea
        const originalText = document.getElementById('feedbackDetails').value.trim();
        
        if (!originalText) {
            this.showStatus('Please provide feedback details', 'error');
            return;
        }
        
        // Submit the original text
        await this.submitFeedback();
    }
    
    async submitRefinement() {
        if (!this.statementBlockEditor) {
            this.showStatus('No refinement available', 'error');
            return;
        }
        
        const blocks = this.statementBlockEditor.getBlocks();
        
        if (blocks.length === 0) {
            this.showStatus('Please add some feedback blocks', 'error');
            return;
        }
        
        // Format blocks into feedback text
        const formattedFeedback = blocks.map((block, index) => `${index + 1}. ${block}`).join('\n\n');
        
        // Temporarily set the textarea value for submission
        const textarea = document.getElementById('feedbackDetails');
        const originalValue = textarea.value;
        textarea.value = formattedFeedback;
        
        // Submit the refined text
        await this.submitFeedback();
        
        // Restore original value in case submission fails
        if (document.getElementById('feedbackDetails').value === formattedFeedback) {
            textarea.value = originalValue;
        }
    }
    
    async clearDraft() {
        if (await confirm('Are you sure you want to clear your draft and start over?')) {
            // Clear the block editor
            if (this.statementBlockEditor) {
                this.statementBlockEditor.clear();
                this.statementBlockEditor.clearDraft();
            }
            
            // Hide the block editor
            this.hideBlockEditor();
            
            // Clear the textarea
            const textarea = document.getElementById('feedbackDetails');
            if (textarea) {
                textarea.value = '';
                textarea.readOnly = false;
                textarea.style.opacity = '1';
                textarea.focus();
            }
            
            // Reset any recording flags
            this.isAddingToBlocks = false;
            
            // Clear any existing status message
            this.hideSpeechStatus();
            this.showStatus("", "info");
        }
    }
    
    async submitFeedback() {
        const details = document.getElementById('feedbackDetails').value.trim();
        
        if (!details) {
            this.showStatus('Please provide feedback details', 'error');
            return;
        }
        
        // Generate a title from the first line or first 50 chars of feedback
        const title = details.split('\n')[0].substring(0, 50) + (details.length > 50 ? '...' : '');
        
        const feedback = {
            type: this.selectedType,
            title,
            details,
            timestamp: new Date().toISOString(),
            inspector_version: '1.0.0',
            user_agent: navigator.userAgent,
            createdBy: networking.getUserId()
        };
        
        try {
            // Generate ticket ID
            const ticketId = this.generateTicketId();
            feedback.ticketId = ticketId;
            feedback.status = 'open';
            
            // Save to Firebase
            await this.saveFeedbackToFirebase(feedback);
            
            // Also save locally as backup
            this.storeFeedbackLocally(feedback);
                     
            this.showStatus(
                `Thank you for your feedback! Your ticket number is <strong>#${ticketId}</strong><br>`,
                'success'
            );

            setTimeout(()=>{
                this.loadAllTickets()
            }, 250)
            
            // Clear form
            document.getElementById('feedbackDetails').value = '';
            
            // Clear block editor if in use
            if (this.useBlockMode && this.statementBlockEditor) {
                this.statementBlockEditor.clear();
                this.hideBlockEditor();
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            this.showStatus('Failed to submit feedback. Please try again.', 'error');
        }
    }
    
    generateTicketId() {
        // Generate a ticket ID in format: FB_YYYYMMDD_XXXX (using underscores for Firestore compatibility)
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        let accro = "BUG"
        if(this.selectedType === "feature"){
            accro = "FEAT"
        }else if(this.selectedType === "improvement"){
            accro = "IDEA"
        }
        return `${accro}_${dateStr}_${random}`;
    }
    
    
    
    async saveFeedbackToFirebase(feedback) {
        log("net","saving feedback to firebase =>", feedback)
        try {
            // Get networking instance to access Firebase
            const networking = window.networking;
            const db = networking?.getDatabase();
            
            if (!db) {
                throw new Error('Firebase Database not available');
            }
            
            // Save to public path: feedback/tickets/{ticketId}
            await db.ref(`feedback/tickets/${feedback.ticketId}`).set({
                ...feedback,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            log("net", 'Feedback saved to Firebase:', `feedback/tickets/${feedback.ticketId}`);
        } catch (error) {
            err("net", 'Error saving to Firebase:', error);
            // Don't throw - we'll still save locally
        }
    }
    
    async getFeedbackByTicket(ticketId) {
        try {
            const networking = window.networking;
            const db = networking?.getDatabase();
            
            if (!db) return null;
            
            // Get from public path
            const snapshot = await db.ref(`feedback/tickets/${ticketId}`).once('value');
            
            if (snapshot.exists()) {
                return { id: ticketId, ...snapshot.val() };
            }
            
            return null;
            
        } catch (error) {
            err("net", 'Error fetching feedback:', error);
            return null;
        }
    }
    
    storeFeedbackLocally(feedback) {
        const feedbackHistory = JSON.parse(localStorage.getItem('inspector_feedback') || '[]');
        feedbackHistory.push(feedback);
        localStorage.setItem('inspector_feedback', JSON.stringify(feedbackHistory));
    }
    

    showStatus(message, type) {
        const statusEl = document.getElementById('feedbackStatus');
        statusEl.innerHTML = message;
        statusEl.className = `feedback-status ${type}`;
        statusEl.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 10000);
        }
    }
    
    setupTicketLookup() {
        const lookupBtn = document.getElementById('lookupTicketBtn');
        const lookupInput = document.getElementById('ticketLookupInput');
        
        if (!lookupBtn || !lookupInput) return;
        
        lookupBtn.addEventListener('click', () => this.lookupTicket());
        lookupInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.lookupTicket();
            }
        });
    }
    
    async lookupTicket() {
        const ticketId = document.getElementById('ticketLookupInput').value.trim();
        const resultDiv = document.getElementById('ticketResult');
        
        if (!ticketId) {
            this.showTicketResult('Please enter a ticket ID', 'error');
            return;
        }
        
        this.showTicketResult('Looking up ticket...', 'loading');
        
        try {
            const feedback = await this.getFeedbackByTicket(ticketId);
            
            if (feedback) {
                const html = `
                    <div class="ticket-found">
                        <h4>Ticket #${feedback.ticketId}</h4>
                        <div class="ticket-details">
                            <div class="ticket-field">
                                <span class="field-label">Type:</span>
                                <span class="field-value type-${feedback.type}">${feedback.type}</span>
                            </div>
                            <div class="ticket-field">
                                <span class="field-label">Status:</span>
                                <span class="field-value status-${feedback.status}">${feedback.status}</span>
                            </div>
                            <div class="ticket-field">
                                <span class="field-label">Submitted:</span>
                                <span class="field-value">${new Date(feedback.timestamp).toLocaleString()}</span>
                            </div>
                            <div class="ticket-field full-width">
                                <span class="field-label">Description:</span>
                                <div class="field-value description">${this.escapeHtml(feedback.details)}</div>
                            </div>
                        </div>
                    </div>
                `;
                this.showTicketResult(html, 'success');
            } else {
                this.showTicketResult('Ticket not found. Please check the ID and try again.', 'error');
            }
        } catch (error) {
            err("net", 'Error looking up ticket:', error);
            this.showTicketResult('Failed to lookup ticket. Please try again later.', 'error');
        }
    }
    
    showTicketResult(content, type) {
        const resultDiv = document.getElementById('ticketResult');
        resultDiv.innerHTML = content;
        resultDiv.className = `ticket-result ${type}`;
        resultDiv.style.display = 'block';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Tickets List Methods
    setupTicketsList() {
        const refreshBtn = document.getElementById('refreshTicketsBtn');
        const typeFilter = document.getElementById('ticketFilterType');
        const statusFilter = document.getElementById('ticketFilterStatus');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAllTickets());
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterTickets());
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterTickets());
        }
    }
    
    async loadAllTickets() {
        const ticketsList = document.getElementById('ticketsList');
        if (!ticketsList) return;
        
        ticketsList.innerHTML = '<div class="loading-tickets">Loading tickets...</div>';
        
        try {
            const networking = window.networking;
            const db = networking?.getDatabase();
            
            if (!db) {
                throw new Error('Firebase Database not available');
            }
            
            // Get all tickets from public path
            const snapshot = await db.ref('feedback/tickets').once('value');
            const allTickets = [];
            
            snapshot.forEach(childSnapshot => {
                allTickets.push({
                    id: childSnapshot.key,
                    ticketId: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            // Sort by creation date (newest first)
            allTickets.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.timestamp);
                const dateB = new Date(b.createdAt || b.timestamp);
                return dateB - dateA;
            });
            
            this.tickets = allTickets;
            this.displayTickets(allTickets);
            
        } catch (error) {
            err("net", 'Error loading tickets:', error);
            ticketsList.innerHTML = '<div class="error-loading">Failed to load tickets</div>';
        }
    }
    
    displayTickets(tickets) {
        const ticketsList = document.getElementById('ticketsList');
        if (!ticketsList) return;
        
        if (tickets.length === 0) {
            ticketsList.innerHTML = '<div class="empty-tickets">No tickets found</div>';
            return;
        }
        
        const currentUserId = networking.getUserId();
        const ticketsHtml = tickets.map(ticket => {
            const isOwner = ticket.createdBy === currentUserId;
            const date = new Date(ticket.timestamp || ticket.createdAt);
            
            return `
                <div class="ticket-item" data-ticket-id="${ticket.ticketId}">
                    <div class="ticket-item-header">
                        <span class="ticket-item-id">#${ticket.ticketId}</span>
                        <div class="ticket-item-meta">
                            <span class="ticket-type-badge ${ticket.type}">${ticket.type}</span>
                            <span class="ticket-status-badge ${ticket.status}">${ticket.status}</span>
                            ${ticket.comments && ticket.comments.length > 0 ? `
                                <span class="ticket-comments-badge" title="${ticket.comments.length} comment${ticket.comments.length !== 1 ? 's' : ''}">
                                    💬 ${ticket.comments.length}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="ticket-item-title">${this.escapeHtml(ticket.details ? (ticket.details.length > 100 ? ticket.details.substring(0, 100) + '...' : ticket.details) : 'No description')}</div>
                    <div class="ticket-item-author">
                        by ${ticket.createdBy} • ${date.toLocaleDateString()}
                    </div>
                    ${isOwner ? `
                        <div class="ticket-item-actions">
                            <button class="ticket-action-btn edit" onclick="feedback.editTicket('${ticket.ticketId}')">Edit</button>
                            <button class="ticket-action-btn delete" onclick="feedback.deleteTicket('${ticket.ticketId}')">Delete</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        ticketsList.innerHTML = ticketsHtml;
        
        // Add click handlers to open ticket details
        ticketsList.querySelectorAll('.ticket-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('ticket-action-btn')) {
                    const ticketId = item.getAttribute('data-ticket-id');
                    this.openTicketDetail(ticketId);
                }
            });
        });
    }
    
    filterTickets() {
        const typeFilter = document.getElementById('ticketFilterType').value;
        const statusFilter = document.getElementById('ticketFilterStatus').value;
        
        let filteredTickets = this.tickets;
        
        if (typeFilter !== 'all') {
            filteredTickets = filteredTickets.filter(t => t.type === typeFilter);
        }
        
        if (statusFilter !== 'all') {
            filteredTickets = filteredTickets.filter(t => t.status === statusFilter);
        }
        
        this.displayTickets(filteredTickets);
    }
    
    async openTicketDetail(ticketId) {
        const ticket = this.tickets.find(t => t.ticketId === ticketId);
        if (!ticket) return;
        
        // Fetch fresh ticket data to ensure we have latest comments
        try {
            const networking = window.networking;
            const db = networking?.getDatabase();
            if (db) {
                const snapshot = await db.ref(`feedback/tickets/${ticketId}`).once('value');
                if (snapshot.exists()) {
                    const latestData = snapshot.val();
                    Object.assign(ticket, latestData);
                }
            }
        } catch (error) {
            err("net", 'Error fetching latest ticket data:', error);
        }
        
        this.currentTicket = ticket;
        
        const modal = document.getElementById('ticketDetailModal');
        const modalTitle = document.getElementById('modalTicketId');
        const modalContent = document.getElementById('modalTicketContent');
        
        modalTitle.textContent = `Ticket #${ticket.ticketId}`;
        
        const date = new Date(ticket.timestamp || ticket.createdAt);
        const isOwner = ticket.createdBy === networking.getUserId();
        
        modalContent.innerHTML = `
            <div class="ticket-detail-content">
                <div class="ticket-detail-field">
                    <div class="ticket-detail-label">Type</div>
                    <div class="ticket-detail-value">
                        <span class="ticket-type-badge ${ticket.type}">${ticket.type}</span>
                    </div>
                </div>
                <div class="ticket-detail-field">
                    <div class="ticket-detail-label">Status</div>
                    <div class="ticket-detail-value">
                        <span class="ticket-status-badge ${ticket.status}">${ticket.status}</span>
                    </div>
                </div>
                <div class="ticket-detail-field">
                    <div class="ticket-detail-label">Created By</div>
                    <div class="ticket-detail-value">${ticket.createdBy}</div>
                </div>
                <div class="ticket-detail-field">
                    <div class="ticket-detail-label">Created At</div>
                    <div class="ticket-detail-value">${date.toLocaleString()}</div>
                </div>
                ${ticket.editedAt ? `
                    <div class="ticket-detail-field">
                        <div class="ticket-detail-label">Last Edited</div>
                        <div class="ticket-detail-value">${new Date(ticket.editedAt).toLocaleString()}</div>
                    </div>
                ` : ''}
                <div class="ticket-detail-field">
                    <div class="ticket-detail-label">Description</div>
                    <div class="ticket-detail-value">${this.escapeHtml(ticket.details)}</div>
                </div>
            </div>
            
            <div class="comments-section">
                <h3 class="comments-header">Comments</h3>
                <div id="commentsList" class="comments-list">
                    <div class="loading-comments">Loading comments...</div>
                </div>
                <div class="comment-form">
                    <div class="comment-input-container">
                        <textarea id="newCommentInput" class="comment-input" placeholder="Add a comment..."></textarea>
                        <button id="commentMicBtn" class="comment-mic-btn" title="Click to record comment">
                            <span class="mic-icon">🎤</span>
                        </button>
                    </div>
                    <button class="comment-submit-btn" onclick="feedback.addComment()">Post</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Setup comment mic button
        this.setupCommentMic();
        
        // Load comments
        await this.loadComments(ticket);
    }
    
    async loadComments(ticket) {
        const commentsList = document.getElementById('commentsList');
        
        try {
            // Fetch latest ticket data to ensure we have updated comments
            const networking = window.networking;
            const db = networking?.getDatabase();
            
            if (db) {
                const snapshot = await db.ref(`feedback/tickets/${ticket.ticketId}`).once('value');
                if (snapshot.exists()) {
                    const latestData = snapshot.val();
                    ticket.comments = latestData.comments || [];
                    
                    // Update the current ticket reference
                    if (this.currentTicket && this.currentTicket.ticketId === ticket.ticketId) {
                        this.currentTicket.comments = ticket.comments;
                    }
                }
            }
            
            const comments = ticket.comments || [];
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<div class="empty-comments">No comments yet. Be the first to comment!</div>';
                return;
            }
            
            const currentUser = (SM.scene?.localUser?.name) || networking.getUserId() || 'Anonymous';
            
            const commentsHtml = comments.map((comment, index) => {
                const date = new Date(comment.timestamp);
                const isAuthor = comment.author === currentUser;
                
                return `
                    <div class="comment-item" data-comment-index="${index}">
                        <div class="comment-header">
                            <span class="comment-author">${comment.author}</span>
                            <span class="comment-time">${date.toLocaleString()}${comment.editedAt ? ' (edited)' : ''}</span>
                            ${isAuthor ? `
                                <div class="comment-actions">
                                    <button class="comment-edit-btn" onclick="feedback.editComment(${index})">Edit</button>
                                    <button class="comment-delete-btn" onclick="feedback.deleteComment(${index})">Delete</button>
                                </div>
                            ` : ''}
                        </div>
                        <div class="comment-content" id="comment-content-${index}">${this.escapeHtml(comment.content)}</div>
                        <div class="comment-edit-form" id="comment-edit-${index}" style="display: none;">
                            <textarea class="comment-edit-textarea" id="comment-edit-textarea-${index}">${this.escapeHtml(comment.content)}</textarea>
                            <div class="comment-edit-actions">
                                <button class="comment-save-btn" onclick="feedback.saveEditedComment(${index})">Save</button>
                                <button class="comment-cancel-btn" onclick="feedback.cancelEditComment(${index})">Cancel</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            commentsList.innerHTML = commentsHtml;
            
        } catch (error) {
            err("net", 'Error loading comments:', error);
            commentsList.innerHTML = '<div class="error-loading">Failed to load comments</div>';
        }
    }
    
    async addComment() {
        const input = document.getElementById('newCommentInput');
        const content = input.value.trim();
        
        if (!content || !this.currentTicket) return;
        
        try {
            const networking = window.networking;
            const db = networking?.getDatabase();
            
            if (!db) {
                throw new Error('Firebase Database not available');
            }
            
            const comment = {
                author: (SM.scene?.localUser?.name) || networking.getUserId() || 'Anonymous',
                content: content,
                timestamp: new Date().toISOString()
            };
            
            // Update the ticket with the new comment
            const updatedComments = [...(this.currentTicket.comments || []), comment];
            
            // First get the current ticket data to preserve all fields
            const ticketRef = db.ref(`feedback/tickets/${this.currentTicket.ticketId}`);
            const currentSnapshot = await ticketRef.once('value');
            const currentData = currentSnapshot.val() || this.currentTicket;
            
            // Update with new comments
            await ticketRef.set({
                ...currentData,
                comments: updatedComments,
                updatedAt: new Date().toISOString()
            });
            
            // Update local data
            this.currentTicket.comments = updatedComments;
            const ticketIndex = this.tickets.findIndex(t => t.ticketId === this.currentTicket.ticketId);
            if (ticketIndex !== -1) {
                this.tickets[ticketIndex] = this.currentTicket;
            }
            
            // Clear input and reload comments
            input.value = '';
            await this.loadComments(this.currentTicket);
            
            // Update the comment count in the ticket list
            this.updateTicketCommentCount(this.currentTicket.ticketId, updatedComments.length);
            
        } catch (error) {
            err("net", 'Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        }
    }
    
    async editTicket(ticketId) {
        const ticket = this.tickets.find(t => t.ticketId === ticketId);
        if (!ticket) return;
        
        // Store the ticket being edited
        this.editingTicket = ticket;
        
        // Set current content in the textarea
        const contentTextarea = document.getElementById('ticketEditContent');
        contentTextarea.value = ticket.details || '';
        
        // Show the modal
        document.getElementById('ticketEditModal').style.display = 'flex';
        
        // Focus the textarea
        setTimeout(() => contentTextarea.focus(), 100);
    }
    
    closeEditModal() {
        document.getElementById('ticketEditModal').style.display = 'none';
        this.editingTicket = null;
    }
    
    async saveTicketEdit() {
        if (!this.editingTicket) return;
        
        const contentTextarea = document.getElementById('ticketEditContent');
        const newContent = contentTextarea.value.trim();
        
        if (!newContent) {
            alert('Feedback content cannot be empty.');
            return;
        }
        
        try {
            const networking = window.networking;
            const db = networking?.getDatabase();
            
            if (!db) {
                throw new Error('Firebase Database not available');
            }
            
            // Get the current ticket data to preserve all fields
            const ticketRef = db.ref(`feedback/tickets/${this.editingTicket.ticketId}`);
            const currentSnapshot = await ticketRef.once('value');
            const currentData = currentSnapshot.val() || this.editingTicket;
            
            // Update with new content
            await ticketRef.set({
                ...currentData,
                details: newContent,
                updatedAt: new Date().toISOString(),
                editedAt: new Date().toISOString()
            });
            
            // Update local data
            this.editingTicket.details = newContent;
            this.editingTicket.editedAt = new Date().toISOString();
            
            // Update the display to show the edited content
            const ticketItems = document.querySelectorAll('.ticket-item');
            ticketItems.forEach(item => {
                if (item.getAttribute('data-ticket-id') === this.editingTicket.ticketId) {
                    const titleElement = item.querySelector('.ticket-item-title');
                    if (titleElement) {
                        // Truncate to first 100 chars for display
                        const truncated = newContent.length > 100 ? newContent.substring(0, 100) + '...' : newContent;
                        titleElement.textContent = truncated;
                    }
                }
            });
            
            // Close the modal
            this.closeEditModal();
            
            // If the ticket detail modal is open, update it
            if (this.currentTicket && this.currentTicket.ticketId === this.editingTicket.ticketId) {
                this.currentTicket.details = newContent;
                this.currentTicket.editedAt = this.editingTicket.editedAt;
                // Re-open the ticket detail to refresh the display
                this.openTicketDetail(this.editingTicket.ticketId);
            }
            
        } catch (error) {
            console.error('Error updating ticket:', error);
            alert('Failed to update ticket. Please try again.');
        }
    }
    
    async deleteTicket(ticketId) {
        if (!await confirm('Are you sure you want to delete this ticket?')) return;
        
        const ticket = this.tickets.find(t => t.ticketId === ticketId);
        if (!ticket) return;
        
        try {
            const networking = window.networking;
            const db = networking?.getDatabase();
            
            if (!db) {
                throw new Error('Firebase Database not available');
            }
            
            await db.ref(`feedback/tickets/${ticketId}`).remove();
            
            // Remove from local data
            this.tickets = this.tickets.filter(t => t.ticketId !== ticketId);
            this.displayTickets(this.tickets);
            
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('Failed to delete ticket. Please try again.');
        }
    }
    
    // Comment editing methods
    editComment(commentIndex) {
        // Hide the comment content and show the edit form
        document.getElementById(`comment-content-${commentIndex}`).style.display = 'none';
        document.getElementById(`comment-edit-${commentIndex}`).style.display = 'block';
        
        // Focus the textarea
        const textarea = document.getElementById(`comment-edit-textarea-${commentIndex}`);
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
    
    cancelEditComment(commentIndex) {
        // Hide the edit form and show the comment content
        document.getElementById(`comment-edit-${commentIndex}`).style.display = 'none';
        document.getElementById(`comment-content-${commentIndex}`).style.display = 'block';
    }
    
    async saveEditedComment(commentIndex) {
        const textarea = document.getElementById(`comment-edit-textarea-${commentIndex}`);
        const newContent = textarea.value.trim();
        
        if (!newContent || !this.currentTicket) return;
        
        try {
            const networking = window.networking;
            const db = networking?.getDatabase();
            
            if (!db) {
                throw new Error('Firebase Database not available');
            }
            
            // Update the comment content
            const updatedComments = [...this.currentTicket.comments];
            updatedComments[commentIndex] = {
                ...updatedComments[commentIndex],
                content: newContent,
                editedAt: new Date().toISOString()
            };
            
            // Save to Firebase
            const ticketRef = db.ref(`feedback/tickets/${this.currentTicket.ticketId}`);
            const currentSnapshot = await ticketRef.once('value');
            const currentData = currentSnapshot.val() || this.currentTicket;
            
            await ticketRef.set({
                ...currentData,
                comments: updatedComments,
                updatedAt: new Date().toISOString()
            });
            
            // Update local data
            this.currentTicket.comments = updatedComments;
            const ticketIndex = this.tickets.findIndex(t => t.ticketId === this.currentTicket.ticketId);
            if (ticketIndex !== -1) {
                this.tickets[ticketIndex] = this.currentTicket;
            }
            
            // Reload comments to show the update
            await this.loadComments(this.currentTicket);
            
            // Update the comment count in the ticket list
            this.updateTicketCommentCount(this.currentTicket.ticketId, updatedComments.length);
            
        } catch (error) {
            console.error('Error saving edited comment:', error);
            alert('Failed to save comment. Please try again.');
        }
    }
    
    async deleteComment(commentIndex) {
        if (!await confirm('Are you sure you want to delete this comment?')) return;
        
        if (!this.currentTicket) return;
        
        try {
            const networking = window.networking;
            const db = networking?.getDatabase();
            
            if (!db) {
                throw new Error('Firebase Database not available');
            }
            
            // Remove the comment from the array
            const updatedComments = this.currentTicket.comments.filter((_, index) => index !== commentIndex);
            
            // Save to Firebase
            const ticketRef = db.ref(`feedback/tickets/${this.currentTicket.ticketId}`);
            const currentSnapshot = await ticketRef.once('value');
            const currentData = currentSnapshot.val() || this.currentTicket;
            
            await ticketRef.set({
                ...currentData,
                comments: updatedComments,
                updatedAt: new Date().toISOString()
            });
            
            // Update local data
            this.currentTicket.comments = updatedComments;
            const ticketIndex = this.tickets.findIndex(t => t.ticketId === this.currentTicket.ticketId);
            if (ticketIndex !== -1) {
                this.tickets[ticketIndex] = this.currentTicket;
            }
            
            // Reload comments to show the update
            await this.loadComments(this.currentTicket);
            
            // Update the comment count in the ticket list
            this.updateTicketCommentCount(this.currentTicket.ticketId, updatedComments.length);
            
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment. Please try again.');
        }
    }
    
    updateTicketCommentCount(ticketId, commentCount) {
        // Find the ticket item in the DOM
        const ticketItem = document.querySelector(`.ticket-item[data-ticket-id="${ticketId}"]`);
        if (!ticketItem) return;
        
        const metaContainer = ticketItem.querySelector('.ticket-item-meta');
        if (!metaContainer) return;
        
        // Remove existing comment badge if any
        const existingBadge = metaContainer.querySelector('.ticket-comments-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add new comment badge if there are comments
        if (commentCount > 0) {
            const commentBadge = `<span class="ticket-comments-badge" title="${commentCount} comment${commentCount !== 1 ? 's' : ''}">
                💬 ${commentCount}
            </span>`;
            metaContainer.insertAdjacentHTML('beforeend', commentBadge);
        }
    }
    
    setupCommentMic() {
        const commentMicBtn = document.getElementById('commentMicBtn');
        if (!commentMicBtn) return;
        
        // Create a simple recording state for comments
        let isRecordingComment = false;
        
        commentMicBtn.addEventListener('click', () => {
            if (!this.micInited) {
                // Initialize mic if not already done
                this.initializeMic();
                // After init, we'll need to click again to start recording
                return;
            }
            
            if (!isRecordingComment) {
                // Start recording for comment
                this.startCommentRecording(commentMicBtn);
                isRecordingComment = true;
            } else {
                // Stop recording for comment
                this.stopCommentRecording(commentMicBtn);
                isRecordingComment = false;
            }
        });
    }
    
    startCommentRecording(micButton) {
        const commentInput = document.getElementById('newCommentInput');
        if (!commentInput) return;
        
        // Save current content
        this.commentSpeechBuffer = commentInput.value ? commentInput.value + ' ' : '';
        
        // Temporarily hijack the main speech buffer
        const originalBuffer = this.speechBuffer;
        this.speechBuffer = this.commentSpeechBuffer;
        
        this.speechRecognizer.recognizing = (s, e) => {
            const recognizingText = e.result.text;
            this.commentSpeechBuffer = this.commentSpeechBuffer + recognizingText.slice(this.rlen);
            commentInput.value = this.commentSpeechBuffer;
            this.rlen = recognizingText.length;
        };
        
        this.speechRecognizer.recognized = (s, e) => {
            if (e.result.reason === window.SpeechSDK.ResultReason.RecognizedSpeech) {
                this.commentSpeechBuffer += ' ';
                commentInput.value = this.commentSpeechBuffer;
                this.rlen = 0;
            }
        };
        
        this.speechRecognizer.startContinuousRecognitionAsync(
            () => {
                micButton.classList.add('recording');
                const micIcon = micButton.querySelector('.mic-icon');
                if (micIcon) micIcon.textContent = '🔴';
            },
            (error) => {
                console.error('Failed to start comment recording:', error);
                this.showStatus('Failed to start recording', 'error');
            }
        );
        
        // Store original buffer to restore later
        this._originalSpeechBuffer = originalBuffer;
    }
    
    stopCommentRecording(micButton) {
        this.speechRecognizer.stopContinuousRecognitionAsync(
            () => {
                micButton.classList.remove('recording');
                const micIcon = micButton.querySelector('.mic-icon');
                if (micIcon) micIcon.textContent = '🎤';
                
                // Restore original speech buffer and recognizer settings
                this.speechBuffer = this._originalSpeechBuffer || '';
                this.rlen = 0;
                
                // Re-setup main recognizer
                this.setupMainRecognizer();
            },
            (error) => {
                console.error('Failed to stop comment recording:', error);
            }
        );
    }
    
    setupMainRecognizer() {
        // Restore the main feedback recognizer settings
        this.speechRecognizer.recognizing = (s, e) => {
            const recognizingText = e.result.text;
            const delta = recognizingText.length - this.rlen;
            const newText = recognizingText.slice(this.rlen);
            
            this.speechBuffer += newText;
            this.updateTextarea();
            this.rlen = recognizingText.length;
            
            // Reset timeout for auto-stop
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
                this.completeRecognition();
            }, 2000);
        };
        
        this.speechRecognizer.recognized = (s, e) => {
            if (e.result.reason === window.SpeechSDK.ResultReason.RecognizedSpeech) {
                this.completeRecognition();
                this.rlen = 0;
            }
        };
    }
}

// Add global function handlers
window.closeTicketModal = function() {
    document.getElementById('ticketDetailModal').style.display = 'none';
};