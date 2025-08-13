/**
 * Unity Scene Inspector Tutorial
 * 
 * This tutorial simulates a Unity environment and reuses the actual inspector modules
 * to provide an interactive learning experience.
 */

// Tutorial tooltip content definitions
const tooltipContent = {
    // Navigation
    'navigation': {
        title: 'Navigation Bar',
        description: 'The main navigation bar lets you switch between different sections of the inspector.',
        tips: ['Click on tabs to switch views', 'The active tab is highlighted']
    },
    'world-inspector-tab': {
        title: 'World Inspector',
        description: 'View and edit the Unity scene hierarchy and GameObject properties.',
        tips: ['This is the main workspace', 'Select GameObjects to edit their components']
    },
    'inventory-tab': {
        title: 'Inventory',
        description: 'Store reusable GameObjects and scripts for later use.',
        tips: ['Drag GameObjects here to save them', 'Upload JavaScript files for MonoBehavior components']
    },
    'feedback-tab': {
        title: 'Feedback System',
        description: 'Submit bug reports, feature requests, and ideas to improve the inspector.',
        tips: ['Use voice recording for detailed feedback', 'View and comment on existing tickets']
    },
    
    // Controls
    'undo-btn': {
        title: 'Undo',
        description: 'Undo the last action performed.',
        tips: ['Keyboard shortcut: Ctrl+Z', 'Supports multiple undo levels']
    },
    'redo-btn': {
        title: 'Redo',
        description: 'Redo the previously undone action.',
        tips: ['Keyboard shortcut: Ctrl+Shift+Z', 'Only available after undoing']
    },
    'save-btn': {
        title: 'Save Scene',
        description: 'Save the current scene state to Unity.',
        tips: ['Saves all changes made in the inspector', 'Creates a checkpoint for recovery']
    },
    
    // Hierarchy Panel
    'hierarchy-panel': {
        title: 'Scene Hierarchy',
        description: 'Shows all GameObjects in your Unity scene in a tree structure.',
        tips: ['Click to select GameObjects', 'Drag to rearrange parent-child relationships', 'Right-click for context menu']
    },
    'hierarchy-header': {
        title: 'Hierarchy Header',
        description: 'The title of the hierarchy panel.',
        tips: ['Shows the current scene name when connected']
    },
    'search-container': {
        title: 'Search Box',
        description: 'Filter GameObjects by name to quickly find what you need.',
        tips: ['Type to filter in real-time', 'Searches through all nested objects']
    },
    'entity-actions': {
        title: 'Entity Actions',
        description: 'Quick actions for the selected GameObject.',
        tips: ['Actions apply to the currently selected entity']
    },
    'add-child-btn': {
        title: 'Add Child',
        description: 'Create a new child GameObject under the selected one.',
        tips: ['Creates an empty GameObject', 'Automatically parents to selection']
    },
    'clone-btn': {
        title: 'Clone Entity',
        description: 'Duplicate the selected GameObject and all its children.',
        tips: ['Creates an exact copy', 'Includes all components and properties']
    },
    'delete-btn': {
        title: 'Delete Entity',
        description: 'Remove the selected GameObject from the scene.',
        tips: ['Deletes the entity and all children', 'Can be undone with Ctrl+Z']
    },
    'save-entity-btn': {
        title: 'Save to Inventory',
        description: 'Save the selected GameObject to your inventory for reuse.',
        tips: ['Preserves all components and properties', 'Can be instantiated later from inventory']
    },
    'hierarchy-tree': {
        title: 'GameObject Tree',
        description: 'The hierarchical view of all GameObjects in your scene.',
        tips: ['▶ arrows indicate objects with children', 'Indentation shows parent-child relationships', 'Drag & drop to reorganize']
    },
    
    // Properties Panel
    'properties-panel': {
        title: 'Properties Panel',
        description: 'View and edit components of the selected GameObject.',
        tips: ['Shows all components attached to the GameObject', 'Edit values in real-time']
    },
    'properties-header': {
        title: 'Properties Header',
        description: 'Shows the name of the selected GameObject.',
        tips: ['Displays "Properties" when nothing is selected']
    },
    'collapse-all-btn': {
        title: 'Collapse All',
        description: 'Collapse all component sections for a cleaner view.',
        tips: ['Useful when dealing with many components', 'Click individual components to expand']
    },
    'properties-content': {
        title: 'Component List',
        description: 'All components attached to the selected GameObject.',
        tips: ['Each section is a different component', 'Click headers to expand/collapse']
    },
    'add-component-container': {
        title: 'Add Component Section',
        description: 'Add new components to the selected GameObject.',
        tips: ['Only visible when a GameObject is selected']
    },
    'add-component-btn': {
        title: 'Add Component',
        description: 'Open the component menu to add new functionality.',
        tips: ['Browse by category', 'Search for specific components', 'Add physics, graphics, behaviors, and more']
    },
    
    // Space Props Panel
    'space-props-container': {
        title: 'Space Properties & Lifecycle',
        description: 'Manage space-level properties and monitor script execution.',
        tips: ['Split into two sections for better organization']
    },
    'space-props-panel': {
        title: 'Space Properties',
        description: 'Properties that persist across the entire Banter space.',
        tips: ['Public props are accessible by all users', 'Protected props require admin access']
    },
    'public-props': {
        title: 'Public Properties',
        description: 'Properties that all users in the space can read.',
        tips: ['Used for shared game state', 'Can be modified by scripts']
    },
    'protected-props': {
        title: 'Protected Properties',
        description: 'Properties that only space admins can modify.',
        tips: ['Used for sensitive settings', 'Requires elevated permissions']
    },
    
    // Lifecycle Panel
    'lifecycle-panel': {
        title: 'Lifecycle Panel',
        description: 'Monitor and manage running MonoBehavior scripts.',
        tips: ['See which scripts are active', 'View console output in real-time']
    },
    'lifecycle-header': {
        title: 'Lifecycle Header',
        description: 'Controls for the lifecycle panel.',
        tips: ['Refresh button reloads script status']
    },
    'lifecycle-list': {
        title: 'Active Scripts',
        description: 'List of all MonoBehavior scripts currently running.',
        tips: ['Shows script name and status', 'Click to view script details']
    },
    'console-container': {
        title: 'Console Output',
        description: 'Real-time output from scripts and system events.',
        tips: ['Monitor script execution', 'Debug errors and warnings']
    },
    'console-header': {
        title: 'Console Controls',
        description: 'Filter and manage console output.',
        tips: ['Toggle different message types', 'Clear console with trash button']
    },
    'console-toggles': {
        title: 'Message Filters',
        description: 'Show or hide different types of console messages.',
        tips: ['Command: User commands', 'Scripts: Script output', 'OneShot: Network events', 'SpaceProps: Property changes']
    },
    'console-output': {
        title: 'Console Messages',
        description: 'The actual console output from various sources.',
        tips: ['Color-coded by type', 'Timestamps included', 'Auto-scrolls to latest']
    }
};

