# Inspector Injector Streamline Plan

## Overview
Refactor `frontend/inspector-injector.js` to provide a cleaner, more focused UX that aligns with the Firebase migration and removes unnecessary complexity.

## Current Issues

### 1. Hardcoded HTML Structure
- Lines 197-431: Massive HTML template string embedded in JavaScript
- Difficult to maintain and update
- Mixed concerns between injection logic and UI structure

### 2. Legacy Space Properties UI
- Lines 281-354: Space properties panel HTML still references old patterns
- Contains inline onclick handlers (lines 334, 350)
- Not aligned with Firebase `/vars` structure

### 3. Redundant Configuration
- Multiple file server options (stable, ngrok, local, unity) add complexity
- Hardcoded ngrok URLs (line 23)
- Mixed configuration sources (localStorage, window globals, config object)

## Proposed Changes

### Phase 1: Modularize HTML Templates

#### 1.1 Extract Templates to Separate Files
Create template files for better maintainability:
```
frontend/templates/
├── navigation.html
├── world-inspector.html
├── inventory.html
├── feedback.html
└── space-props.html
```

#### 1.2 Template Loader System
```javascript
class TemplateLoader {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.cache = new Map();
    }

    async load(templateName) {
        if (this.cache.has(templateName)) {
            return this.cache.get(templateName);
        }

        const response = await fetch(`${this.baseUrl}/templates/${templateName}.html`);
        const template = await response.text();
        this.cache.set(templateName, template);
        return template;
    }

    async loadAll() {
        const templates = ['navigation', 'world-inspector', 'inventory', 'feedback', 'space-props'];
        const loaded = await Promise.all(templates.map(t => this.load(t)));
        return Object.fromEntries(templates.map((name, i) => [name, loaded[i]]));
    }
}
```

### Phase 2: Simplify Configuration

#### 2.1 Single Configuration Source
```javascript
export class InspectorConfig {
    constructor(options = {}) {
        // Use environment detection for smart defaults
        this.config = {
            mode: this.detectMode(),
            firebase: {
                projectId: options.firebaseProjectId || 'inspector-6bad1',
                databaseURL: options.firebaseDatabaseURL || 'https://inspector-6bad1-default-rtdb.firebaseio.com',
                storageBucket: options.firebaseStorageBucket || 'inspector-6bad1.firebasestorage.app'
            },
            api: {
                baseUrl: options.apiUrl || this.getDefaultApiUrl()
            },
            ui: {
                theme: options.theme || 'dark',
                panels: options.panels || ['hierarchy', 'properties', 'space-props', 'lifecycle'],
                defaultPage: options.defaultPage || 'world-inspector'
            }
        };
    }

    detectMode() {
        if (window.location.hostname === 'localhost') return 'local';
        if (window.location.hostname.includes('ngrok')) return 'ngrok';
        return 'production';
    }

    getDefaultApiUrl() {
        switch (this.config.mode) {
            case 'local': return 'http://localhost:3000';
            case 'ngrok': return window.location.origin;
            default: return 'https://api.banterinspector.com';
        }
    }
}
```

### Phase 3: Streamline Space Properties Integration

#### 3.1 New Space Props Component
Replace inline HTML (lines 313-354) with a dynamic component:

```javascript
class SpacePropsInjector {
    constructor(container, firebaseRef) {
        this.container = container;
        this.firebaseRef = firebaseRef;
        this.varsRef = firebaseRef.child('vars');
    }

    async inject() {
        // Create the basic structure
        this.container.innerHTML = `
            <div class="space-props-firebase">
                <div class="props-header">
                    <h3>Space Variables</h3>
                    <button class="props-sync-status" id="syncStatus">
                        <span class="sync-icon">🔄</span>
                        <span class="sync-text">Synced</span>
                    </button>
                </div>
                <div class="props-list" id="varsList">
                    <div class="loading">Loading variables...</div>
                </div>
                <div class="props-add">
                    <input type="text" id="newVarKey" placeholder="Key" />
                    <input type="text" id="newVarValue" placeholder="Value" />
                    <button id="addVarBtn">Add Variable</button>
                </div>
            </div>
        `;

        // Set up Firebase listeners
        this.setupListeners();
    }

    setupListeners() {
        // Listen for all vars changes
        this.varsRef.on('value', (snapshot) => {
            this.renderVars(snapshot.val() || {});
        });

        // Add button handler
        document.getElementById('addVarBtn').addEventListener('click', () => {
            this.addVariable();
        });
    }

    renderVars(vars) {
        const listEl = document.getElementById('varsList');
        if (Object.keys(vars).length === 0) {
            listEl.innerHTML = '<div class="empty">No variables defined</div>';
            return;
        }

        listEl.innerHTML = Object.entries(vars)
            .map(([key, value]) => this.createVarElement(key, value))
            .join('');
    }

    createVarElement(key, value) {
        const isProtected = key.startsWith('_');
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;

        return `
            <div class="var-item ${isProtected ? 'protected' : 'public'}" data-key="${key}">
                <span class="var-key">${key}</span>
                <input class="var-value" type="text" value="${displayValue}" data-key="${key}" />
                <button class="var-delete" data-key="${key}">×</button>
            </div>
        `;
    }

    async addVariable() {
        const keyInput = document.getElementById('newVarKey');
        const valueInput = document.getElementById('newVarValue');

        const key = keyInput.value.trim();
        const value = this.parseValue(valueInput.value);

        if (key) {
            await this.varsRef.child(key).set(value);
            keyInput.value = '';
            valueInput.value = '';
        }
    }

    parseValue(value) {
        // Try JSON parse first
        try {
            return JSON.parse(value);
        } catch {
            // Check for boolean
            if (value === 'true') return true;
            if (value === 'false') return false;

            // Check for number
            const num = Number(value);
            if (!isNaN(num)) return num;

            // Return as string
            return value;
        }
    }
}
```

