/**
 * Script Renderer
 * Specialized renderer for Script components with code display and variable management
 */

import { VectorColorInputRenderer } from './vector-color-inputs.js';

export class ScriptRenderer {
    constructor(propertyInputRenderer, utils, changeManager) {
        this.propertyInputRenderer = propertyInputRenderer;
        this.utils = utils || {};
        this.changeManager = changeManager;
        this.vectorColorRenderer = new VectorColorInputRenderer(utils);
        this.collapsedComponents = new Set();
        this.collapsedVars = new Set(); // Track which vars sections are collapsed
    }

    /**
     * Render Script component with special handling
     * @param {Object} component - Script component
     * @param {number} index - Component index in entity's component array
     * @param {number} totalComponents - Total number of components
     * @param {string} entityId - Parent entity ID
     * @returns {HTMLElement} - The component section element
     */
    renderScriptComponent(component, index, totalComponents, entityId) {
        const section = document.createElement('div');
        section.className = 'component-section';
        section.dataset.panel = 'propertyPanelComponent';
        section.dataset.componentId = component.id;
        section.dataset.componentIndex = index;

        // Create header
        const header = this.createScriptHeader(component, index, totalComponents, entityId);
        section.appendChild(header);

        // Create body
        const body = this.createScriptBody(component, entityId);
        section.appendChild(body);

        // Setup toggle functionality
        this.setupToggleFunctionality(header, body, entityId, component, index);

        return section;
    }