// Tutorial state
let tutorialActive = false;
let visitedElements = new Set();
let tooltip = null;
let currentElement = null;
let tooltipTimeout = null;
let mockScene = null;

// Mock Unity environment
class MockUnityEnvironment {
    constructor() {
        this.mockData = null;
        this.scene = null;
        this.unityLoaded = false;
        this.setupComplete = false;
    }

    async initialize() {
        // Load mock data
        try {
            const response = await fetch('mock_data.json');
            this.mockData = await response.json();
        } catch (error) {
            console.error('Failed to load mock data:', error);
        }

        // Create mock BS and scene objects
        this.createMockBSLibrary();
        
        // Simulate Unity loaded event after a short delay
        setTimeout(() => {
            this.simulateUnityLoaded();
        }, 1000);
    }

    createMockBSLibrary() {
        // Create mock BS library
        window.BS = {
            BanterScene: {
                GetInstance: () => this.scene
            },
            GameObject: class {
                constructor(name) {
                    this.name = name;
                    this.transform = {
                        localPosition: { x: 0, y: 0, z: 0 },
                        localRotation: { x: 0, y: 0, z: 0, w: 1 },
                        localScale: { x: 1, y: 1, z: 1 }
                    };
                    this.components = [];
                    this.children = [];
                    this.active = true;
                }
            }
        };

        // Create mock scene
        this.scene = {
            unityLoaded: false,
            localUser: {
                name: "Tutorial User",
                uid: "tutorial-user-123",
                isLocal: true,
                color: "#667eea"
            },
            users: {},
            rootEntity: this.mockData,
            
            // Event system
            listeners: {},
            On: (event, callback) => {
                if (!this.scene.listeners[event]) {
                    this.scene.listeners[event] = [];
                }
                this.scene.listeners[event].push(callback);
            },
            addEventListener: (event, callback) => {
                this.scene.On(event, callback);
            },
            emit: (event, data) => {
                if (this.scene.listeners[event]) {
                    this.scene.listeners[event].forEach(cb => cb(data));
                }
            },
            
            // Mock methods
            GetRootEntity: () => this.mockData,
            GetSpaceProperty: (key, isProtected) => {
                if (isProtected) {
                    return { adminMode: true }[key];
                }
                return { maxPlayers: 8, gameMode: 'tutorial' }[key];
            },
            SetSpaceProperty: (key, value, isProtected) => {
                console.log(`Mock: Setting ${isProtected ? 'protected' : 'public'} property ${key} = ${value}`);
            },
            GetAllSpaceProperties: (isProtected) => {
                if (isProtected) {
                    return { adminMode: true };
                }
                return { maxPlayers: 8, gameMode: 'tutorial' };
            }
        };

        // Set global scene reference
        window.scene = this.scene;
    }

