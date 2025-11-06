/**
 * ScriptRunner Renderer
 * Specialized renderer for ScriptRunner components with script management
 */

import { VectorColorInputRenderer } from './vector-color-inputs.js';

export class ScriptRunnerRenderer {
    constructor(propertyInputRenderer, utils, changeManager) {
        this.propertyInputRenderer = propertyInputRenderer;
        this.utils = utils || {};
        this.changeManager = changeManager;
        this.vectorColorRenderer = new VectorColorInputRenderer(utils);
        this.collapsedComponents = new Set();
    }

    /**
     * Render ScriptRunner component with special handling
     * @param {Object} component - ScriptRunner component
     * @param {number} index - Component index in entity's component array
     * @param {number} totalComponents - Total number of components
     * @param {string} entityId - Parent entity ID
     * @returns {HTMLElement} - The component section element
     */
    renderScriptRunnerComponent(component, index, totalComponents, entityId) {
        const section = document.createElement('div');
        section.className = 'component-section';
        section.dataset.panel = 'propertyPanelComponent';
        section.dataset.componentId = component.id;
        section.dataset.componentIndex = index;

        // Create header
        const header = this.createScriptRunnerHeader(component, index, totalComponents, entityId);
        section.appendChild(header);

        // Create body
        const body = this.createScriptRunnerBody(component, entityId);
        section.appendChild(body);

        // Setup toggle functionality
        this.setupToggleFunctionality(header, body, entityId, component, index);

        return section;
    }

    /**
     * Create ScriptRunner header with special actions
     */
    createScriptRunnerHeader(component, index, totalComponents, entityId) {
        const header = document.createElement('div');
        header.className = 'component-header runner-header';

        const headerContent = document.createElement('div');
        headerContent.style.display = 'flex';
        headerContent.style.alignItems = 'center';
        headerContent.style.width = '100%';
        headerContent.style.justifyContent = 'space-between';

        // Title with owner
        const titleDiv = document.createElement('div');
        const ownerColor = this.getUserColor(component.properties._owner);
        titleDiv.innerHTML = `
            <span class="component-name">ScriptRunner</span>
            <span class="component-type">${component.id}</span>
            <span class="component-owner" style="color:${ownerColor}">${component.properties._owner}</span>
        `;

        // Actions
        const actionsDiv = this.createScriptRunnerActions(component, index, totalComponents, entityId);

        headerContent.appendChild(titleDiv);
        headerContent.appendChild(actionsDiv);
        header.appendChild(headerContent);

        return header;
    }

    /**
     * Get user color for display
     */
    getUserColor(owner) {
        // This would normally come from a user color mapping
        // For now, return a default color
        if (typeof getUserColor === 'function') {
            return getUserColor(owner);
        }
        return '#888';
    }

