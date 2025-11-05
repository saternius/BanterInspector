/**
 * Properties Panel
 * Main orchestrator for component display and property editing
 */

import { ScaleLockHandler } from './scale-lock-handler.js';
import { TransformHandler } from './transform-handler.js';
import { PropertyUpdater } from './property-updater.js';
import { PropertyInputRenderer } from './property-input-renderer.js';
import { EntityPropertiesRenderer } from './entity-properties-renderer.js';
import { ComponentRenderer } from './component-renderer.js';
import { MonoBehaviorRenderer } from './monobehavior-renderer.js';
import { ScriptRenderer } from './script-renderer.js';

export class PropertiesPanel {
    constructor() {
        // DOM elements
        this.propertiesContent = document.getElementById('propertiesContent');
        this.addComponentContainer = document.getElementById('addComponentContainer');
        this.addComponentBtn = document.getElementById('addComponentBtn');
        this.selectedEntityNameElement = document.getElementById('selectedEntityName');
        this.collapseAllBtn = document.getElementById('collapseAllBtn');
        this.loadSettingsBtn = document.getElementById('loadSettingsBtn');

        // Load settings toggle state
        this.showLoadSettings = false;

        // Render guard to prevent concurrent renders
        this.isRendering = false;
        this.pendingRender = null;

        // Initialize handlers and renderers
        this.initializeModules();

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Initialize all module instances
     */
    async initializeModules() {
        // Get utils and change manager
        const utils = await import(`${window.repoUrl}/utils.js`);
        const { changeManager } = await import(`${window.repoUrl}/change-manager.js`);
        const changeTypes = await import(`${window.repoUrl}/change-types.js`);

        // Store references
        this.utils = utils;
        this.changeManager = changeManager;
        this.changeManager.changeTypes = changeTypes;

        // Initialize handlers
        this.scaleLockHandler = new ScaleLockHandler();
        this.transformHandler = new TransformHandler();
        this.propertyUpdater = new PropertyUpdater();

        // Initialize renderers
        this.propertyInputRenderer = new PropertyInputRenderer(utils, changeManager, this.scaleLockHandler);
        this.entityRenderer = new EntityPropertiesRenderer(
            this.propertyInputRenderer,
            this.transformHandler,
            this.scaleLockHandler,
            utils,
            changeManager
        );
        this.componentRenderer = new ComponentRenderer(
            this.propertyInputRenderer,
            utils,
            changeManager
        );
        this.monoBehaviorRenderer = new MonoBehaviorRenderer(
            this.propertyInputRenderer,
            utils,
            changeManager
        );
        this.scriptRenderer = new ScriptRenderer(
            this.propertyInputRenderer,
            utils,
            changeManager
        );
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add component button
        this.addComponentBtn?.addEventListener('mousedown', () => {
            document.dispatchEvent(new CustomEvent('showComponentMenu', {
                detail: { entityId: SM.selectedEntity }
            }));
        });

        // Collapse all button
        this.collapseAllBtn?.addEventListener('mousedown', () => {
            this.collapseAllComponents();
        });

        // Load settings button
        this.loadSettingsBtn?.addEventListener('mousedown', () => {
            this.toggleLoadSettings();
        });

        // Listen for transform mode changes
        window.addEventListener('transform-mode-changed', () => {
            if (SM.selectedEntity) {
                this.render(SM.selectedEntity);
            }
        });

        // Listen for transform updates
        window.addEventListener('update-transform-display', () => {
            this.updateTransform();
        });

        // Listen for component reorder/delete events
        window.addEventListener('component-reordered', () => {
            if (SM.selectedEntity) {
                this.render(SM.selectedEntity);
            }
        });

        window.addEventListener('component-deleted', () => {
            if (SM.selectedEntity) {
                this.render(SM.selectedEntity);
            }
        });

        window.addEventListener('monobehavior-file-changed', (e) => {
            if (e.detail && e.detail.entityId) {
                this.render(e.detail.entityId);
            }
        });

        // Listen for component collapse changes
        window.addEventListener('component-collapse-changed', () => {
            this.updateCollapseAllButtonVisibility();
        });
    }

    /**
     * Toggle Load Settings mode
     */
    toggleLoadSettings() {
        this.showLoadSettings = !this.showLoadSettings;

        // Update button appearance
        if (this.loadSettingsBtn) {
            this.loadSettingsBtn.style.backgroundColor = this.showLoadSettings ? '#4a90e2' : '';
            this.loadSettingsBtn.style.color = this.showLoadSettings ? '#fff' : '';
        }

        // Re-render to show/hide async toggles
        if (SM.selectedEntity) {
            this.render(SM.selectedEntity);
        }
    }

    /**
     * Toggle Transform mode between local and global
     */
    toggleTransformMode() {
        this.transformHandler.toggleMode();

        // Re-render to show updated transform values
        if (SM.selectedEntity) {
            this.render(SM.selectedEntity);
        }
    }

    /**
     * Collapse all components
     */
    collapseAllComponents() {
        const entity = SM.getEntityById(SM.selectedEntity);
        if (!entity || !entity.components) return;

        // Collapse all components in both renderers
        this.componentRenderer.collapseAll(SM.selectedEntity, entity.components);

        // Also collapse MonoBehavior and Script components
        entity.components.forEach((component, index) => {
            if (component.type === 'MonoBehavior') {
                const componentKey = `${SM.selectedEntity}_${component.type}_${index}`;
                this.monoBehaviorRenderer.collapsedComponents.add(componentKey);
            } else if (component.type === 'Script') {
                const componentKey = `${SM.selectedEntity}_${component.type}_${index}`;
                this.scriptRenderer.collapsedComponents.add(componentKey);
            }
        });

        // Re-render to apply collapsed state
        this.render(SM.selectedEntity);
    }

    /**
     * Update collapse all button visibility
     */
    updateCollapseAllButtonVisibility() {
        if (!this.collapseAllBtn) return;

        const entity = SM.getEntityById(SM.selectedEntity, false);
        if (!entity || !entity.components || entity.components.length === 0) {
            this.collapseAllBtn.style.display = 'none';
            return;
        }

        // Check if at least one component is expanded
        const hasExpandedComponent = entity.components.some((component, index) => {
            const componentKey = `${SM.selectedEntity}_${component.type}_${index}`;

            if (component.type === 'MonoBehavior') {
                return !this.monoBehaviorRenderer.collapsedComponents.has(componentKey);
            } else if (component.type === 'Script') {
                return !this.scriptRenderer.collapsedComponents.has(componentKey);
            } else {
                return !this.componentRenderer.collapsedComponents.has(componentKey);
            }
        });

        this.collapseAllBtn.style.display = hasExpandedComponent ? 'block' : 'none';
    }

    /**
     * Render properties for an entity
     */
    async render(entityId = null) {
        // Use SM.selectedEntity as fallback if no entityId provided
        const targetEntityId = entityId || SM.selectedEntity;

        // If already rendering, queue this render request
        if (this.isRendering) {
            this.pendingRender = targetEntityId;
            return;
        }

        // Set rendering flag
        this.isRendering = true;

        try {
            await this._doRender(targetEntityId);
        } finally {
            // Clear rendering flag
            this.isRendering = false;

            // If there's a pending render, execute it
            if (this.pendingRender !== null) {
                const pending = this.pendingRender;
                this.pendingRender = null;
                await this.render(pending);
            }
        }
    }

    /**
     * Internal render method (does the actual rendering)
     */
    async _doRender(entityId) {
        if (!this.propertiesContent) return;

        const entity = entityId ? SM.getEntityById(entityId) : null;

        if (!entity) {
            this.renderEmptyState();
            return;
        }

        // Update header
        if (this.selectedEntityNameElement) {
            this.selectedEntityNameElement.textContent = `Properties - ${entity.name}`;
        }

        // Clear content
        this.propertiesContent.innerHTML = '';

        // Entity properties section
        const entitySection = await this.entityRenderer.createEntityPropertiesSection(entity, this.showLoadSettings);
        if (entitySection) {
            this.propertiesContent.appendChild(entitySection);
        }

        // Render components
        if (entity.components && entity.components.length > 0) {
            entity.components.forEach((component, index) => {
                let componentElement;

                if (component.type === 'MonoBehavior') {
                    // Use MonoBehavior renderer
                    componentElement = this.monoBehaviorRenderer.renderMonoBehaviorComponent(
                        component,
                        index,
                        entity.components.length,
                        SM.selectedEntity
                    );
                } else if (component.type === 'Script') {
                    // Use Script renderer
                    componentElement = this.scriptRenderer.renderScriptComponent(
                        component,
                        index,
                        entity.components.length,
                        SM.selectedEntity
                    );
                } else {
                    // Use generic component renderer
                    componentElement = this.componentRenderer.renderComponent(
                        component,
                        index,
                        entity.components.length,
                        SM.selectedEntity,
                        this.showLoadSettings
                    );
                }

                if (componentElement) {
                    this.propertiesContent.appendChild(componentElement);
                }
            });
        }

        // Show add component button
        if (this.addComponentContainer) {
            this.addComponentContainer.style.display = 'block';
        }

        // Update collapse all button visibility
        this.updateCollapseAllButtonVisibility();

        // Dispatch render complete event
        window.dispatchEvent(new CustomEvent("ui-rendered", {
            detail: { id: "propertiesPanel" }
        }));
    }

    /**
     * Render empty state when no entity is selected
     */
    renderEmptyState() {
        this.propertiesContent.innerHTML = `
            <div class="empty-state">
                <h3>No entity selected</h3>
                <p>Select a entity from the hierarchy to view its properties</p>
            </div>
        `;

        if (this.addComponentContainer) {
            this.addComponentContainer.style.display = 'none';
        }

        if (this.selectedEntityNameElement) {
            this.selectedEntityNameElement.textContent = 'Properties';
        }

        if (this.collapseAllBtn) {
            this.collapseAllBtn.style.display = 'none';
        }
    }

    /**
     * Update transform display values to match current entity state
     */
    updateTransform() {
        const entity = SM.getSelectedEntity();
        if (!entity) return;

        const entitySection = this.propertiesContent.querySelector('.entity-section');
        if (!entitySection) return;

        // Use transform handler to update inputs
        this.transformHandler.updateTransformInputs(entitySection, entity, this.utils);
    }

    /**
     * Update a property value programmatically
     * @param {string} componentId - The ID of the component
     * @param {string} propertyKey - The key of the property to update
     * @param {*} newValue - The new value to set
     */
    updateProperty(componentId, propertyKey, newValue) {
        this.propertyUpdater.updateProperty(componentId, propertyKey, newValue, this.utils);
    }

    /**
     * Handle Vector3 property changes (for backwards compatibility)
     */
    handleVector3Change(componentId, key, axis, value) {
        const entity = SM.getEntityById(SM.selectedEntity);
        if (!entity) return;

        const component = entity.components.find(c => c.id === componentId);
        if (!component || !component.properties[key]) return;

        const vector = component.properties[key];
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            const oldValue = this.utils.deepClone ? this.utils.deepClone(vector) : { ...vector };
            vector[axis] = numValue;

            const { ComponentPropertyChange } = this.changeManager.changeTypes || {};
            if (ComponentPropertyChange) {
                const change = new ComponentPropertyChange(componentId, key, vector, { source: 'ui', oldValue: oldValue });
                this.changeManager.applyChange(change);
            }
        }
    }

