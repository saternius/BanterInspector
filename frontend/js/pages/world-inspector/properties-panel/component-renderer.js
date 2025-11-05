/**
 * Component Renderer
 * Renders generic component sections with properties and actions
 */

export class ComponentRenderer {
    constructor(propertyInputRenderer, utils, changeManager) {
        this.propertyInputRenderer = propertyInputRenderer;
        this.utils = utils || {};
        this.changeManager = changeManager;
        this.collapsedComponents = new Set();
    }

    /**
     * Render a component
     * @param {Object} component - Component to render
     * @param {number} index - Component index in entity's component array
     * @param {number} totalComponents - Total number of components
     * @param {string} entityId - Parent entity ID
     * @param {boolean} showLoadSettings - Whether to show async toggle
     * @returns {HTMLElement} - The component section element
     */
    renderComponent(component, index, totalComponents, entityId, showLoadSettings = false) {
        const section = document.createElement('div');
        section.className = 'component-section';
        section.dataset.panel = 'propertyPanelComponent';
        section.dataset.componentId = component.id;
        section.dataset.componentIndex = index;

        // Create header
        const header = this.createComponentHeader(component, index, totalComponents, entityId);
        section.appendChild(header);

        // Create body
        const body = this.createComponentBody(component, showLoadSettings);
        section.appendChild(body);

        // Setup toggle functionality
        this.setupToggleFunctionality(header, body, entityId, component, index);

        return section;
    }

    /**
     * Create component header with actions
     */
    createComponentHeader(component, index, totalComponents, entityId) {
        const header = document.createElement('div');
        header.className = 'component-header';

        const headerContent = document.createElement('div');
        headerContent.style.display = 'flex';
        headerContent.style.alignItems = 'center';
        headerContent.style.width = '100%';
        headerContent.style.justifyContent = 'space-between';

        // Title
        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `
            <span class="component-name">${component.type}</span>
            <span class="component-type">${component.id}</span>
        `;

        // Actions
        const actionsDiv = this.createActionButtons(component, index, totalComponents, entityId);

        headerContent.appendChild(titleDiv);
        headerContent.appendChild(actionsDiv);
        header.appendChild(headerContent);

        return header;
    }

