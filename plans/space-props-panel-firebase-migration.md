# Space Properties Panel Firebase Migration Plan

## Overview
Refactor `frontend/js/pages/world-inspector/space-props-panel.js` to work directly with Firebase `/vars` instead of the deprecated spaceState system. This will complete the Firebase migration for space properties management.

## Current Architecture Analysis

### Current Implementation
1. **Data Source**: Currently references `SM.scene.spaceState` (line 648)
2. **State Management**: Uses `net.state` object that's populated from Firebase
3. **Property Storage**: Properties are stored but not directly synced with Firebase listeners
4. **Events**: Listens to `spaceStateChanged` events (line 564-565)
5. **CRUD Operations**: Uses `SpacePropertyChange` class but doesn't directly interact with Firebase

### Issues with Current Implementation
- Indirect Firebase access through intermediate state objects
- No real-time Firebase listeners for property changes
- Relies on legacy event system (`spaceStateChanged`)
- Mixed patterns between old spaceState and new Firebase approach

## Migration Strategy

### Phase 1: Firebase Integration Setup

#### 1.1 Direct Firebase Access
Replace indirect state access with direct Firebase operations:
```javascript
// OLD
const props = SM.scene.spaceState?.public || {};

// NEW
const props = await net.getDatabase().ref(`space/${net.spaceId}/vars`).once('value');
```

#### 1.2 Real-time Listeners
Set up Firebase listeners for live updates:
```javascript
class SpacePropsPanel {
    constructor() {
        // ... existing code ...
        this.firebaseListeners = new Map();
        this.setupFirebaseListeners();
    }

    setupFirebaseListeners() {
        const varsRef = net.getDatabase().ref(`space/${net.spaceId}/vars`);

        // Listen for any changes to vars
        varsRef.on('value', (snapshot) => {
            this.handleVarsUpdate(snapshot.val());
        });

        // Listen for individual property changes
        varsRef.on('child_added', (snapshot) => {
            this.handlePropertyAdded(snapshot.key, snapshot.val());
        });

        varsRef.on('child_changed', (snapshot) => {
            this.handlePropertyChanged(snapshot.key, snapshot.val());
        });

        varsRef.on('child_removed', (snapshot) => {
            this.handlePropertyRemoved(snapshot.key);
        });
    }
}
```

### Phase 2: Refactor Data Access Methods

#### 2.1 Property Categorization
Since Firebase `/vars` is a flat structure, we need to implement client-side categorization:
```javascript
categorizeProperties(vars) {
    const public = {};
    const protected = {};

    Object.entries(vars || {}).forEach(([key, value]) => {
        // Use prefix or metadata to determine if protected
        if (key.startsWith('_') || this.isProtectedProperty(key)) {
            protected[key] = value;
        } else {
            public[key] = value;
        }
    });

    return { public, protected };
}
```

#### 2.2 CRUD Operations
Update all CRUD operations to work directly with Firebase:

```javascript
// Add Property
async addProperty(key, value, isProtected = false) {
    const fullKey = isProtected ? `_${key}` : key;
    await net.getDatabase().ref(`space/${net.spaceId}/vars/${fullKey}`).set(value);
}

// Update Property
async updateProperty(key, value) {
    await net.getDatabase().ref(`space/${net.spaceId}/vars/${key}`).set(value);
}

// Delete Property
async deleteProperty(key) {
    await net.getDatabase().ref(`space/${net.spaceId}/vars/${key}`).remove();
}

// Get All Properties
async getAllProperties() {
    const snapshot = await net.getDatabase().ref(`space/${net.spaceId}/vars`).once('value');
    return this.categorizeProperties(snapshot.val());
}
```

### Phase 3: Update Render Methods

#### 3.1 Replace State References
Update all render methods to use Firebase data:
```javascript
async render(origin = 'unknown') {
    // Track render origin
    this.renderOrigins[origin] = (this.renderOrigins[origin] || 0) + 1;
    this.renders++;

    // Get properties from Firebase
    const properties = await this.getAllProperties();

    // Render based on view mode
    switch(this.viewMode) {
        case 'flat':
            this.renderFlatView(properties);
            break;
        case 'struct':
            this.renderStructView(properties);
            break;
        case 'sync':
            this.renderSyncView(properties);
            break;
    }

    this.updateRenderCount();
}
```