### Phase 4: Simplify Injection Process

#### 4.1 Streamlined Injector Class
```javascript
export class InspectorInjector {
    constructor(options = {}) {
        this.config = new InspectorConfig(options);
        this.container = options.container || document.body;
        this.templates = new TemplateLoader(this.config.api.baseUrl);
        this.modules = new Map();
    }

    async inject() {
        // 1. Load all templates
        const templates = await this.templates.loadAll();

        // 2. Initialize Firebase
        await this.initFirebase();

        // 3. Create main structure
        this.createStructure(templates);

        // 4. Initialize modules
        await this.initModules();

        // 5. Set up event handlers
        this.setupEventHandlers();

        // 6. Load initial data
        await this.loadInitialData();
    }

    async initFirebase() {
        if (window.firebase && !firebase.apps.length) {
            firebase.initializeApp(this.config.firebase);
            this.db = firebase.database();
            this.storage = firebase.storage();

            // Set global reference for backward compatibility
            window.net = {
                db: this.db,
                storage: this.storage,
                spaceId: this.getSpaceId(),
                getDatabase: () => this.db,
                getStorage: () => this.storage
            };
        }
    }

    getSpaceId() {
        // Extract from subdomain: spaceId.banter.fun -> spaceId
        return window.location.host.split('.')[0] || 'default';
    }

    createStructure(templates) {
        this.container.innerHTML = `
            <div id="inspector-root">
                ${templates.navigation}
                <div class="inspector-content">
                    <div class="page active" data-page="world-inspector">
                        ${templates['world-inspector']}
                    </div>
                    <div class="page" data-page="inventory">
                        ${templates.inventory}
                    </div>
                    <div class="page" data-page="feedback">
                        ${templates.feedback}
                    </div>
                </div>
            </div>
        `;
    }

    async initModules() {
        // Initialize core modules
        const spacePropsContainer = document.querySelector('.space-props-container');
        if (spacePropsContainer) {
            const spaceProps = new SpacePropsInjector(
                spacePropsContainer,
                this.db.ref(`space/${this.getSpaceId()}`)
            );
            await spaceProps.inject();
            this.modules.set('spaceProps', spaceProps);
        }

        // Initialize other modules as needed...
    }
}
```

### Phase 5: Remove Legacy Code

#### 5.1 Items to Remove
- Inline event handlers (onclick attributes)
- Global function dependencies (addPublicProp, addProtectedProp)
- Hardcoded URLs and configuration
- Legacy spaceState references
- Redundant file server options

#### 5.2 Items to Refactor
- Component metadata (lines 454-551) → Load from Firebase or external config
- Feedback page HTML (lines 588-737) → Separate template file
- Select enhancement script (lines 129-164) → Modern event delegation

## Implementation Steps

### Step 1: Create Template Structure
```bash
mkdir -p frontend/templates
# Extract HTML sections into individual template files
```

### Step 2: Implement Configuration Class
Create `frontend/js/config.js` with the new configuration system

### Step 3: Refactor Space Props
1. Create new `space-props-firebase.js` module
2. Remove old space props HTML from injector
3. Update event handlers to use Firebase directly

### Step 4: Simplify Injector
1. Remove hardcoded HTML strings
2. Implement template loader
3. Streamline initialization flow

### Step 5: Testing
1. Test injection into different container types
2. Verify Firebase sync works correctly
3. Ensure backward compatibility where needed
4. Test performance with lazy loading

## Benefits

### Immediate Benefits
- **Cleaner Code**: Separation of concerns between injection logic and UI
- **Better Maintainability**: Templates can be edited without touching JS
- **Firebase-First**: Direct integration with Firebase instead of legacy patterns
- **Reduced Complexity**: Single configuration source, fewer options

### Future Benefits
- **Easier Testing**: Modular components can be tested in isolation
- **Better Performance**: Lazy loading of templates and modules
- **Extensibility**: Easy to add new panels or pages
- **Type Safety**: Can add TypeScript definitions for configuration

## Migration Path

### Backward Compatibility
Keep these for transition period:
- `window.net` global for existing code
- Basic spaceState emulation layer
- Legacy event handlers with deprecation warnings

### Deprecation Timeline
1. **Week 1-2**: Implement new system alongside old
2. **Week 3-4**: Add deprecation warnings
3. **Week 5-6**: Switch default to new system
4. **Week 7-8**: Remove legacy code

## Success Metrics
- [ ] Injection time < 500ms
- [ ] Firebase sync latency < 100ms
- [ ] Code size reduction > 30%
- [ ] Zero inline event handlers
- [ ] 100% template-based UI
- [ ] All configuration centralized

## Notes
- Consider using Web Components for better encapsulation
- May want to implement virtual DOM for better performance
- Could benefit from a build step to bundle templates
- Should add error boundaries for better resilience