    /**
     * Delete a component from the selected entity (for backwards compatibility)
     */
    async deleteComponent(componentId, componentType) {
        const entityId = SM.selectedEntity;
        if (!entityId) return;

        const { RemoveComponentChange } = this.changeManager.changeTypes || {};
        if (RemoveComponentChange) {
            const change = new RemoveComponentChange(entityId, componentId, { source: 'ui' });
            this.changeManager.applyChange(change);
        }

        // Re-render after deletion
        setTimeout(() => this.render(entityId), 100);
    }

    /**
     * Move component up in the order (for backwards compatibility)
     */
    moveComponentUp(index) {
        if (index <= 0) return;

        const { ReorderComponentChange } = this.changeManager.changeTypes || {};
        if (ReorderComponentChange) {
            const change = new ReorderComponentChange(SM.selectedEntity, index, index - 1, { source: 'ui' });
            this.changeManager.applyChange(change);
        }

        // Re-render after a short delay
        setTimeout(() => this.render(SM.selectedEntity), 100);
    }

    /**
     * Move component down in the order (for backwards compatibility)
     */
    moveComponentDown(index, totalComponents) {
        if (index >= totalComponents - 1) return;

        const { ReorderComponentChange } = this.changeManager.changeTypes || {};
        if (ReorderComponentChange) {
            const change = new ReorderComponentChange(SM.selectedEntity, index, index + 1, { source: 'ui' });
            this.changeManager.applyChange(change);
        }

        // Re-render after a short delay
        setTimeout(() => this.render(SM.selectedEntity), 100);
    }
}