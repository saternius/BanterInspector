import { confirm } from '../../utils.js';

export class StatementBlockEditor {
    constructor(options = {}) {
        this.blocks = [];
        this.originalTranscript = '';
        this.serviceUrl = options.serviceUrl || window.blockServiceUrl;
        this.onBlocksChanged = options.onBlocksChanged || (() => {});
        this.container = null;
        this.isProcessing = false;
        this.mergeModalCreated = false;
        this.pendingMerge = null;
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
                    intent:"The speaker is submitting in a feedback ticketing form for a VR creator tool project",
                    text: transcript,
                    existing_blocks: this.blocks
                }),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`Service error: ${response.status}`);
            }
            
            const result = await response.json();
            log("inspector", "[block] result: ", result)
            this.blocks = result.blocks || [];
            this.onBlocksChanged(this.blocks);
            
            return this.blocks;
            
        } catch (error) {
            err("inspector", 'Block processing failed:', error);
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
        
        // Add drop zones between blocks and at the beginning
        let blocksHtml = '<div class="block-drop-zone" data-drop-index="0"></div>';
        
        this.blocks.forEach((block, index) => {
            blocksHtml += `
                <div class="statement-block" data-block-index="${index}">
                    <div class="block-content" contenteditable="true">${this.escapeHtml(block)}</div>
                    <div class="block-actions">
                        <button class="block-delete" aria-label="Delete block">×</button>
                        <div class="block-drag" aria-label="Reorder block" role="button" tabindex="0">⋮⋮</div>
                    </div>
                </div>
                <div class="block-drop-zone" data-drop-index="${index + 1}"></div>
            `;
        });
        
        blocksList.innerHTML = blocksHtml;
        
        // Create merge modal if it doesn't exist
        this._createMergeModal();
        
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
            toIndex < 0 || toIndex > this.blocks.length) return;
        
        const [movedBlock] = this.blocks.splice(fromIndex, 1);
        
        // Adjust toIndex if needed after removal
        if (toIndex > fromIndex) {
            toIndex--;
        }
        
        this.blocks.splice(toIndex, 0, movedBlock);
        this.onBlocksChanged(this.blocks);
        
        if (this.container) {
            this.renderBlocks(this.container);
        }
    }
    
    mergeBlocks(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.blocks.length ||
            toIndex < 0 || toIndex >= this.blocks.length ||
            fromIndex === toIndex) return;
        
        // Combine the content of both blocks
        const mergedContent = this.blocks[toIndex] + '\n\n' + this.blocks[fromIndex];
        
        // Update the target block and remove the source block
        this.blocks[toIndex] = mergedContent;
        this.blocks.splice(fromIndex, 1);
        
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
    
    _createMergeModal() {
        if (this.mergeModalCreated) return;
        
        // Check if modal already exists in DOM
        if (document.getElementById('blockMergeModal')) {
            this.mergeModalCreated = true;
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'blockMergeModal';
        modal.className = 'block-merge-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Merge Blocks?</h3>
                </div>
                <div class="modal-body">
                    <p>Do you want to merge these two blocks together?</p>
                    <div class="merge-preview">
                        <div class="merge-preview-block" id="mergeTargetPreview"></div>
                        <div class="merge-arrow">+</div>
                        <div class="merge-preview-block" id="mergeSourcePreview"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-primary" id="confirmMergeBtn">Merge</button>
                    <button class="modal-btn modal-btn-secondary" id="cancelMergeBtn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('confirmMergeBtn').addEventListener('mousedown', () => {
            this._confirmMerge();
        });
        
        document.getElementById('cancelMergeBtn').addEventListener('mousedown', () => {
            this._cancelMerge();
        });
        
        // Close on outside click
        modal.addEventListener('mousedown', (e) => {
            if (e.target === modal) {
                this._cancelMerge();
            }
        });
        
        this.mergeModalCreated = true;
    }
    
    _showMergeModal(sourceIndex, targetIndex) {
        this.pendingMerge = { sourceIndex, targetIndex };
        
        const modal = document.getElementById('blockMergeModal');
        const sourcePreview = document.getElementById('mergeSourcePreview');
        const targetPreview = document.getElementById('mergeTargetPreview');
        
        // Show preview of blocks to be merged
        const sourceText = this.blocks[sourceIndex];
        const targetText = this.blocks[targetIndex];
        
        sourcePreview.textContent = sourceText.length > 100 ? 
            sourceText.substring(0, 100) + '...' : sourceText;
        targetPreview.textContent = targetText.length > 100 ? 
            targetText.substring(0, 100) + '...' : targetText;
        
        modal.style.display = 'flex';
    }
    
    _confirmMerge() {
        if (this.pendingMerge) {
            this.mergeBlocks(this.pendingMerge.sourceIndex, this.pendingMerge.targetIndex);
            this.pendingMerge = null;
        }
        document.getElementById('blockMergeModal').style.display = 'none';
    }
    
    _cancelMerge() {
        this.pendingMerge = null;
        document.getElementById('blockMergeModal').style.display = 'none';
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
            btn.addEventListener('mousedown', async (e) => {
                const index = parseInt(e.target.closest('.statement-block').dataset.blockIndex);
                if (await confirm('Delete this block?')) {
                    this.deleteBlock(index);
                }
            });
        });
        
        // Drag functionality
        this._setupDragAndDrop(blocksList);
    }
    
    _setupDragAndDrop(blocksList) {
        let draggedElement = null;
        let draggedIndex = null;
        let dropTarget = null;
        
        // Make drag handles draggable
        blocksList.querySelectorAll('.statement-block').forEach(block => {
            const dragHandle = block.querySelector('.block-drag');
            
            // Ensure block is not draggable, only the handle
            block.draggable = false;
            
            // Make the drag handle draggable
            dragHandle.draggable = true;
            
            // Drag handle events
            dragHandle.addEventListener('dragstart', (e) => {
                draggedElement = block;
                draggedIndex = parseInt(block.dataset.blockIndex);
                block.classList.add('dragging');
                
                // Set drag effect
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedIndex.toString());
                
                // Show drop zones
                blocksList.querySelectorAll('.block-drop-zone').forEach(zone => {
                    zone.classList.add('active');
                });
                
                // Stop event from bubbling to prevent issues
                e.stopPropagation();
            });
            
            dragHandle.addEventListener('dragend', (e) => {
                if (draggedElement) {
                    draggedElement.classList.remove('dragging');
                }
                
                // Remove any drag-over classes and hide drop zones
                blocksList.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
                blocksList.querySelectorAll('.block-drop-zone').forEach(zone => {
                    zone.classList.remove('active', 'drag-over');
                });
                
                draggedElement = null;
                draggedIndex = null;
                dropTarget = null;
            });
            
            // Block dragover for merge functionality
            block.addEventListener('dragover', (e) => {
                if (!draggedElement || block === draggedElement) return;
                
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                // Visual feedback for merge
                block.classList.add('drag-over');
                dropTarget = { type: 'merge', element: block };
                
                return false;
            });
            
            // Block drop for merge functionality
            block.addEventListener('drop', (e) => {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                
                if (draggedElement && block !== draggedElement) {
                    const targetIndex = parseInt(block.dataset.blockIndex);
                    
                    // Show merge confirmation modal
                    this._showMergeModal(draggedIndex, targetIndex);
                }
                
                return false;
            });
            
            block.addEventListener('dragleave', (e) => {
                // Only remove drag-over if we're actually leaving the block
                if (!block.contains(e.relatedTarget)) {
                    block.classList.remove('drag-over');
                    if (dropTarget && dropTarget.element === block) {
                        dropTarget = null;
                    }
                }
            });
        });
        
        // Setup drop zones for reordering
        blocksList.querySelectorAll('.block-drop-zone').forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                if (!draggedElement) return;
                
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                // Clear other highlights
                blocksList.querySelectorAll('.drag-over').forEach(el => {
                    if (el !== zone) el.classList.remove('drag-over');
                });
                
                zone.classList.add('drag-over');
                dropTarget = { type: 'reorder', element: zone };
                
                return false;
            });
            
            zone.addEventListener('drop', (e) => {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                
                if (draggedElement) {
                    const dropIndex = parseInt(zone.dataset.dropIndex);
                    
                    // Perform the reorder
                    this.reorderBlocks(draggedIndex, dropIndex);
                }
                
                return false;
            });
            
            zone.addEventListener('dragleave', (e) => {
                zone.classList.remove('drag-over');
                if (dropTarget && dropTarget.element === zone) {
                    dropTarget = null;
                }
            });
        });
        
        // Prevent default drag behavior on document
        document.addEventListener('dragover', (e) => {
            if (draggedElement) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('drop', (e) => {
            if (draggedElement) {
                e.preventDefault();
            }
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
            err("inspector", 'Failed to load draft:', error);
            return null;
        }
    }
    
    // Clear draft from localStorage
    clearDraft() {
        localStorage.removeItem('feedback_block_draft');
    }
}