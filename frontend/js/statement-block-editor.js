export class StatementBlockEditor {
    constructor(options = {}) {
        this.blocks = [];
        this.originalTranscript = '';
        this.serviceUrl = options.serviceUrl || window.blockServiceUrl;
        this.onBlocksChanged = options.onBlocksChanged || (() => {});
        this.container = null;
        this.isProcessing = false;
    }
    
    async processTranscript(transcript) {
        if (!transcript || this.isProcessing) return [];
        
        this.isProcessing = true;
        this.originalTranscript = transcript;
        
        try {
            const response = await fetch(this.serviceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: transcript,
                    existing_blocks: this.blocks
                }),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`Service error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log("[block] result: ", result)
            this.blocks = result.blocks || [];
            this.onBlocksChanged(this.blocks);
            
            return this.blocks;
            
        } catch (error) {
            console.error('Block processing failed:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }
    
    renderBlocks(container) {
        if (!container) return;
        
        this.container = container;
        const blocksList = container.querySelector('#blocksList') || container;
        
        if (this.blocks.length === 0) {
            blocksList.innerHTML = '<div class="empty-blocks">No blocks to display</div>';
            return;
        }
        
        const blocksHtml = this.blocks.map((block, index) => `
            <div class="statement-block" data-block-index="${index}">
                <div class="block-content" contenteditable="true">${this.escapeHtml(block)}</div>
                <div class="block-actions">
                    <button class="block-delete" aria-label="Delete block">×</button>
                    <button class="block-drag" aria-label="Reorder block">⋮⋮</button>
                </div>
            </div>
        `).join('');
        
        blocksList.innerHTML = blocksHtml;
        
        // Attach event listeners
        this._attachBlockEventListeners(blocksList);
    }
    
    addBlock(content) {
        if (!content || typeof content !== 'string') return;
        
        this.blocks.push(content.trim());
        this.onBlocksChanged(this.blocks);
        
        if (this.container) {
            this.renderBlocks(this.container);
        }
    }
    
    updateBlock(index, content) {
        if (index < 0 || index >= this.blocks.length) return;
        
        this.blocks[index] = content.trim();
        this.onBlocksChanged(this.blocks);
    }
    
    deleteBlock(index) {
        if (index < 0 || index >= this.blocks.length) return;
        
        this.blocks.splice(index, 1);
        this.onBlocksChanged(this.blocks);
        
        if (this.container) {
            this.renderBlocks(this.container);
        }
    }
    
    reorderBlocks(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.blocks.length ||
            toIndex < 0 || toIndex >= this.blocks.length) return;
        
        const [movedBlock] = this.blocks.splice(fromIndex, 1);
        this.blocks.splice(toIndex, 0, movedBlock);
        this.onBlocksChanged(this.blocks);
        
        if (this.container) {
            this.renderBlocks(this.container);
        }
    }
    
    getBlocks() {
        return [...this.blocks];
    }
    
    getRawTranscript() {
        return this.originalTranscript;
    }
    
    clear() {
        this.blocks = [];
        this.originalTranscript = '';
        this.isProcessing = false;
        this.onBlocksChanged(this.blocks);
        
        if (this.container) {
            this.renderBlocks(this.container);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    _attachBlockEventListeners(blocksList) {
        // Content editing
        blocksList.querySelectorAll('.block-content').forEach(content => {
            content.addEventListener('blur', (e) => {
                const index = parseInt(e.target.closest('.statement-block').dataset.blockIndex);
                this.updateBlock(index, e.target.textContent);
            });
            
            // Prevent newline on Enter
            content.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });
        
        // Delete buttons
        blocksList.querySelectorAll('.block-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.statement-block').dataset.blockIndex);
                if (confirm('Delete this block?')) {
                    this.deleteBlock(index);
                }
            });
        });
        
        // Drag functionality (placeholder for now)
        blocksList.querySelectorAll('.block-drag').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Drag reordering not implemented yet');
            });
        });
    }
    
    // Save draft to localStorage
    saveDraft() {
        const draft = {
            originalTranscript: this.originalTranscript,
            blocks: this.blocks,
            lastModified: Date.now(),
            mode: 'blocks'
        };
        
        localStorage.setItem('feedback_block_draft', JSON.stringify(draft));
    }
    
    // Load draft from localStorage
    loadDraft() {
        const draftStr = localStorage.getItem('feedback_block_draft');
        if (!draftStr) return null;
        
        try {
            const draft = JSON.parse(draftStr);
            this.originalTranscript = draft.originalTranscript || '';
            this.blocks = draft.blocks || [];
            return draft;
        } catch (error) {
            console.error('Failed to load draft:', error);
            return null;
        }
    }
    
    // Clear draft from localStorage
    clearDraft() {
        localStorage.removeItem('feedback_block_draft');
    }
}