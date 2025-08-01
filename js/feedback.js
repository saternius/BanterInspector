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
        this.speechBuffer = document.getElementById('feedbackDetails').value;
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
        const email = document.getElementById('feedbackEmail').value.trim();
        
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
            email,
            timestamp: new Date().toISOString(),
            inspector_version: '1.0.0',
            user_agent: navigator.userAgent
        };
        
        try {
            this.storeFeedbackLocally(feedback);
            
            // Create GitHub issue URL
            const issueTitle = `[${this.selectedType}] ${title}`;
            const issueBody = this.formatGitHubIssue(feedback);
            const githubUrl = `https://github.com/saternius/BanterInspector/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
            
            this.showStatus(
                `Thank you for your feedback! <a href="${githubUrl}" target="_blank">Click here to create a GitHub issue</a>`,
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
    
    storeFeedbackLocally(feedback) {
        const feedbackHistory = JSON.parse(localStorage.getItem('inspector_feedback') || '[]');
        feedbackHistory.push(feedback);
        localStorage.setItem('inspector_feedback', JSON.stringify(feedbackHistory));
    }
    
    formatGitHubIssue(feedback) {
        let body = `**Type:** ${feedback.type}\n\n`;
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
}