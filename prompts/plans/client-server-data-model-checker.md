# Client-Server Data Model Divergence Checker

## Overview
A visualization tool to identify and resolve divergences between the local Unity scene hierarchy (`entities()`) and the networked state (`networking.getSpaceHeir()`). This tool will help developers quickly spot synchronization issues and maintain consistency across multiplayer sessions.

## UX Design Decision

After analyzing the existing space-props-panel.js implementation and considering various approaches, the optimal UX solution is a **Hybrid Sync Status Mode** that combines the benefits of a dedicated view with inline indicators.

### Why This Approach?

1. **Discoverability**: A dedicated "Sync Status" button makes the feature obvious
2. **Context**: Shows divergences within the familiar tree structure
3. **Efficiency**: Only highlights problems, reducing cognitive load
4. **Actionability**: Provides immediate resolution options

## Implementation Architecture

### 1. New View Mode: "Sync Status"

Add a third view mode button to the space properties panel:
- 📋 Flat (existing)
- 🌳 Struct (existing)
- **🔄 Sync Status** (new)

### 2. Visual Design

#### Tree Structure
```
Scene 🟢 (synced)
├─ Ground ⚠️ (has divergences)
│  ├─ Sigil 🟢
│  └─ GroundMesh 🔴 (active: local=false, network=true)
├─ PhysicsButtonKin_VS 🟢
└─ ...

People 🟢
├─ Meeqa 🟡 (only in local)
│  └─ Trackers 🟢
└─ Technocrat 🟢
```

#### Status Indicators
- 🟢 **Green**: Fully synchronized
- 🟡 **Yellow**: Only exists in one model
- 🔴 **Red**: Property conflicts
- ⚠️ **Warning**: Has child divergences
- 🔵 **Blue**: Component differences

### 3. Divergence Categories

#### Category 1: Existence Divergences
- **Missing in Network**: Entity exists locally but not in networked state
- **Missing Locally**: Entity exists in network but not in local scene
- **Visual**: Yellow background, dashed border

#### Category 2: Property Divergences
- **Active State**: Different active/enabled states
- **Transform**: Position, rotation, scale mismatches
- **Layer**: Different layer assignments
- **Visual**: Red highlights on specific properties

#### Category 3: Component Divergences
- **Component Count**: Different number of components
- **Component Types**: Missing or extra components
- **Component Properties**: Same component, different settings
- **Visual**: Blue indicators with count badges

#### Category 4: Hierarchy Divergences
- **Child Count**: Different number of children
- **Child Order**: Children in different order
- **Parent Mismatch**: Different parent assignments
- **Visual**: Orange tree lines

## Technical Implementation

### Phase 1: Data Comparison Engine
Create `sync-status-comparator.js`:

```javascript
class SyncStatusComparator {
    constructor() {
        this.localCache = null;
        this.networkCache = null;
        this.divergences = new Map();
    }

    async compare() {
        // Get both hierarchies
        this.localCache = entities();
        this.networkCache = networking.getSpaceHeir();

        // Build comparison maps
        const comparison = this.buildComparison();

        // Categorize divergences
        this.categorizeDivergences(comparison);

        return this.divergences;
    }

    buildComparison() {
        // Deep comparison logic
        // Returns structured diff object
    }

    categorizeDivergences(comparison) {
        // Categorize by type and severity
        // Populate this.divergences Map
    }
}
```

### Phase 2: UI Integration
Extend `SpacePropsPanel` class:

```javascript
// Add to constructor
this.syncComparator = new SyncStatusComparator();
this.viewMode = 'flat'; // existing modes: 'flat', 'struct', 'sync'

// New method for sync view rendering
renderSyncView(type, props, isPopup = false) {
    const divergences = await this.syncComparator.compare();
    // Render unified tree with divergence indicators
}

// Add sync status badge to each node
renderSyncStatusBadge(entityPath, divergence) {
    // Returns HTML for status indicator
}
```

### Phase 3: Resolution Actions
Add quick-fix buttons for common divergences:

1. **"Push to Network"**: Update network state with local values
2. **"Pull from Network"**: Update local scene with network values
3. **"Ignore"**: Mark divergence as intentional
4. **"Auto-Sync"**: Continuously sync specific properties

### Phase 4: Real-time Monitoring
- Subscribe to both local and network change events
- Update divergence indicators in real-time
- Show notifications for new divergences
- Optional sound/visual alerts for critical divergences

## File Structure

```
frontend/js/
├── pages/
│   └── world-inspector/
│       ├── space-props-panel.js (modify)
│       ├── sync-status-comparator.js (new)
│       └── sync-status-ui.js (new)
└── styles/
    └── sync-status.css (new)
```

## CSS Styling

```css
/* Divergence indicators */
.sync-status-synced {
    background: rgba(34, 197, 94, 0.1);
}

.sync-status-local-only {
    background: rgba(251, 191, 36, 0.1);
    border: 1px dashed #fbbf24;
}

.sync-status-conflict {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
}

.sync-status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 11px;
    margin-left: 8px;
}

/* Animated pulse for active divergences */
@keyframes divergence-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.sync-status-active-divergence {
    animation: divergence-pulse 2s infinite;
}
```

## Performance Considerations

1. **Caching**: Cache comparison results, update incrementally
2. **Throttling**: Limit comparison frequency (max once per 500ms)
3. **Virtual Scrolling**: For large hierarchies, implement virtual scrolling
4. **Lazy Loading**: Expand and compare nodes on-demand
5. **Web Worker**: Move heavy comparison logic to Web Worker if needed

## User Settings

Add preferences to localStorage:
- `syncStatusAutoRefresh`: Auto-refresh interval (default: 1000ms)
- `syncStatusShowResolved`: Show/hide resolved divergences
- `syncStatusAlertLevel`: Notification threshold (none/critical/all)
- `syncStatusExpandDivergences`: Auto-expand nodes with divergences

## Testing Strategy

1. **Unit Tests**: Test comparison logic with mock data
2. **Integration Tests**: Test with real Unity scenes
3. **Edge Cases**:
   - Empty scenes
   - Deeply nested hierarchies (>10 levels)
   - Circular references
   - Rapid changes
   - Network disconnections

## Future Enhancements

1. **Divergence History**: Track when divergences occurred
2. **Batch Resolution**: Resolve multiple divergences at once
3. **Sync Profiles**: Save different sync configurations
4. **Collaborative Resolution**: See what other users are fixing
5. **AI Suggestions**: ML-based recommendations for resolving conflicts
6. **Export Reports**: Generate divergence reports for debugging

## Migration Path

1. **Phase 1**: Implement core comparison engine (Week 1)
2. **Phase 2**: Add basic UI with manual refresh (Week 2)
3. **Phase 3**: Add resolution actions (Week 3)
4. **Phase 4**: Real-time monitoring and polish (Week 4)

## Success Metrics

- **Discovery Rate**: % of users who find and use the feature
- **Resolution Time**: Average time to resolve divergences
- **Error Reduction**: Decrease in sync-related bugs
- **User Satisfaction**: Feedback on usefulness

## Conclusion

This implementation provides a powerful yet intuitive way to identify and resolve data model divergences. By integrating seamlessly with the existing struct view and providing clear visual feedback, developers can maintain consistent state across all clients in their multiplayer VR experiences.