    /**
     * Create ScriptRunner-specific action buttons
     */
    createScriptRunnerActions(component, index, totalComponents, entityId) {
        const { ReorderComponentChange, RemoveComponentChange } = this.changeManager.changeTypes || {};
        const { confirm } = this.utils;

        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.alignItems = 'center';
        actionsDiv.style.gap = '8px';

        // Refresh button for ScriptRunner
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'component-reorder-btn';
        refreshBtn.innerHTML = '↻';
        refreshBtn.title = 'Refresh script';
        refreshBtn.onmousedown = (e) => {
            e.stopPropagation();
            if (component.Refresh) {
                component.Refresh();
            }
        };
        actionsDiv.appendChild(refreshBtn);

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
            const shouldDelete = confirm ? await confirm(`Delete ScriptRunner component?`) : window.confirm(`Delete ScriptRunner component?`);
            if (shouldDelete && RemoveComponentChange) {
                const change = new RemoveComponentChange(entityId, component.id, { source: 'ui' });
                this.changeManager.applyChange(change);
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
     * Create ScriptRunner body with script properties and vars
     */
    createScriptRunnerBody(component, entityId) {
        const { ComponentPropertyChange } = this.changeManager.changeTypes || {};

        const body = document.createElement('div');
        body.className = 'component-body';

        // Name property
        const nameRow = this.propertyInputRenderer.createPropertyRow(
            'Name',
            component.properties.name || 'myScript',
            'text',
            (value) => {
                component.properties.name = value;
                if (ComponentPropertyChange) {
                    const change = new ComponentPropertyChange(component.id, 'name', value, { source: 'ui' });
                    this.changeManager.applyChange(change);
                }
            }
        );
        body.appendChild(nameRow);

        // File property with dropdown
        const fileRow = this.createFileSelectionRow(component, entityId);
        body.appendChild(fileRow);

        // Render vars if any
        if (component.ctx && component.ctx.vars && Object.keys(component.ctx.vars).length > 0) {
            const varsHeader = this.createVarsHeader();
            body.appendChild(varsHeader);

            // Render each variable
            Object.entries(component.ctx.vars).forEach(([varName, varValue]) => {
                const varRow = this.renderScriptRunnerVar(varName, varValue, component);
                body.appendChild(varRow);
            });
        }

        // Add Edit Script button
        if (component.properties.file) {
            const editButton = this.createEditScriptButton(component);
            body.appendChild(editButton);
        }

        return body;
    }

    /**
     * Create file selection dropdown row
     */
    createFileSelectionRow(component, entityId) {
        const { ComponentPropertyChange } = this.changeManager.changeTypes || {};

        const fileRow = document.createElement('div');
        fileRow.className = 'property-row';

        const fileLabel = document.createElement('span');
        fileLabel.className = 'property-label';
        fileLabel.textContent = 'Script File';

        const fileContainer = document.createElement('div');
        fileContainer.className = 'property-value';

        const fileSelect = document.createElement('select');
        fileSelect.className = 'property-input';
        fileSelect.style.width = '100%';

        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select Script --';
        fileSelect.appendChild(emptyOption);

        // Get available scripts from inventory
        if (typeof window !== 'undefined' && window.inventory) {
            const scripts = SM.getAllScriptAssets().map(x=>x.properties);

            // Add current script if it exists
            const addScriptOption = (script) => {
                if (!script) return;
                const option = document.createElement('option');
                option.value = script.name;
                option.textContent = `${script.name} (by ${script.author})`;
                if (component.properties.file === script.name) {
                    option.selected = true;
                }
                fileSelect.appendChild(option);
            };

            // Add current file first if it exists
            if (window.inventory.items && window.inventory.items[component.properties.file]) {
                addScriptOption(window.inventory.items[component.properties.file]);
            }

            // Add other available scripts
            scripts.forEach(script => {
                if (script.name !== component.properties.file) {
                    addScriptOption(script);
                }
            });
        }

        fileSelect.onchange = async () => {
            if (component.properties.file === fileSelect.value) return;

            if (ComponentPropertyChange) {
                const change = new ComponentPropertyChange(component.id, 'file', fileSelect.value, { source: 'ui' });
                this.changeManager.applyChange(change);

                // Trigger re-render to show vars
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('scriptrunner-file-changed', { detail: { entityId } }));
                }, 100);
            }
        };

        fileContainer.appendChild(fileSelect);
        fileRow.appendChild(document.createElement('span')); // Empty space for button
        fileRow.appendChild(fileLabel);
        fileRow.appendChild(fileContainer);

