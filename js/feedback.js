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
        this.init();
    }
    
    async init() {
        await this.get_key();
        this.setupTypeButtons();
        this.setupSubmitButton();
        this.setupSpeechRecognition();
        this.setupTicketLookup();
        this.setupTicketsList();
        this.loadAllTickets();
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
                     
            this.showStatus(
                `Thank you for your feedback! Your ticket number is <strong>#${ticketId}</strong><br>`,
                'success'
            );
            
            // Clear form
            document.getElementById('feedbackDetails').value = '';            
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
        return `FB_${dateStr}_${random}`;
    }
    
    
    
    async saveFeedbackToFirestore(feedback) {
        console.log("saving feedback to firestore =>", feedback)
        try {
            // Get networking instance to access Firestore REST
            const networking = window.networking;
            const rest = networking?.getFirestoreREST();
            
            if (!rest) {
                throw new Error('Firestore REST client not available');
            }
            
            // Save to public collection: feedback/tickets/{ticketId}
            const collectionPath = `feedback/tickets`;
            
            await rest.setDocument(collectionPath, feedback.ticketId, {
                ...feedback,
                createdAt: new Date().toISOString()
            });
            
            console.log('Feedback saved via REST API:', `${collectionPath}/${feedback.ticketId}`);
        } catch (error) {
            console.error('Error saving to Firestore:', error);
            // Don't throw - we'll still save locally
        }
    }
    
    async getFeedbackByTicket(ticketId) {
        try {
            const networking = window.networking;
            const rest = networking?.getFirestoreREST();
            
            if (!rest) return null;
            
            // Get from public collection
            const collectionPath = `feedback/tickets`;
            const doc = await rest.getDocument(collectionPath, ticketId);
            
            return doc;
            
        } catch (error) {
            console.error('Error fetching feedback:', error);
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
            const rest = networking?.getFirestoreREST();
            
            if (!rest) {
                throw new Error('Firestore REST client not available');
            }
            
            // Get all tickets from public collection
            const result = await rest.listDocuments('feedback/tickets', { limit: 100 });
            const allTickets = result.documents || [];
            
            // Sort by creation date (newest first)
            allTickets.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.timestamp);
                const dateB = new Date(b.createdAt || b.timestamp);
                return dateB - dateA;
            });
            
            this.tickets = allTickets;
            this.displayTickets(allTickets);
            
        } catch (error) {
            console.error('Error loading tickets:', error);
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
                        </div>
                    </div>
                    <div class="ticket-item-title">${this.escapeHtml(ticket.title)}</div>
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
                    <textarea id="newCommentInput" class="comment-input" placeholder="Add a comment..."></textarea>
                    <button class="comment-submit-btn" onclick="feedback.addComment()">Post</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Load comments
        await this.loadComments(ticket);
    }
    
    async loadComments(ticket) {
        const commentsList = document.getElementById('commentsList');
        
        try {
            const comments = ticket.comments || [];
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<div class="empty-comments">No comments yet. Be the first to comment!</div>';
                return;
            }
            
            const commentsHtml = comments.map(comment => {
                const date = new Date(comment.timestamp);
                return `
                    <div class="comment-item">
                        <div class="comment-header">
                            <span class="comment-author">${comment.author}</span>
                            <span class="comment-time">${date.toLocaleString()}</span>
                        </div>
                        <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                    </div>
                `;
            }).join('');
            
            commentsList.innerHTML = commentsHtml;
            
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = '<div class="error-loading">Failed to load comments</div>';
        }
    }
    
    async addComment() {
        const input = document.getElementById('newCommentInput');
        const content = input.value.trim();
        
        if (!content || !this.currentTicket) return;
        
        try {
            const networking = window.networking;
            const rest = networking?.getFirestoreREST();
            
            if (!rest) {
                throw new Error('Firestore REST client not available');
            }
            
            const comment = {
                author: SM.scene.localUser.name || networking.getUserId(),
                content: content,
                timestamp: new Date().toISOString()
            };
            
            // Update the ticket with the new comment
            const updatedComments = [...(this.currentTicket.comments || []), comment];
            
            const collectionPath = `feedback/tickets`;
            await rest.setDocument(collectionPath, this.currentTicket.ticketId, {
                ...this.currentTicket,
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
            
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        }
    }
    
    async editTicket(ticketId) {
        const ticket = this.tickets.find(t => t.ticketId === ticketId);
        if (!ticket) return;
        
        // For now, just allow editing the status
        const newStatus = prompt('Enter new status (open/closed):', ticket.status);
        if (!newStatus || (newStatus !== 'open' && newStatus !== 'closed')) return;
        
        try {
            const networking = window.networking;
            const rest = networking?.getFirestoreREST();
            
            const collectionPath = `feedback/tickets`;
            await rest.setDocument(collectionPath, ticketId, {
                ...ticket,
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            
            // Update local data
            ticket.status = newStatus;
            this.displayTickets(this.tickets);
            
        } catch (error) {
            console.error('Error updating ticket:', error);
            alert('Failed to update ticket. Please try again.');
        }
    }
    
    async deleteTicket(ticketId) {
        if (!confirm('Are you sure you want to delete this ticket?')) return;
        
        const ticket = this.tickets.find(t => t.ticketId === ticketId);
        if (!ticket) return;
        
        try {
            const networking = window.networking;
            const rest = networking?.getFirestoreREST();
            
            const collectionPath = `feedback/tickets`;
            await rest.deleteDocument(collectionPath, ticketId);
            
            // Remove from local data
            this.tickets = this.tickets.filter(t => t.ticketId !== ticketId);
            this.displayTickets(this.tickets);
            
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('Failed to delete ticket. Please try again.');
        }
    }
}

// Add global function handlers
window.closeTicketModal = function() {
    document.getElementById('ticketDetailModal').style.display = 'none';
};