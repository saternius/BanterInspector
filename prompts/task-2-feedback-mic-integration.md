# Task 2: Feedback Mic Statement Block Integration

## Objective
Integrate the statement block processing microservice into the existing feedback system's mic input flow, allowing users to refine their voice input into structured blocks before submission.

## Context
- The feedback system already exists in `js/feedback.js`
- It uses Azure Speech SDK for voice recognition
- A microservice will be available at a configurable URL that processes text into statement blocks
- The microservice API expects `{text: string, existing_blocks: string[]}` and returns `{blocks: string[], processing_time_ms: number}`

## Deliverables

### 1. Create StatementBlockEditor Class
Create a new file `js/statement-block-editor.js` with:

```javascript
export class StatementBlockEditor {
    constructor(options = {}) {
        this.blocks = [];
        this.originalTranscript = '';
        this.serviceUrl = options.serviceUrl || 'http://localhost:5000/process-text';
        this.onBlocksChanged = options.onBlocksChanged || (() => {});
        this.container = null;
        this.isProcessing = false;
    }
    
    // Core methods to implement:
    async processTranscript(transcript) { }
    renderBlocks(container) { }
    addBlock(content) { }
    updateBlock(index, content) { }
    deleteBlock(index) { }
    reorderBlocks(fromIndex, toIndex) { }
    getBlocks() { }
    getRawTranscript() { }
    clear() { }
}
```

### 2. Modify feedback.js Integration Points

#### Add to constructor:
```javascript
this.statementBlockEditor = null;
this.useBlockMode = true; // Feature flag
this.blockEditorContainer = null;
```

#### Modify stopRecording method:
- After recording stops, check if block mode is enabled
- If enabled, show processing UI and send transcript to block editor
- Display block editor interface instead of raw transcript

#### Add new UI states:
- RECORDING → PROCESSING → BLOCK_EDITING → READY_TO_SUBMIT
- Add visual indicators for each state

### 3. UI Components to Create

#### Block Editor Container
```html
<div id="blockEditorContainer" class="block-editor-container" style="display: none;">
    <div class="block-editor-header">
        <h3>Refine Your Feedback</h3>
        <button class="toggle-view-btn">View Original</button>
    </div>
    <div class="block-editor-content">
        <div id="blocksList" class="blocks-list">
            <!-- Blocks will be rendered here -->
        </div>
        <div class="block-editor-actions">
            <button id="addMoreBtn" class="add-more-btn">
                <span class="mic-icon">🎤</span> Add More
            </button>
        </div>
    </div>
    <div class="original-transcript" style="display: none;">
        <h4>Original Transcript</h4>
        <div id="originalText"></div>
    </div>
</div>
```

#### Individual Block Structure
```html
<div class="statement-block" data-block-index="0">
    <div class="block-content" contenteditable="true">
        Block content here...
    </div>
    <div class="block-actions">
        <button class="block-delete" aria-label="Delete block">×</button>
        <button class="block-drag" aria-label="Reorder block">⋮⋮</button>
    </div>
</div>
```

### 4. CSS Styling Requirements

Add to `styles.css` or create `statement-blocks.css`:

```css
.block-editor-container {
    margin: 20px 0;
    background: #2a2a2a;
    border-radius: 8px;
    padding: 20px;
}

.statement-block {
    background: #333;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 10px;
    position: relative;
    transition: all 0.2s ease;
}

.statement-block:hover {
    border-color: #666;
    transform: translateY(-1px);
}

.statement-block.dragging {
    opacity: 0.5;
}

.block-content {
    color: #e0e0e0;
    line-height: 1.5;
    min-height: 50px;
    padding-right: 60px;
}

.block-content:focus {
    outline: 1px solid #4CAF50;
    outline-offset: 2px;
}

.processing-overlay {
    text-align: center;
    padding: 40px;
}

.processing-spinner {
    /* Add spinner animation */
}
```

### 5. Interaction Flows to Implement

#### Processing Flow
1. User stops recording
2. Show "Processing your feedback..." with progress indicator
3. Call microservice with transcript
4. On success: Display blocks in editor
5. On failure: Show error, offer to use raw transcript

#### Block Editing
1. **Inline editing**: Click block to edit, blur to save
2. **Delete**: Click X to remove block with confirmation
3. **Reorder**: Drag handle to reorder (optional for MVP)
4. **Add more**: Click mic to record additional content

#### Submission Flow
1. User clicks submit
2. Choose between blocks or original transcript
3. Format blocks into final feedback text
4. Submit using existing feedback submission logic

### 6. JavaScript Functionality