#### 3.2 Smart Rendering with Firebase
Implement smart rendering that only updates changed properties:
```javascript
handlePropertyChanged(key, value) {
    // Only re-render the specific property item
    const propElement = document.querySelector(`[data-prop-key="${key}"]`);
    if (propElement) {
        this.updatePropertyElement(propElement, key, value);
    } else if (this.shouldShowProperty(key)) {
        // Add new property to view
        this.addPropertyToView(key, value);
    }
}
```

### Phase 4: Remove Legacy Dependencies

#### 4.1 Remove spaceState References
- Remove all references to `SM.scene.spaceState`
- Remove `spaceStateChanged` event listeners
- Update imports to remove legacy dependencies

#### 4.2 Update Change Management
Ensure `SpacePropertyChange` class directly updates Firebase:
```javascript
class SpacePropertyChange extends Change {
    async apply() {
        await net.getDatabase().ref(`space/${net.spaceId}/vars/${this.key}`).set(this.value);
        await super.apply();
    }

    async undo() {
        if (this.oldValue !== undefined) {
            await net.getDatabase().ref(`space/${net.spaceId}/vars/${this.key}`).set(this.oldValue);
        } else {
            await net.getDatabase().ref(`space/${net.spaceId}/vars/${this.key}`).remove();
        }
        await super.undo();
    }
}
```

### Phase 5: Add Firebase-Specific Features

#### 5.1 Offline Support
Add offline capability detection:
```javascript
setupOfflineDetection() {
    const connectedRef = net.getDatabase().ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
        this.isOnline = snapshot.val() === true;
        this.updateConnectionStatus();
    });
}
```

#### 5.2 Optimistic Updates
Implement optimistic UI updates with rollback on failure:
```javascript
async updatePropertyOptimistic(key, value) {
    const oldValue = this.properties[key];

    // Update UI immediately
    this.updatePropertyDisplay(key, value);

    try {
        // Update Firebase
        await net.getDatabase().ref(`space/${net.spaceId}/vars/${key}`).set(value);
    } catch (error) {
        // Rollback on failure
        this.updatePropertyDisplay(key, oldValue);
        console.error('Failed to update property:', error);
    }
}
```

## Implementation Steps

### Step 1: Create Feature Branch
```bash
git checkout -b feature/space-props-firebase-migration
```

### Step 2: Backup Current Implementation
```bash
cp frontend/js/pages/world-inspector/space-props-panel.js \
   frontend/js/pages/world-inspector/space-props-panel.backup.js
```

### Step 3: Implement Core Changes
1. Add Firebase listener setup in constructor
2. Replace all state access with Firebase calls
3. Update CRUD operations
4. Refactor render methods

### Step 4: Testing Plan
1. **Unit Tests**: Test each CRUD operation
2. **Integration Tests**: Test real-time sync between clients
3. **Performance Tests**: Ensure no render performance degradation
4. **Edge Cases**:
   - Offline/online transitions
   - Rapid property updates
   - Large property sets (100+ properties)
   - Concurrent edits from multiple clients

### Step 5: Migration Script
Create a script to migrate any existing spaceState data to Firebase `/vars`:
```javascript
async function migrateSpaceStateToFirebase() {
    const spaceState = SM.scene.spaceState;
    if (!spaceState) return;

    const batch = {};

    // Migrate public properties
    Object.entries(spaceState.public || {}).forEach(([key, value]) => {
        batch[`space/${net.spaceId}/vars/${key}`] = value;
    });

    // Migrate protected properties with prefix
    Object.entries(spaceState.protected || {}).forEach(([key, value]) => {
        batch[`space/${net.spaceId}/vars/_${key}`] = value;
    });

    // Batch update to Firebase
    await net.getDatabase().ref().update(batch);
}
```

## Rollback Plan
1. Keep backup of original file
2. Maintain feature flag to toggle between old/new implementation
3. Document all Firebase rules changes for easy revert

## Success Criteria
- [ ] All properties sync in real-time across clients
- [ ] No dependency on spaceState or legacy events
- [ ] Performance equal or better than current implementation
- [ ] Backward compatibility maintained for existing properties
- [ ] Proper error handling and offline support
- [ ] Clean separation between public/protected properties

## Timeline
- **Phase 1-2**: 2 days - Firebase integration and data access
- **Phase 3**: 1 day - Update render methods
- **Phase 4**: 1 day - Remove legacy code
- **Phase 5**: 1 day - Add Firebase features
- **Testing**: 2 days - Comprehensive testing
- **Total**: 7 days

## Notes
- Consider implementing a caching layer for frequently accessed properties
- May need to update Firebase security rules for protected properties
- Should coordinate with other team members using space properties
- Document new Firebase structure for other developers