        return fileRow;
    }

    /**
     * Create vars header
     */
    createVarsHeader() {
        const varsHeader = document.createElement('div');
        varsHeader.className = 'property-row';
        varsHeader.style.marginTop = '12px';
        varsHeader.style.fontWeight = 'bold';
        varsHeader.innerHTML = '<span></span><span>Script Variables</span><span></span>';
        return varsHeader;
    }

    /**
     * Render a ScriptRunner variable
     */
    renderScriptRunnerVar(varName, varValue, component) {
        const { ScriptRunnerVarChange } = this.changeManager.changeTypes || {};
        const { formatPropertyName } = this.utils;

        const row = document.createElement('div');
        row.className = 'property-row';

        const label = document.createElement('span');
        label.className = 'property-label';
        label.textContent = formatPropertyName ? formatPropertyName(varName) : varName;
        label.title = varName;

        const valueContainer = document.createElement('div');
        valueContainer.className = 'property-value';

        // Determine type and render appropriate input
        if (varValue.type === 'boolean') {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'checkbox-input';
            input.checked = varValue.value;
            input.onchange = () => {
                if (ScriptRunnerVarChange) {
                    const change = new ScriptRunnerVarChange(
                        component.id,
                        varName,
                        { type: 'boolean', value: input.checked },
                        { source: 'ui' }
                    );
                    this.changeManager.applyChange(change);
                }
            };
            valueContainer.appendChild(input);

        } else if (varValue.type === 'number') {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'property-input number';
            input.value = varValue.value;
            input.step = 'any';
            input.onchange = () => {
                const numValue = parseFloat(input.value);
                if (!isNaN(numValue) && ScriptRunnerVarChange) {
                    const change = new ScriptRunnerVarChange(
                        component.id,
                        varName,
                        { type: 'number', value: numValue },
                        { source: 'ui' }
                    );
                    this.changeManager.applyChange(change);
                }
            };
            valueContainer.appendChild(input);

        } else if (varValue.type === 'vector3') {
            // Vector3 variable
            const vectorGroup = document.createElement('div');
            vectorGroup.className = 'vector-group';

            ['x', 'y', 'z'].forEach(axis => {
                const axisLabel = document.createElement('span');
                axisLabel.className = 'vector-label';
                axisLabel.textContent = axis.toUpperCase();

                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'property-input number';
                input.value = varValue.value[axis] || 0;
                input.step = 'any';
                input.onchange = () => {
                    const numValue = parseFloat(input.value);
                    if (!isNaN(numValue) && ScriptRunnerVarChange) {
                        varValue.value[axis] = numValue;
                        const change = new ScriptRunnerVarChange(
                            component.id,
                            varName,
                            { type: 'vector3', value: varValue.value },
                            { source: 'ui' }
                        );
                        this.changeManager.applyChange(change);
                    }
                };

                vectorGroup.appendChild(axisLabel);
                vectorGroup.appendChild(input);
            });

            valueContainer.appendChild(vectorGroup);

        } else if (varValue.type === 'color') {
            // Color variable
            const colorInput = this.vectorColorRenderer.createColorInput(
                varName,
                varValue.value,
                component.id,
                component,
                (newColor) => {
                    if (ScriptRunnerVarChange) {
                        const change = new ScriptRunnerVarChange(
                            component.id,
                            varName,
                            { type: 'color', value: newColor },
                            { source: 'ui' }
                        );
                        this.changeManager.applyChange(change);
                    }
                },
                true  // isScriptRunnerVar
            );
            valueContainer.appendChild(colorInput);

        } else {
            // String or other types
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'property-input';
            input.value = varValue.value?.toString() || '';
            input.onchange = () => {
                if (ScriptRunnerVarChange) {
                    const change = new ScriptRunnerVarChange(
                        component.id,
                        varName,
                        { type: 'string', value: input.value },
                        { source: 'ui' }
                    );
                    this.changeManager.applyChange(change);
                }
            };
            valueContainer.appendChild(input);
        }

        row.appendChild(document.createElement('span')); // Empty space for button
        row.appendChild(label);
        row.appendChild(valueContainer);

        return row;
    }

    /**
     * Create Edit Script button
     */
    createEditScriptButton(component) {
        const editButtonRow = document.createElement('div');
        editButtonRow.className = 'property-row';
        editButtonRow.style.marginTop = '12px';
        editButtonRow.style.paddingTop = '12px';
        editButtonRow.style.borderTop = '1px solid #333';

        const editButton = document.createElement('button');
        editButton.className = 'edit-script-btn';
        editButton.style.width = '100%';
        editButton.style.padding = '8px';
        editButton.style.backgroundColor = 'rgb(42 52 60)';
        editButton.style.color = 'white';
        editButton.style.border = 'none';
        editButton.style.borderRadius = '4px';
        editButton.style.cursor = 'pointer';
        editButton.innerHTML = '📝 Edit Script';

        editButton.onmousedown = () => {
            if (typeof window !== 'undefined' && window.inventory && window.inventory.items) {
                const scriptItem = window.inventory.items[component.properties.file];
                if (scriptItem && scriptItem.itemType === 'script') {
                    const event = new CustomEvent('open-script-editor', {
                        detail: {
                            name: component.properties.file,
                            content: scriptItem.data,
                            author: scriptItem.author,
                            created: scriptItem.created
                        }
                    });
                    window.dispatchEvent(event);
                }
            }
        };

        editButton.onmouseover = () => {
            editButton.style.backgroundColor = 'rgb(41 70 92)';
        };

        editButton.onmouseout = () => {
            editButton.style.backgroundColor = 'rgb(42 52 60)';
        };

        editButtonRow.appendChild(document.createElement('span')); // Empty space for button column
        editButtonRow.appendChild(document.createElement('span')); // Empty space for label column
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'property-value';
        buttonContainer.appendChild(editButton);
        editButtonRow.appendChild(buttonContainer);

        return editButtonRow;
    }

    /**
     * Setup toggle functionality
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
}