#### Key Event Handlers
```javascript
// Block editing
blockContent.addEventListener('blur', (e) => {
    const index = parseInt(e.target.closest('.statement-block').dataset.blockIndex);
    this.statementBlockEditor.updateBlock(index, e.target.textContent);
});

// Block deletion
deleteBtn.addEventListener('click', (e) => {
    const index = parseInt(e.target.closest('.statement-block').dataset.blockIndex);
    if (confirm('Delete this block?')) {
        this.statementBlockEditor.deleteBlock(index);
        this.renderBlocks();
    }
});

// Add more content
addMoreBtn.addEventListener('click', () => {
    this.startRecording();
    this.isAddingToBlocks = true;
});
```

#### Error Handling
```javascript
async processWithFallback(transcript) {
    try {
        this.showProcessingUI();
        const blocks = await this.statementBlockEditor.processTranscript(transcript);
        this.hideProcessingUI();
        this.showBlockEditor(blocks);
    } catch (error) {
        console.error('Block processing failed:', error);
        this.hideProcessingUI();
        this.showFallbackOption(transcript);
    }
}
```

### 7. State Management

#### Local Storage
- Save draft blocks to localStorage
- Key: `feedback_block_draft`
- Clear on successful submission
- Restore on page reload if draft exists

#### State Object
```javascript
{
    originalTranscript: string,
    blocks: string[],
    lastModified: timestamp,
    mode: 'blocks' | 'raw'
}
```

### 8. Feature Flags

Add configuration options:
```javascript
const BLOCK_EDITOR_CONFIG = {
    enabled: true,
    serviceUrl: 'http://localhost:5000/process-text',
    autoProcess: true,
    showOriginalToggle: true,
    maxBlockLength: 500,
    confirmDelete: true,
    enableReordering: false, // Phase 2
    saveDrafts: true
};
```

### 9. Testing Requirements

#### Manual Testing Checklist
- [ ] Record speech and verify block processing
- [ ] Edit blocks inline and verify changes persist
- [ ] Delete blocks and verify removal
- [ ] Add additional content to existing blocks
- [ ] Toggle between blocks and original view
- [ ] Submit blocks and verify correct formatting
- [ ] Test error scenarios (service down, timeout)
- [ ] Verify mobile responsiveness
- [ ] Test keyboard navigation

#### Edge Cases to Handle
- Empty transcript
- Very long transcript (> 5000 chars)
- Service timeout or error
- Network disconnection during processing
- Multiple rapid recordings
- Editing while processing

### 10. Integration Points

#### With Existing Feedback System
1. Hook into `stopRecording()` method
2. Reuse existing Azure Speech recognition
3. Maintain compatibility with direct text input
4. Use existing submission logic
5. Preserve existing UI when block mode disabled

#### API Integration
```javascript
async callBlockService(text, existingBlocks = []) {
    const response = await fetch(this.serviceUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            existing_blocks: existingBlocks
        }),
        timeout: 10000 // 10 second timeout
    });
    
    if (!response.ok) {
        throw new Error(`Service error: ${response.status}`);
    }
    
    return await response.json();
}
```

### 11. Accessibility Requirements

- Keyboard navigation between blocks
- Screen reader announcements for actions
- ARIA labels for all buttons
- Focus management when adding/deleting blocks
- High contrast mode support

### 12. Performance Considerations

- Debounce block edits (300ms)
- Lazy render blocks if > 20
- Cache service responses for identical inputs
- Show skeleton UI while processing
- Progressive enhancement if JS fails

## Example Implementation Flow

### User Records Feedback
1. "The hierarchy panel doesn't update when I delete objects and also it would be cool to have copy paste for components"

### Service Returns Blocks
```json
{
    "blocks": [
        "The hierarchy panel doesn't update when deleting objects.",
        "Feature request: Add copy/paste functionality for components."
    ],
    "processing_time_ms": 1234
}
```

### User Sees Editor
```
┌─────────────────────────────────────────┐
│ Refine Your Feedback    [View Original] │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────┐     │
│ │ The hierarchy panel doesn't     │ [X] │
│ │ update when deleting objects.   │ [⋮⋮]│
│ └─────────────────────────────────┘     │
│                                         │
│ ┌─────────────────────────────────┐     │
│ │ Feature request: Add copy/paste │ [X] │
│ │ functionality for components.   │ [⋮⋮]│
│ └─────────────────────────────────┘     │
│                                         │
│        [🎤 Add More]                    │
│                                         │
│ [Submit Refined] [Submit Original]      │
└─────────────────────────────────────────┘
```

### Final Submission
The formatted blocks are submitted as the feedback content, maintaining the improved clarity and organization.

## Success Criteria

1. Seamless integration with existing feedback flow
2. Processing completes within 3 seconds for typical input
3. Intuitive block editing interface
4. Graceful fallback for service failures
5. No disruption to existing feedback functionality
6. Mobile-responsive design
7. Accessible to keyboard and screen reader users
8. Clear value proposition to users (better organized feedback)