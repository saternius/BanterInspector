export class Feedback {
    constructor() {
        this.selectedType = 'feature';
        this.recording = false;
        this.speechRecognizer = null;
        this.micInited = false;
        this.speechBuffer = '';
        this.rlen = 0;
        this.timeoutId = null;
        this.init();
    }
    
    async init() {
        await this.get_key();
        this.setupTypeButtons();
        this.setupSubmitButton();
        this.setupSpeechRecognition();
        this.setupTicketLookup();
    }
    

    async get_key(){
        let key = await fetch(`https://banterbrush.com/something-for-the-time`);
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
    
    setupSpeechRecognition() {
        const micButton = document.getElementById('micButton');
        if (!micButton) return;
        
        micButton.addEventListener('click', () => {
            if (!this.micInited) {
                this.initializeMic();
            } else {
                this.toggleRecording();
            }
        });
    }
    
    initializeMic() {
        if (this.micInited) return;
        
        try {
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
            
            this.speechRecognizer.canceled = (s, e) => {
                console.error('Speech recognition canceled:', e.reason);
                if (e.reason === window.SpeechSDK.CancellationReason.Error) {
                    this.showSpeechStatus('Speech recognition error: ' + e.errorDetails, 'error');
                }
                this.stopRecording();
            };
            
            this.speechRecognizer.sessionStopped = (s, e) => {
                this.stopRecording();
            };
            
            this.micInited = true;
            this.toggleRecording();
            
        } catch (error) {
            console.error('Failed to initialize speech recognition:', error);
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
        
        // Save current textarea content
        this.speechBuffer = textarea.value ? textarea.value + ' ' : '';
        this.rlen = 0;
        
        this.speechRecognizer.startContinuousRecognitionAsync(
            () => {
                this.recording = true;
                micButton.classList.add('recording');
                this.showSpeechStatus('Listening...', 'recording');
                
                // Visual feedback
                this.animateRecording();
            },
            (error) => {
                console.error('Failed to start recording:', error);
                this.showSpeechStatus('Failed to start recording', 'error');
            }
        );
    }
    
    stopRecording() {
        const micButton = document.getElementById('micButton');
        
        this.speechRecognizer.stopContinuousRecognitionAsync(
            () => {
                this.recording = false;
                micButton.classList.remove('recording');
                this.hideSpeechStatus();
                clearTimeout(this.timeoutId);
            },
            (error) => {
                console.error('Failed to stop recording:', error);
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
            
            // Save to Firestore
            await this.saveFeedbackToFirestore(feedback);
            
            // Also save locally as backup
            this.storeFeedbackLocally(feedback);
            
            // Create GitHub issue URL
            const issueTitle = `[${this.selectedType}] ${title}`;
            const issueBody = this.formatGitHubIssue(feedback);
            const githubUrl = `https://github.com/saternius/BanterInspector/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
            
            this.showStatus(
                `Thank you for your feedback! Your ticket number is <strong>#${ticketId}</strong><br>`,
                'success'
            );
            
            // Clear form
            document.getElementById('feedbackDetails').value = '';
            document.getElementById('feedbackEmail').value = '';
            
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            this.showStatus('Failed to submit feedback. Please try again.', 'error');
        }
    }
    
    generateTicketId() {
        // Generate a ticket ID in format: FB-YYYYMMDD-XXXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `FB-${dateStr}-${random}`;
    }
    
    
    
    async saveFeedbackToFirestore(feedback) {
        try {
            // Get networking instance to access Firestore
            const networking = window.networking;
            if (!networking || !networking.getFirestore()) {
                throw new Error('Firestore not available');
            }
            
            const userId = feedback.createdBy;
            const db = networking.getFirestore();
            
            // Save to user-specific subcollection: /feedback/{userId}/{ticketId}
            await db.collection('feedback').doc(userId).collection('tickets').doc(feedback.ticketId).set({
                ...feedback,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Feedback saved to Firestore:', `feedback/${userId}/tickets/${feedback.ticketId}`);
        } catch (error) {
            console.error('Error saving to Firestore:', error);
            // Don't throw - we'll still save locally
        }
    }
    
    async getFeedbackByTicket(ticketId) {
        try {
            const networking = window.networking;
            if (!networking || !networking.getFirestore()) return null;
            
            const db = networking.getFirestore();
            const userId = networking.getUserId();
            
            // First try to find in current user's tickets
            let doc = await db.collection('feedback').doc(userId).collection('tickets').doc(ticketId).get();
            
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            
            // If not found, search all users (since ticketId should be unique)
            // This requires knowing the userId or searching through all subcollections
            // For now, return null if not found in user's own collection
            console.log('Ticket not found in user collection:', ticketId);
            return null;
            
        } catch (error) {
            console.error('Error fetching feedback:', error);
            return null;
        }
    }
    
    async getAllFeedback(limit = 50) {
        try {
            const networking = window.networking;
            if (!networking || !networking.getFirestore()) return [];
            
            const db = networking.getFirestore();
            const userId = networking.getUserId();
            
            // Get all feedback for current user from their subcollection
            const snapshot = await db.collection('feedback')
                .doc(userId)
                .collection('tickets')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            return snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
        } catch (error) {
            console.error('Error fetching all feedback:', error);
            return [];
        }
    }
    
    storeFeedbackLocally(feedback) {
        const feedbackHistory = JSON.parse(localStorage.getItem('inspector_feedback') || '[]');
        feedbackHistory.push(feedback);
        localStorage.setItem('inspector_feedback', JSON.stringify(feedbackHistory));
    }
    
    formatGitHubIssue(feedback) {
        let body = `**Type:** ${feedback.type}\n\n`;
        body += `**Ticket ID:** ${feedback.ticketId}\n\n`;
        body += `**Description:**\n${feedback.details}\n\n`;
        
        if (feedback.email) {
            body += `**Contact:** ${feedback.email}\n\n`;
        }
        
        body += `**Inspector Version:** ${feedback.inspector_version}\n`;
        body += `**Submitted:** ${new Date(feedback.timestamp).toLocaleString()}\n\n`;
        body += `---\n*This feedback was submitted through the Inspector feedback form*`;
        
        return body;
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
                            ${feedback.email ? `
                            <div class="ticket-field">
                                <span class="field-label">Contact:</span>
                                <span class="field-value">${this.escapeHtml(feedback.email)}</span>
                            </div>` : ''}
                        </div>
                    </div>
                `;
                this.showTicketResult(html, 'success');
            } else {
                this.showTicketResult('Ticket not found. Please check the ID and try again.', 'error');
            }
        } catch (error) {
            console.error('Error looking up ticket:', error);
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
}