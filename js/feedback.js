export class Feedback {
    constructor() {
        this.selectedType = 'feature';
        this.init();
    }
    
    init() {
        this.setupTypeButtons();
        this.setupSubmitButton();
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
    
    async submitFeedback() {
        const title = document.getElementById('feedbackTitle').value.trim();
        const details = document.getElementById('feedbackDetails').value.trim();
        const email = document.getElementById('feedbackEmail').value.trim();
        
        if (!title || !details) {
            this.showStatus('Please provide both a title and details', 'error');
            return;
        }
        
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
            // For now, we'll store feedback locally and show instructions
            // In production, this would send to an API endpoint
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
            document.getElementById('feedbackTitle').value = '';
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