    simulateUnityLoaded() {
        this.unityLoaded = true;
        this.scene.unityLoaded = true;
        
        // Emit loaded event
        this.scene.emit('loaded', {});
        
        // Simulate some activity
        setTimeout(() => {
            this.simulateConsoleActivity();
        }, 2000);
    }

    simulateConsoleActivity() {
        // Simulate some console messages
        const messages = [
            { type: 'script', message: '[Script] Tutorial environment initialized' },
            { type: 'oneShot', message: '[OneShot] Space properties loaded' },
            { type: 'command', message: '[Command] Scene hierarchy rendered' }
        ];

        messages.forEach((msg, index) => {
            setTimeout(() => {
                this.logToConsole(msg.type, msg.message);
            }, index * 1000);
        });
    }

    logToConsole(type, message) {
        const event = new CustomEvent('console-log', {
            detail: { type, message, timestamp: new Date() }
        });
        document.dispatchEvent(event);
    }
}

// Reset progress function
window.resetProgress = function() {
    visitedElements.clear();
    updateProgress();
    console.log('Tutorial progress reset');
};

// Initialize tutorial
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing tutorial...');
    
    // Setup tutorial UI
    tooltip = document.getElementById('tooltip');
    
    // Start tutorial button
    const startBtn = document.getElementById('startTutorial');
    if (startBtn) {
        startBtn.addEventListener('click', startTutorial);
    }
    
    // Toggle tutorial button
    const toggleBtn = document.getElementById('toggleTutorial');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (tutorialActive) {
                document.body.classList.remove('tutorial-active');
                tutorialActive = false;
                hideTooltip();
            } else {
                document.body.classList.add('tutorial-active');
                tutorialActive = true;
            }
        });
    }
    
    // Initialize mock Unity environment
    mockScene = new MockUnityEnvironment();
    await mockScene.initialize();
    
    // Set up the app URL for module imports
    window.isLocalHost = true;
    //window.repoUrl = 'http://192.168.0.148:9909';
    window.repoUrl = 'https://14323af20a15.ngrok-free.app';

    let gO = class gO{
        constructor(name){}
        SetParent(parent){}
        SetActive(active){}
        SetLayer(layer){  }
        AddComponent(component){}
        GetComponent(component){}
    }

    window.BS = {
        ComponentType:{
            BanterAssetBundle: 0,
            BanterAttachedObject: 1,
            BanterAudioSource: 2,
            BanterBillboard: 3,
            BanterBox: 4,
            BoxCollider: 5,
            BanterBrowser: 6,
            CapsuleCollider: 7,
            BanterCircle: 8,
            BanterColliderEvents: 9,
            BanterCone: 10,
            ConfigurableJoint: 11,
            BanterCylinder: 12,
            BanterGeometry: 13,
            BanterGLTF: 14,
            BanterGrabHandle: 15,
            BanterHeldEvents: 16,
            BanterInvertedMesh: 17,
            BanterKitItem: 18,
            BanterMaterial: 19,
            MeshCollider: 20,
            BanterMirror: 21,
            BanterPhysicMaterial: 22,
            BanterPlane: 23,
            BanterPortal: 24,
            BanterRigidbody: 25,
            BanterRing: 26,
            BanterSphere: 27,
            SphereCollider: 28,
            BanterStreetView: 29,
            BanterSyncedObject: 30,
            BanterText: 31,
            BanterTorus: 32,
            BanterVideoPlayer: 34,
            BanterWorldObject: 35
        },
        GameObject: gO,
    }
    
    // Import and initialize the actual inspector app
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
        (async () => {
            // Import required modules
            // const { sceneManager } = await import('../js/scene-manager.js');
            // window.SM = sceneManager;
            
            // Import and run the main app
            import('../js/app.js');
            window.repoUrl +="/js";
            window.useMock = true;
            
            // After app initializes, set up tutorial-specific features
            setTimeout(() => {
                setupTutorialFeatures();
            }, 2000);
        })();
    `;
    document.body.appendChild(script);
    
    // Set up hover listeners for all tutorial elements
    setTimeout(() => {
        setupHoverListeners();
    }, 3000);
    
    // Update progress periodically
    setInterval(updateProgress, 500);
});

function startTutorial() {
    const overlay = document.getElementById('tutorialOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.remove(); // Remove the overlay completely
    }
    document.body.classList.add('tutorial-active');
    tutorialActive = true;
}

function setupTutorialFeatures() {
    console.log('Setting up tutorial features...');
    
    // Override any real Unity connections
    if (window.SM && window.SM.scene) {
        // The mock scene is already set up
        console.log('Tutorial scene ready');
    }
}

function setupHoverListeners() {
    // Get all elements with data-tutorial attribute
    const elements = document.querySelectorAll('[data-tutorial]');
    
    elements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            if (!tutorialActive) return;
            e.stopPropagation();
            
            // Clear any pending hide timeout
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
            
            // Find the actual element with data-tutorial attribute
            let targetElement = e.target;
            while (targetElement && !targetElement.hasAttribute('data-tutorial')) {
                targetElement = targetElement.parentElement;
            }
            
            if (targetElement) {
                showTooltip(targetElement);
            }
        });
        
        element.addEventListener('mouseleave', (e) => {
            if (!tutorialActive) return;
            e.stopPropagation();
            
            // Add a small delay before hiding to prevent flashing
            tooltipTimeout = setTimeout(() => {
                hideTooltip();
            }, 100);
        });
    });
}

function showTooltip(element) {
    const tutorialKey = element.getAttribute('data-tutorial');
    const content = tooltipContent[tutorialKey];
    
    if (!content) return;
    
    // Don't show a new tooltip if we're already showing this one
    if (currentElement === element) return;
    
    // Clear any existing tooltip first
    if (currentElement) {
        currentElement.classList.remove('tutorial-highlight');
    }
    
    // Mark as visited
    visitedElements.add(tutorialKey);
    
    // Get tooltip elements
    const tooltipEmpty = document.querySelector('.tooltip-empty');
    const tooltipContentEl = document.querySelector('.tooltip-content');
    
    // Hide empty state, show content
    if (tooltipEmpty) tooltipEmpty.style.display = 'none';
    if (tooltipContentEl) tooltipContentEl.style.display = 'block';
    
    // Update tooltip content
    const titleEl = tooltipContentEl.querySelector('.tooltip-title');
    const descEl = tooltipContentEl.querySelector('.tooltip-description');
    const tipsContainer = tooltipContentEl.querySelector('.tooltip-tips');
    
    if (titleEl) titleEl.textContent = content.title;
    if (descEl) descEl.textContent = content.description;
    
    // Add tips
    if (tipsContainer) {
        tipsContainer.innerHTML = '';
        
        if (content.tips && content.tips.length > 0) {
            content.tips.forEach(tip => {
                const tipDiv = document.createElement('div');
                tipDiv.className = 'tooltip-tip';
                
                // Check if tip contains keyboard shortcut
                if (tip.includes(':')) {
                    const [text, shortcut] = tip.split(':');
                    tipDiv.innerHTML = `${text}:<span class="tooltip-shortcut">${shortcut.trim()}</span>`;
                } else {
                    tipDiv.textContent = tip;
                }
                
                tipsContainer.appendChild(tipDiv);
            });
        }
    }
    
    // Highlight element
    element.classList.add('tutorial-highlight');
    currentElement = element;
}

function hideTooltip() {
    // Clear the timeout if it exists
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
    
    // Show empty state, hide content
    const tooltipEmpty = document.querySelector('.tooltip-empty');
    const tooltipContentEl = document.querySelector('.tooltip-content');
    
    if (tooltipEmpty) tooltipEmpty.style.display = 'block';
    if (tooltipContentEl) tooltipContentEl.style.display = 'none';
    
    if (currentElement) {
        currentElement.classList.remove('tutorial-highlight');
        currentElement = null;
    }
}

function updateProgress() {
    if (!tutorialActive) return;
    
    const totalElements = Object.keys(tooltipContent).length;
    const visitedCount = visitedElements.size;
    const percentage = (visitedCount / totalElements) * 100;
    
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        if (percentage === 100) {
            progressText.textContent = '🎉 Tutorial complete! You\'ve explored everything!';
        } else if (percentage > 75) {
            progressText.textContent = `Almost there! ${visitedCount}/${totalElements} explored`;
        } else if (percentage > 50) {
            progressText.textContent = `Great progress! ${visitedCount}/${totalElements} explored`;
        } else if (percentage > 25) {
            progressText.textContent = `Keep exploring! ${visitedCount}/${totalElements} discovered`;
        } else {
            progressText.textContent = `Hover over elements to explore (${visitedCount}/${totalElements})`;
        }
    }
}

// Add keyboard shortcut to toggle tutorial mode
document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
        e.preventDefault();
        if (tutorialActive) {
            document.body.classList.remove('tutorial-active');
            tutorialActive = false;
            hideTooltip();
        } else {
            document.body.classList.add('tutorial-active');
            tutorialActive = true;
        }
    }
});

// Export for debugging
window.tutorialEnv = mockScene;