    /**
     * Create Script header with special actions
     */
    createScriptHeader(component, index, totalComponents, entityId) {
        const header = document.createElement('div');
        header.className = 'component-header';

        const headerContent = document.createElement('div');
        headerContent.style.display = 'flex';
        headerContent.style.alignItems = 'center';
        headerContent.style.width = '100%';
        headerContent.style.justifyContent = 'space-between';

        // Title with owner
        const titleDiv = document.createElement('div');
        const ownerColor = this.getUserColor(component.properties._owner);
        titleDiv.innerHTML = `
            <span class="component-name">Script</span>
            <span class="component-type">${component.id}</span>
            <span class="component-owner" style="color:${ownerColor}">${component.properties._owner}</span>
        `;

        // Actions
        const actionsDiv = this.createScriptActions(component, index, totalComponents, entityId);

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
     * Create Script-specific action buttons
     */
    createScriptActions(component, index, totalComponents, entityId) {
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
            const shouldDelete = confirm ? await confirm(`Delete Script component?`) : window.confirm(`Delete Script component?`);
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
     * Create Script body with name, data, and vars
     */
    createScriptBody(component, entityId) {
        const body = document.createElement('div');
        body.className = 'component-body';

        // Name property (read-only)
        const nameRow = this.createReadOnlyNameRow(component);
        body.appendChild(nameRow);

        // Data property (JavaScript code)
        const dataRow = this.createDataCodeRow(component);
        body.appendChild(dataRow);

        // Vars property (String:DataType map builder)
        const varsSection = this.createVarsSection(component, entityId);
        body.appendChild(varsSection);

        return body;
    }

    /**
     * Create read-only name row
     */
    createReadOnlyNameRow(component) {
        const nameRow = document.createElement('div');
        nameRow.className = 'property-row';

        const label = document.createElement('span');
        label.className = 'property-label';
        label.textContent = 'Name';

        const valueContainer = document.createElement('div');
        valueContainer.className = 'property-value';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'property-input';
        input.value = component.properties.name || 'myScript';
        input.readOnly = true;
        input.style.backgroundColor = '#1a1a1a';
        input.style.cursor = 'not-allowed';
        input.style.opacity = '0.7';

        valueContainer.appendChild(input);
        nameRow.appendChild(document.createElement('span')); // Empty space for button
        nameRow.appendChild(label);
        nameRow.appendChild(valueContainer);

        return nameRow;
    }

    /**
     * Create data code display row
     */
    createDataCodeRow(component) {
        const dataRow = document.createElement('div');
        dataRow.style.marginTop = '12px';
        dataRow.style.marginBottom = '12px';

        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.justifyContent = 'space-between';
        headerRow.style.alignItems = 'center';
        headerRow.style.marginBottom = '8px';

        const label = document.createElement('span');
        label.style.fontWeight = '600';
        label.style.fontSize = '13px';
        label.style.color = '#aaa';
        label.textContent = 'Data (JavaScript)';

        const lineCount = document.createElement('span');
        lineCount.style.fontSize = '11px';
        lineCount.style.color = '#666';
        const lines = (component.properties.data || '').split('\n').length;
        lineCount.textContent = `${lines} lines`;

        headerRow.appendChild(label);
        headerRow.appendChild(lineCount);

        // Container for textarea and overlay button
        const textareaContainer = document.createElement('div');
        textareaContainer.style.position = 'relative';

        const textarea = document.createElement('textarea');
        textarea.className = 'property-input';
        textarea.value = component.properties.data || '';
        textarea.rows = Math.min(Math.max(lines, 5), 15);
        textarea.readOnly = true;
        textarea.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace';
        textarea.style.fontSize = '12px';
        textarea.style.lineHeight = '1.5';
        textarea.style.whiteSpace = 'pre';
        textarea.style.overflowX = 'auto';
        textarea.style.backgroundColor = '#0d0d0d';
        textarea.style.color = '#d4d4d4';
        textarea.style.border = '1px solid #2a2a2a';
        textarea.style.borderRadius = '4px';
        textarea.style.padding = '12px';
        textarea.style.paddingTop = '40px'; // Make room for edit button
        textarea.style.resize = 'vertical';
        textarea.style.width = '100%';
        textarea.style.boxSizing = 'border-box';
        textarea.style.cursor = 'default';

        // Create overlay edit button
        const editButton = document.createElement('button');
        editButton.innerHTML = '✏️ Edit';
        editButton.style.position = 'absolute';
        editButton.style.top = '8px';
        editButton.style.right = '8px';
        editButton.style.padding = '6px 12px';
        editButton.style.backgroundColor = '#2a4a6a';
        editButton.style.color = '#fff';
        editButton.style.border = 'none';
        editButton.style.borderRadius = '4px';
        editButton.style.cursor = 'pointer';
        editButton.style.fontSize = '12px';
        editButton.style.fontWeight = '600';
        editButton.style.transition = 'background-color 0.2s';
        editButton.style.zIndex = '10';

        editButton.onmouseover = () => {
            editButton.style.backgroundColor = '#3a5a7a';
        };

        editButton.onmouseout = () => {
            editButton.style.backgroundColor = '#2a4a6a';
        };

        editButton.onmousedown = (e) => {
            e.stopPropagation();
            // Dispatch event to open script editor
            const event = new CustomEvent('open-script-editor', {
                detail: {
                    name: component.properties.name || 'myScript',
                    content: component.properties.data || '',
                    author: component.properties._owner || 'Unknown',
                    created: Date.now(),
                    isScriptComponent: true,
                    componentId: component.id
                }
            });
            window.dispatchEvent(event);
        };

        textareaContainer.appendChild(textarea);
        textareaContainer.appendChild(editButton);

        dataRow.appendChild(headerRow);
        dataRow.appendChild(textareaContainer);

        return dataRow;
    }

    /**
     * Create vars section with map builder
     */
    createVarsSection(component, entityId) {
        const varsContainer = document.createElement('div');
        varsContainer.style.marginTop = '16px';
        varsContainer.style.paddingTop = '16px';
        varsContainer.style.borderTop = '1px solid #333';

        // Vars header with toggle
        const varsHeader = this.createVarsHeader(component);
        varsContainer.appendChild(varsHeader);

        // Vars body (collapsible)
        const varsBody = this.createVarsBody(component);
        varsContainer.appendChild(varsBody);

        // Setup vars toggle
        this.setupVarsToggle(varsHeader, varsBody, component, entityId);

        return varsContainer;
    }

    /**
     * Create vars header with toggle
     */
    createVarsHeader(component) {
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.cursor = 'pointer';
        header.style.padding = '10px 12px';
        header.style.backgroundColor = '#1a1a1a';
        header.style.border = '1px solid #2a2a2a';
        header.style.borderRadius = '6px';
        header.style.marginBottom = '12px';
        header.style.transition = 'background-color 0.2s';

        header.onmouseover = () => {
            header.style.backgroundColor = '#222';
        };

        header.onmouseout = () => {
            header.style.backgroundColor = '#1a1a1a';
        };

        const title = document.createElement('span');
        title.style.fontWeight = '600';
        title.style.fontSize = '13px';
        title.style.color = '#aaa';
        const varsCount = Object.keys(component.properties.vars || {}).length;
        title.textContent = `Variables`;

        const badge = document.createElement('span');
        badge.style.display = 'inline-block';
        badge.style.marginLeft = '8px';
        badge.style.padding = '2px 8px';
        badge.style.backgroundColor = '#2a4a6a';
        badge.style.color = '#5b9dd6';
        badge.style.borderRadius = '10px';
        badge.style.fontSize = '11px';
        badge.style.fontWeight = '600';
        badge.textContent = varsCount.toString();

        const titleContainer = document.createElement('div');
        titleContainer.appendChild(title);
        titleContainer.appendChild(badge);

        const toggle = document.createElement('span');
        toggle.className = 'vars-toggle';
        toggle.textContent = '▼';
        toggle.style.fontSize = '12px';
        toggle.style.color = '#666';

        header.appendChild(titleContainer);
        header.appendChild(toggle);

        return header;
    }

    /**
     * Create vars body with variable list and add button
     */
    createVarsBody(component) {
        const body = document.createElement('div');
        body.className = 'vars-body';

        // Render existing variables
        const vars = component.properties.vars || {};
        Object.entries(vars).forEach(([varName, varData]) => {
            const varRow = this.renderScriptVar(varName, varData, component);
            body.appendChild(varRow);
        });

        // Add new variable section
        const addVarSection = this.createAddVarSection(component);
        body.appendChild(addVarSection);

        return body;
    }

    /**
     * Setup vars toggle functionality
     */
    setupVarsToggle(header, body, component, entityId) {
        const varsKey = `${entityId}_${component.id}_vars`;
        let isExpanded = !this.collapsedVars.has(varsKey);

        // Apply initial state
        body.style.display = isExpanded ? 'block' : 'none';
        const toggle = header.querySelector('.vars-toggle');
        if (toggle) {
            toggle.textContent = isExpanded ? '▼' : '▶';
        }

        header.onmousedown = (e) => {
            e.stopPropagation();
            isExpanded = !isExpanded;
            body.style.display = isExpanded ? 'block' : 'none';
            if (toggle) {
                toggle.textContent = isExpanded ? '▼' : '▶';
            }

            // Save collapsed state
            if (isExpanded) {
                this.collapsedVars.delete(varsKey);
            } else {
                this.collapsedVars.add(varsKey);
            }
        };
    }

    /**
     * Render a Script variable
     */
    renderScriptVar(varName, varData, component) {
        const { ComponentPropertyChange } = this.changeManager.changeTypes || {};
        const { formatPropertyName } = this.utils;

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.backgroundColor = '#0d0d0d';
        row.style.border = '1px solid #2a2a2a';
        row.style.padding = '10px 12px';
        row.style.marginBottom = '6px';
        row.style.borderRadius = '6px';
        row.style.gap = '12px';

        // Left side: Name and type badge
        const leftSide = document.createElement('div');
        leftSide.style.display = 'flex';
        leftSide.style.alignItems = 'center';
        leftSide.style.gap = '10px';
        leftSide.style.minWidth = '140px';

        const nameLabel = document.createElement('span');
        nameLabel.style.fontWeight = '500';
        nameLabel.style.fontSize = '13px';
        nameLabel.style.color = '#ddd';
        nameLabel.textContent = formatPropertyName ? formatPropertyName(varName) : varName;
        nameLabel.title = varName;

        const typeBadge = document.createElement('span');
        typeBadge.style.padding = '2px 6px';
        typeBadge.style.borderRadius = '4px';
        typeBadge.style.fontSize = '10px';
        typeBadge.style.fontWeight = '600';
        typeBadge.style.textTransform = 'uppercase';

        // Color code by type
        const typeColors = {
            'string': { bg: '#2a3a2a', color: '#6db46d' },
            'number': { bg: '#3a2a4a', color: '#b46dd6' },
            'boolean': { bg: '#2a3a4a', color: '#6d9dd6' }
        };
        const colors = typeColors[varData.type] || { bg: '#2a2a2a', color: '#888' };
        typeBadge.style.backgroundColor = colors.bg;
        typeBadge.style.color = colors.color;
        typeBadge.textContent = varData.type;

        leftSide.appendChild(nameLabel);
        leftSide.appendChild(typeBadge);

        // Right side: Input and delete button
        const rightSide = document.createElement('div');
        rightSide.style.display = 'flex';
        rightSide.style.alignItems = 'center';
        rightSide.style.gap = '8px';
        rightSide.style.flex = '1';

        // Render appropriate input based on type
        const input = this.createVarInput(varName, varData, component);
        input.style.flex = '1';
        input.style.maxWidth = '300px';
        rightSide.appendChild(input);

        // Delete variable button
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete variable';
        deleteBtn.style.padding = '4px 8px';
        deleteBtn.style.backgroundColor = 'transparent';
        deleteBtn.style.color = '#666';
        deleteBtn.style.border = '1px solid #333';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '16px';
        deleteBtn.style.lineHeight = '1';
        deleteBtn.style.transition = 'all 0.2s';

        deleteBtn.onmouseover = () => {
            deleteBtn.style.backgroundColor = '#4a2a2a';
            deleteBtn.style.color = '#d66';
            deleteBtn.style.borderColor = '#4a2a2a';
        };

        deleteBtn.onmouseout = () => {
            deleteBtn.style.backgroundColor = 'transparent';
            deleteBtn.style.color = '#666';
            deleteBtn.style.borderColor = '#333';
        };

        deleteBtn.onmousedown = (e) => {
            e.stopPropagation();
            const vars = { ...component.properties.vars };
            delete vars[varName];

            // Firebase doesn't support empty objects {}, so use null when no vars remain
            const newVars = Object.keys(vars).length === 0 ? null : vars;

            if (ComponentPropertyChange) {
                const change = new ComponentPropertyChange(component.id, 'vars', newVars, { source: 'ui' });
                this.changeManager.applyChange(change);
                // Trigger re-render
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('component-reordered'));
                }, 100);
            }
        };
        rightSide.appendChild(deleteBtn);

