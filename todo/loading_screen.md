# Loading Screen Implementation Plan

## Overview
Implement a loading screen that displays during the Unity Scene Inspector initialization, providing visual feedback about the current loading stage and progress.

## Current Initialization Flow Analysis

### Key Stages Identified:
1. **Initial DOM Load** - HTML and CSS resources loading
2. **Module Import Phase** - Dynamic ES6 module imports (22 modules total)
3. **BS Library Wait** - Waiting for BanterScript library injection from Unity
4. **Scene Connection** - Establishing connection with Unity scene via BS.BanterScene
5. **Component Registration** - Loading and registering all component definitions
6. **Scene Hierarchy Gathering** - Fetching full GameObject hierarchy from Unity
7. **Entity Generation** - Creating entity instances for each GameObject
8. **Component Processing** - Processing all components for each entity
9. **UI Panel Initialization** - Creating all UI panel instances
10. **Event Handler Setup** - Wiring up all event listeners
11. **Initial Render** - First render of hierarchy and properties panels
12. **Firebase/Networking Setup** - Initializing multiplayer sync capabilities

## Design Specifications

### Visual Design
- **Full-screen overlay** with semi-transparent dark background (rgba(0,0,0,0.95))
- **Centered loading container** (600px wide, auto height)
- **Progress bar** with smooth animations and gradient fill
- **Stage indicator text** showing current activity
- **Percentage display** showing overall progress
- **Animated spinner/icon** for visual appeal
- **Subtle pulse animation** on the loading container

### UI Components
1. **LoadingScreen class** - Main controller
2. **Progress bar** - Visual progress indicator
3. **Status text** - Current stage description
4. **Percentage counter** - Numerical progress
5. **Sub-status text** - Detailed information (e.g., "Loading component 5 of 12")
6. **Error state** - Display initialization failures gracefully

## Implementation Architecture

### 1. Create LoadingScreen Module (`frontend/js/loading-screen.js`)
```javascript
export class LoadingScreen {
    constructor() {
        this.stages = [
            { id: 'dom', label: 'Initializing application...', weight: 5 },
            { id: 'modules', label: 'Loading modules...', weight: 15 },
            { id: 'bs-wait', label: 'Waiting for BanterScript library...', weight: 10 },
            { id: 'scene-connect', label: 'Connecting to Unity scene...', weight: 10 },
            { id: 'components', label: 'Registering components...', weight: 10 },
            { id: 'hierarchy', label: 'Gathering scene hierarchy...', weight: 15 },
            { id: 'entities', label: 'Generating entities...', weight: 15 },
            { id: 'ui-panels', label: 'Initializing UI panels...', weight: 10 },
            { id: 'events', label: 'Setting up event handlers...', weight: 5 },
            { id: 'render', label: 'Rendering interface...', weight: 5 }
        ];
        
        this.currentStage = 0;
        this.subProgress = 0;
        this.element = null;
    }
    
    show() { /* Create and display loading screen */ }
    hide() { /* Animate out and remove */ }
    updateStage(stageId, subProgress = 0, subText = '') { /* Update progress */ }
    setError(message) { /* Show error state */ }
    calculateProgress() { /* Calculate weighted progress percentage */ }
}
```

### 2. HTML Structure (add to index.html)
```html
<div id="loadingScreen" class="loading-screen">
    <div class="loading-container">
        <div class="loading-logo">
            <!-- Animated Unity/Banter logo or spinner -->
        </div>
        <h2 class="loading-title">Unity Scene Inspector</h2>
        <div class="loading-progress-container">
            <div class="loading-progress-bar">
                <div class="loading-progress-fill"></div>
            </div>
            <div class="loading-percentage">0%</div>
        </div>
        <div class="loading-status">Initializing...</div>
        <div class="loading-substatus"></div>
    </div>
</div>
```

### 3. CSS Styling (add to styles.css)
```css
.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(10px);
}

.loading-container {
    width: 600px;
    padding: 40px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: pulseGlow 2s ease-in-out infinite;
}

.loading-progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin: 20px 0;
}

.loading-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00d4ff, #0099ff);
    border-radius: 3px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}
```

## Integration Points

### 1. Modify `app.js`
- Import LoadingScreen at the top
- Create instance before initialization
- Update progress at each initialization stage
- Hide on completion or error

### 2. Modify `scene-manager.js`
- Add progress callbacks during `gatherSceneHierarchy()`
- Report entity generation progress
- Update during component processing

### 3. Add Progress Hooks
```javascript
// In app.js initialize()
loadingScreen.updateStage('modules', 100, 'All modules loaded');

// In scene-manager.js
this.onHierarchyProgress = (current, total) => {
    loadingScreen.updateStage('hierarchy', (current/total) * 100, 
        `Processing GameObject ${current} of ${total}`);
};
```

## Progress Calculation

### Weighted Progress System
- Each stage has a weight representing its relative duration
- Total progress = sum of (completed stage weights + current stage weight * stage progress) / total weight
- Smooth transitions between stages using CSS transitions

### Progress Reporting
- Module loading: Track imported modules (1-22)
- Hierarchy: Report entities processed vs total
- Components: Track components registered
- BS Library: Use timeout with retry indication

## Error Handling

### Timeout Handling
- BS Library timeout: 10 seconds with retry option
- Scene connection timeout: 5 seconds
- Show "Retry" and "Continue without Unity" options

### Error Display
- Clear error message
- Suggested actions
- Option to view detailed error log
- Fallback to mock data option

## Implementation Steps

1. **Create loading-screen.js module** with LoadingScreen class
2. **Add HTML structure** to index.html (initially hidden)
3. **Add CSS styles** for loading screen components
4. **Integrate into app.js** initialization flow
5. **Add progress hooks** to scene-manager.js
6. **Add progress tracking** to module imports
7. **Implement error states** and retry logic
8. **Add smooth hide animation** on completion
9. **Test with various network speeds** and Unity states
10. **Add accessibility** (ARIA labels, keyboard support)

## Testing Scenarios

1. Normal load with Unity connected
2. Load without Unity (BS library unavailable)
3. Slow network (module loading delays)
4. Large scene hierarchy (many GameObjects)
5. Component registration failures
6. Firebase connection issues
7. User interruption/reload during load

## Performance Considerations

- Use requestAnimationFrame for smooth progress updates
- Debounce rapid progress updates
- Lazy load heavy resources after initial display
- Minimize blocking operations during load
- Use CSS animations instead of JavaScript where possible

## Future Enhancements

1. **Load time analytics** - Track and report typical load times
2. **Cached state detection** - Skip stages when using cached data
3. **Background preloading** - Start loading resources before showing screen
4. **Customizable themes** - Different loading screen styles
5. **Debug mode** - Detailed timing information for each stage
6. **Progressive enhancement** - Show partial UI as components load