    /**
     * Create action buttons for component header
     */
    createActionButtons(component, index, totalComponents, entityId) {
        const { ReorderComponentChange, RemoveComponentChange } = this.changeManager.changeTypes || {};
        const { confirm } = this.utils;

        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.alignItems = 'center';
        actionsDiv.style.gap = '8px';

        // Up arrow - hide if component is at the top
        if (index > 0) {
            const upBtn = document.createElement('button');
            upBtn.className = 'component-reorder-btn';
            upBtn.innerHTML = '↑';
            upBtn.title = 'Move up';
            upBtn.onmousedown = (e) => {
                e.stopPropagation();
                if (ReorderComponentChange) {
                    const change = new ReorderComponentChange(entityId, index, index - 1, { source: 'ui' });
                    this.changeManager.applyChange(change);
                    // Trigger re-render
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('component-reordered'));
                    }, 100);
                }
            };
            actionsDiv.appendChild(upBtn);
        }

        // Down arrow - hide if component is the last one
        if (index < totalComponents - 1) {
            const downBtn = document.createElement('button');
            downBtn.className = 'component-reorder-btn';
            downBtn.innerHTML = '↓';
            downBtn.title = 'Move down';
            downBtn.onmousedown = (e) => {
                e.stopPropagation();
                if (ReorderComponentChange) {
                    const change = new ReorderComponentChange(entityId, index, index + 1, { source: 'ui' });
                    this.changeManager.applyChange(change);
                    // Trigger re-render
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('component-reordered'));
                    }, 100);
                }
            };
            actionsDiv.appendChild(downBtn);
        }

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'component-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete component';
        deleteBtn.onmousedown = async (e) => {
            e.stopPropagation();
            const shouldDelete = confirm ? await confirm(`Delete ${component.type} component?`) : window.confirm(`Delete ${component.type} component?`);
            if (shouldDelete && RemoveComponentChange) {
                const change = new RemoveComponentChange(entityId, component.id, { source: 'ui' });
                this.changeManager.applyChange(change);
                // Trigger re-render
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('component-deleted'));
                }, 100);
            }
        };
        actionsDiv.appendChild(deleteBtn);

        // Toggle span
        const toggleSpan = document.createElement('span');
        toggleSpan.className = 'component-toggle';
        toggleSpan.textContent = '▼';
        actionsDiv.appendChild(toggleSpan);

        return actionsDiv;
    }

    /**
     * Create component body with properties
     */
    createComponentBody(component, showLoadSettings) {
        const body = document.createElement('div');
        body.className = 'component-body';

        // Add async loading toggle if Load Settings is enabled
        if (showLoadSettings) {
            const asyncRow = this.createAsyncToggleRow(component);
            body.appendChild(asyncRow);
        }

        // Add component controls (buttons from _controls)
        if (component._controls) {
            this.renderComponentControls(component._controls, component, body);
        }

        // Render properties
        if (component.properties) {
            Object.entries(component.properties).forEach(([key, value], propIndex) => {
                const propertyRow = this.propertyInputRenderer.renderProperty(
                    key,
                    value,
                    component,
                    0,  // componentIndex not needed here
                    propIndex
                );
                body.appendChild(propertyRow);
            });
        }

        return body;
    }

    /**
     * Render component controls (custom buttons)
     */
    renderComponentControls(controls, component, body) {
        if (!controls || !controls.controls) return;

        Object.values(controls.controls).forEach(control => {
            if (control.input === "button") {
                const button = document.createElement('button');
                button.className = 'property-button prop-control-btn';
                button.textContent = control.label;
                button.id = `${component.id}_${control.id}`;
                button.onmousedown = control.callback;
                body.appendChild(button);
            }
        });
    }

    /**
     * Create async toggle row for component
     */
    createAsyncToggleRow(component) {
        const row = document.createElement('div');
        row.className = 'async-toggle-row';

        const label = document.createElement('span');
        label.className = 'property-label';
        label.textContent = 'Async';
        label.style.fontWeight = 'bold';
        label.style.flex = "none";

        const valueContainer = document.createElement('div');
        valueContainer.className = 'property-value';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'checkbox-input';
        input.style.flex = "none";

        // Check component.loadAsync
        input.checked = component.loadAsync || false;

        input.onchange = () => {
            console.log("loadAsync changed", input.checked);
            component.loadAsync = input.checked;
        };

        valueContainer.appendChild(input);

        row.appendChild(document.createElement('span')); // Empty space for button
        row.appendChild(label);
        row.appendChild(valueContainer);

        return row;
    }

    /**
     * Setup toggle functionality for expand/collapse
     */
    setupToggleFunctionality(header, body, entityId, component, index) {
        const componentKey = `${entityId}_${component.type}_${index}`;
        let isExpanded = !this.collapsedComponents.has(componentKey);

        // Apply initial state
        body.style.display = isExpanded ? 'block' : 'none';
        const toggle = header.querySelector('.component-toggle');
        if (toggle) {
            toggle.textContent = isExpanded ? '▼' : '▶';
        }

        header.onmousedown = () => {
            isExpanded = !isExpanded;
            body.style.display = isExpanded ? 'block' : 'none';
            if (toggle) {
                toggle.textContent = isExpanded ? '▼' : '▶';
            }

            // Save collapsed state
            if (isExpanded) {
                this.collapsedComponents.delete(componentKey);
            } else {
                this.collapsedComponents.add(componentKey);
            }

            // Notify about collapse state change
            window.dispatchEvent(new CustomEvent('component-collapse-changed'));
        };
    }

    /**
     * Get the set of collapsed components
     * @returns {Set} - Set of collapsed component keys
     */
    getCollapsedComponents() {
        return this.collapsedComponents;
    }

    /**
     * Set the collapsed components
     * @param {Set} collapsedSet - Set of component keys to collapse
     */
    setCollapsedComponents(collapsedSet) {
        this.collapsedComponents = new Set(collapsedSet);
    }

    /**
     * Clear all collapsed states
     */
    clearCollapsedStates() {
        this.collapsedComponents.clear();
    }

    /**
     * Collapse all components for an entity
     * @param {string} entityId - The entity ID
     * @param {Array} components - Array of components
     */
    collapseAll(entityId, components) {
        components.forEach((component, index) => {
            const componentKey = `${entityId}_${component.type}_${index}`;
            this.collapsedComponents.add(componentKey);
        });
    }
}