        row.appendChild(leftSide);
        row.appendChild(rightSide);

        return row;
    }

    /**
     * Create input for a variable based on its type
     */
    createVarInput(varName, varData, component) {
        const { ComponentPropertyChange } = this.changeManager.changeTypes || {};

        const updateVar = (newValue) => {
            // Handle the case where vars might be null
            const currentVars = component.properties.vars || {};
            const vars = { ...currentVars };
            vars[varName] = { type: varData.type, value: newValue };

            if (ComponentPropertyChange) {
                const change = new ComponentPropertyChange(component.id, 'vars', vars, { source: 'ui' });
                this.changeManager.applyChange(change);
            }
        };

        switch (varData.type) {
            case 'boolean':
                const checkboxContainer = document.createElement('div');
                checkboxContainer.style.display = 'flex';
                checkboxContainer.style.alignItems = 'center';
                checkboxContainer.style.gap = '8px';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = varData.value;
                checkbox.style.width = '18px';
                checkbox.style.height = '18px';
                checkbox.style.cursor = 'pointer';
                checkbox.onchange = () => updateVar(checkbox.checked);

                const checkboxLabel = document.createElement('span');
                checkboxLabel.style.fontSize = '12px';
                checkboxLabel.style.color = '#888';
                checkboxLabel.textContent = checkbox.checked ? 'true' : 'false';

                checkbox.onchange = () => {
                    updateVar(checkbox.checked);
                    checkboxLabel.textContent = checkbox.checked ? 'true' : 'false';
                };

                checkboxContainer.appendChild(checkbox);
                checkboxContainer.appendChild(checkboxLabel);
                return checkboxContainer;

            case 'number':
                const numberInput = document.createElement('input');
                numberInput.type = 'number';
                numberInput.className = 'property-input';
                numberInput.value = varData.value;
                numberInput.step = 'any';
                numberInput.style.padding = '6px 10px';
                numberInput.onchange = () => {
                    const numValue = parseFloat(numberInput.value);
                    if (!isNaN(numValue)) {
                        updateVar(numValue);
                    }
                };
                return numberInput;

            case 'string':
            default:
                const textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.className = 'property-input';
                textInput.value = varData.value?.toString() || '';
                textInput.style.padding = '6px 10px';
                textInput.onchange = () => updateVar(textInput.value);
                return textInput;
        }
    }

    /**
     * Create add variable section
     */
    createAddVarSection(component) {
        const { ComponentPropertyChange } = this.changeManager.changeTypes || {};

        const section = document.createElement('div');
        section.style.marginTop = '16px';
        section.style.padding = '16px';
        section.style.backgroundColor = '#1a1a1a';
        section.style.border = '1px solid #2a2a2a';
        section.style.borderRadius = '6px';

        const title = document.createElement('div');
        title.textContent = 'Add New Variable';
        title.style.fontWeight = '600';
        title.style.fontSize = '13px';
        title.style.color = '#aaa';
        title.style.marginBottom = '12px';
        section.appendChild(title);

        // Form grid
        const formGrid = document.createElement('div');
        formGrid.style.display = 'grid';
        formGrid.style.gridTemplateColumns = '1fr 1fr';
        formGrid.style.gap = '10px';
        formGrid.style.marginBottom = '12px';

        // Variable name input
        const nameGroup = document.createElement('div');
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Name';
        nameLabel.style.display = 'block';
        nameLabel.style.fontSize = '11px';
        nameLabel.style.color = '#888';
        nameLabel.style.marginBottom = '4px';
        nameLabel.style.fontWeight = '500';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'property-input';
        nameInput.placeholder = 'variableName';
        nameInput.style.width = '100%';
        nameInput.style.boxSizing = 'border-box';

        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);
        formGrid.appendChild(nameGroup);

        // Type selector
        const typeGroup = document.createElement('div');
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Type';
        typeLabel.style.display = 'block';
        typeLabel.style.fontSize = '11px';
        typeLabel.style.color = '#888';
        typeLabel.style.marginBottom = '4px';
        typeLabel.style.fontWeight = '500';

        const typeSelect = document.createElement('select');
        typeSelect.className = 'property-input';
        typeSelect.style.width = '100%';
        typeSelect.style.boxSizing = 'border-box';

        const types = ['string', 'number', 'boolean'];
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            typeSelect.appendChild(option);
        });

        typeGroup.appendChild(typeLabel);
        typeGroup.appendChild(typeSelect);
        formGrid.appendChild(typeGroup);

        section.appendChild(formGrid);

        // Default value input (full width)
        const valueGroup = document.createElement('div');
        valueGroup.style.marginBottom = '12px';

        const valueLabel = document.createElement('label');
        valueLabel.textContent = 'Default Value';
        valueLabel.style.display = 'block';
        valueLabel.style.fontSize = '11px';
        valueLabel.style.color = '#888';
        valueLabel.style.marginBottom = '4px';
        valueLabel.style.fontWeight = '500';

        const defaultValueInput = document.createElement('input');
        defaultValueInput.type = 'text';
        defaultValueInput.className = 'property-input';
        defaultValueInput.placeholder = 'Enter default value';
        defaultValueInput.style.width = '100%';
        defaultValueInput.style.boxSizing = 'border-box';

        valueGroup.appendChild(valueLabel);
        valueGroup.appendChild(defaultValueInput);
        section.appendChild(valueGroup);

        // Add button
        const addButton = document.createElement('button');
        addButton.textContent = '+ Add Variable';
        addButton.style.width = '100%';
        addButton.style.padding = '10px';
        addButton.style.backgroundColor = '#2a4a6a';
        addButton.style.color = '#fff';
        addButton.style.border = 'none';
        addButton.style.borderRadius = '6px';
        addButton.style.cursor = 'pointer';
        addButton.style.fontWeight = '600';
        addButton.style.fontSize = '13px';
        addButton.style.transition = 'background-color 0.2s';

        addButton.onmousedown = (e) => {
            e.stopPropagation();
            const varName = nameInput.value.trim();
            const varType = typeSelect.value;
            const varValue = defaultValueInput.value;

            if (!varName) {
                alert('Please enter a variable name');
                return;
            }

            // Check if variable already exists
            const existingVars = component.properties.vars || {};
            if (existingVars[varName]) {
                alert('Variable with this name already exists');
                return;
            }

            // Convert value based on type
            let typedValue;
            switch (varType) {
                case 'boolean':
                    typedValue = varValue.toLowerCase() === 'true';
                    break;
                case 'number':
                    typedValue = parseFloat(varValue) || 0;
                    break;
                case 'string':
                default:
                    typedValue = varValue;
                    break;
            }

            // Add the variable
            // Handle the case where vars is null (all variables deleted)
            const currentVars = component.properties.vars || {};
            const vars = { ...currentVars };
            vars[varName] = { type: varType, value: typedValue };

            if (ComponentPropertyChange) {
                const change = new ComponentPropertyChange(component.id, 'vars', vars, { source: 'ui' });
                this.changeManager.applyChange(change);

                // Clear inputs
                nameInput.value = '';
                defaultValueInput.value = '';

                // Trigger re-render
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('component-reordered'));
                }, 100);
            }
        };

        addButton.onmouseover = () => {
            addButton.style.backgroundColor = '#3a5a7a';
        };

        addButton.onmouseout = () => {
            addButton.style.backgroundColor = '#2a4a6a';
        };

        section.appendChild(addButton);

        return section;
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
