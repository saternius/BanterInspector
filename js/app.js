/**
 * Unity Scene Inspector - Main Application Entry Point
 * 
 * This is the main entry point that initializes all modules and coordinates
 * the inspector application.
 */

import { sceneManager } from './scene-manager.js';
import { HierarchyPanel } from './hierarchy-panel.js';
import { PropertiesPanel } from './properties-panel.js';
import { SpacePropsPanel } from './space-props-panel.js';
import { ComponentMenu } from './component-menu.js';
import { loadMockSpaceProps } from './mock-data.js';

// Global app instance
class InspectorApp {
    constructor() {
        this.hierarchyPanel = null;
        this.propertiesPanel = null;
        this.spacePropsPanel = null;
        this.componentMenu = null;
        this.initialized = false;
    }

    /**
     * Initialize the inspector application
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('Initializing Unity Scene Inspector...');
        
        try {
            // Initialize scene manager
            await sceneManager.initialize();
            
            // Load mock space props if no Unity connection
            if (!sceneManager.scene) {
                const mockProps = loadMockSpaceProps();
                sceneManager.spaceState = mockProps;
            }
            
            // Initialize UI panels
            this.hierarchyPanel = new HierarchyPanel();
            this.propertiesPanel = new PropertiesPanel();
            this.spacePropsPanel = new SpacePropsPanel();
            this.componentMenu = new ComponentMenu();
            
            // Set up global references for inline handlers
            window.spacePropsPanel = this.spacePropsPanel;
            
            // Initial render
            this.hierarchyPanel.render();
            this.spacePropsPanel.render();
            
            // Set up global event handlers
            this.setupGlobalEventHandlers();
            
            // Handle window resize
            this.setupResizeHandlers();
            
            this.initialized = true;
            console.log('Inspector initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize inspector:', error);
            this.showInitError(error);
        }
    }

    /**
     * Setup global event handlers
     */
    setupGlobalEventHandlers() {
        // Handle hierarchy changes
        document.addEventListener('slotPropertiesChanged', () => {
            this.hierarchyPanel.render();
        });
        
        // Handle space state changes from Unity
        if (sceneManager.scene) {
            sceneManager.scene.addEventListener('space-state-changed', () => {
                document.dispatchEvent(new CustomEvent('spaceStateChanged'));
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Delete key: Delete selected slot
            if (e.key === 'Delete' && sceneManager.selectedSlot) {
                const deleteBtn = document.getElementById('deleteSlotBtn');
                if (deleteBtn && !e.target.matches('input, textarea')) {
                    deleteBtn.click();
                }
            }
            
            // Ctrl/Cmd + N: Add new child slot
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                const addBtn = document.getElementById('addChildSlotBtn');
                if (addBtn) {
                    addBtn.click();
                }
            }
        });
    }

    /**
     * Setup resize handlers
     */
    setupResizeHandlers() {
        // Make panels resizable
        const hierarchyPanel = document.querySelector('.hierarchy-panel');
        const propertiesPanel = document.querySelector('.properties-panel');
        const spacePropsPanel = document.querySelector('.space-props-panel');
        
        if (hierarchyPanel && propertiesPanel) {
            this.makeResizable(hierarchyPanel, 'right', 200, 500);
        }
        
        if (spacePropsPanel && propertiesPanel) {
            this.makeResizable(spacePropsPanel, 'left', 300, 600);
        }
    }

    /**
     * Make a panel resizable
     */
    makeResizable(panel, direction, minSize, maxSize) {
        const resizer = document.createElement('div');
        resizer.className = 'panel-resizer';
        resizer.style.position = 'absolute';
        resizer.style[direction] = '0';
        resizer.style.top = '0';
        resizer.style.bottom = '0';
        resizer.style.width = '4px';
        resizer.style.cursor = direction === 'right' ? 'ew-resize' : 'ew-resize';
        resizer.style.zIndex = '100';
        
        panel.style.position = 'relative';
        panel.appendChild(resizer);
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = panel.offsetWidth;
            document.body.style.cursor = direction === 'right' ? 'ew-resize' : 'ew-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const diff = direction === 'right' ? 
                e.clientX - startX : 
                startX - e.clientX;
            
            const newWidth = Math.max(minSize, Math.min(maxSize, startWidth + diff));
            panel.style.width = newWidth + 'px';
            panel.style.flexShrink = '0';
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });
    }

    /**
     * Show initialization error
     */
    showInitError(error) {
        const container = document.querySelector('.inspector-container');
        if (container) {
            container.innerHTML = `
                <div class="init-error" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 40px;
                    text-align: center;
                ">
                    <h2 style="color: #ff6b6b; margin-bottom: 20px;">Initialization Error</h2>
                    <p style="color: #888; margin-bottom: 10px;">Failed to initialize the Scene Inspector</p>
                    <p style="color: #666; font-size: 14px; max-width: 600px;">${error.message}</p>
                    <button onclick="location.reload()" style="
                        margin-top: 30px;
                        padding: 10px 20px;
                        background: #2a2a2a;
                        border: 1px solid #3a3a3a;
                        border-radius: 4px;
                        color: #e8e8e8;
                        cursor: pointer;
                    ">Reload</button>
                </div>
            `;
        }
    }
}

// Create and initialize app instance
const app = new InspectorApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    app.initialize();
}

// Export app instance for debugging
window.inspectorApp = app;