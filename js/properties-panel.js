/**
 * Properties Panel
 * Handles component display and property editing
 */

// (async () => {
    const { formatPropertyName, rgbToHex, hexToRgb, isVector3Object, isQuaternion, quaternionToEuler, eulerToQuaternion, formatNumber } = await import(`${window.repoUrl}/js/utils.js`);
    const { changeManager } = await import(`${window.repoUrl}/js/change-manager.js`);
    const { SlotPropertyChange, ComponentPropertyChange, ComponentRemoveChange, MonoBehaviorVarChange } = await import(`${window.repoUrl}/js/change-types.js`);
    const { deepClone } = await import(`${window.repoUrl}/js/utils.js`);
    
    export class PropertiesPanel {
        constructor() {
            this.propertiesContent = document.getElementById('propertiesContent');
            this.addComponentContainer = document.getElementById('addComponentContainer');
            this.addComponentBtn = document.getElementById('addComponentBtn');
            this.selectedSlotNameElement = document.getElementById('selectedSlotName');
            
            // Store collapsed state of components
            this.collapsedComponents = new Set();
            
            this.setupEventListeners();
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Add component button
            this.addComponentBtn?.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showComponentMenu', {
                    detail: { slotId: SM.selectedSlot }
                }));
            });
        }

        /**
         * Render properties for a slot
         */
        render(slotId = null) {
            if (!this.propertiesContent) return;
            
            const slot = slotId ? SM.getSlotById(slotId) : null;
            
            if (!slot) {
                this.propertiesContent.innerHTML = `
                    <div class="empty-state">
                        <h3>No slot selected</h3>
                        <p>Select a slot from the hierarchy to view its properties</p>
                    </div>
                `;
                if (this.addComponentContainer) {
                    this.addComponentContainer.style.display = 'none';
                }
                if (this.selectedSlotNameElement) {
                    this.selectedSlotNameElement.textContent = 'Properties';
                }
                return;
            }
            
            // Update header
            if (this.selectedSlotNameElement) {
                this.selectedSlotNameElement.textContent = `Properties - ${slot.name}`;
            }
            
            // Clear content
            this.propertiesContent.innerHTML = '';
            
            // Slot properties section
            const slotSection = this.createSlotPropertiesSection(slot);
            this.propertiesContent.appendChild(slotSection);
            
            // Render components
            if (slot.components && slot.components.length > 0) {
                slot.components.forEach((component, index) => {
                    const componentElement = this.renderComponent(component, index);
                    this.propertiesContent.appendChild(componentElement);
                });
            }
            
            // Show add component button
            if (this.addComponentContainer) {
                this.addComponentContainer.style.display = 'block';
            }
        }

        /**
         * Create slot properties section
         */
        createSlotPropertiesSection(slot) {
            const section = document.createElement('div');
            section.className = 'component-section';
            
            const header = document.createElement('div');
            header.className = 'component-header';
            header.innerHTML = `
                <div>
                    <span class="component-name">Slot</span>
                    <span class="component-type">${slot.id}</span>
                </div>
            `;
            
            const body = document.createElement('div');
            body.className = 'component-body';
            
            // Name property with inline editing
            const nameRow = document.createElement('div');
            nameRow.className = 'property-row';
            const nameLabel = document.createElement('span');
            nameLabel.className = 'property-label';
            nameLabel.textContent = 'Name';
            nameRow.appendChild(nameLabel);

            const inputName = document.createElement('input');
            inputName.type = 'text';
            inputName.className = 'name-input';
            inputName.value = slot.name;
            inputName.style.width = '100%';
            
            const handleRename = () => {
                const newName = inputName.value.trim();
                if(newName && newName !== slot.name){
                    const change = new SlotPropertyChange(slot.id, 'name', newName, { source: 'ui' });
                    changeManager.applyChange(change);
                }
            };
            
            inputName.addEventListener('change', (e) => {
                handleRename();
            });
            
            inputName.addEventListener('blur', handleRename);
            nameRow.appendChild(inputName);
            
            // Active property
            const activeRow = this.createPropertyRow('Active', slot.active, 'checkbox', (value) => {
                const change = new SlotPropertyChange(slot.id, 'active', value, { source: 'ui' });
                changeManager.applyChange(change);
            });
            
            // Persistent property
            const persistentRow = this.createPropertyRow('Persistent', slot.persistent, 'checkbox', (value) => {
                const change = new SlotPropertyChange(slot.id, 'persistent', value, { source: 'ui' });
                changeManager.applyChange(change);
            });
            
            body.appendChild(nameRow);
            body.appendChild(activeRow);
            body.appendChild(persistentRow);
            
            section.appendChild(header);
            section.appendChild(body);
            
            return section;
        }


        /**
         * Render a component
         */
        renderComponent(component, index) {
            // Special handling for MonoBehavior components
            if (component.type === 'MonoBehavior') {
                return this.renderMonoBehaviorComponent(component, index);
            }
            
            const section = document.createElement('div');
            section.className = 'component-section';
            section.dataset.componentId = component.id;
            section.dataset.componentIndex = index;
            
            // Header
            const header = document.createElement('div');
            header.className = 'component-header';
            
            const headerContent = document.createElement('div');
            headerContent.style.display = 'flex';
            headerContent.style.alignItems = 'center';
            headerContent.style.width = '100%';
            headerContent.style.justifyContent = 'space-between';
            
            const titleDiv = document.createElement('div');
            titleDiv.innerHTML = `
                <span class="component-name">${component.type}</span>
                <span class="component-type">${component.id}</span>
            `;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.alignItems = 'center';
            actionsDiv.style.gap = '8px';
            
            // Delete button (don't allow deleting Transform components)
            if (component.type !== 'Transform') {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'component-delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete component';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${component.type} component?`)) {
                        this.deleteComponent(component.id, component.type);
                    }
                };
                actionsDiv.appendChild(deleteBtn);
            }
            
            const toggleSpan = document.createElement('span');
            toggleSpan.className = 'component-toggle';
            toggleSpan.textContent = '▼';
            actionsDiv.appendChild(toggleSpan);
            
            headerContent.appendChild(titleDiv);
            headerContent.appendChild(actionsDiv);
            header.appendChild(headerContent);
            
            // Body
            const body = document.createElement('div');
            body.className = 'component-body';
            
            // Render properties
            if (component.properties) {
                Object.entries(component.properties).forEach(([key, value], propIndex) => {
                    const propertyRow = this.renderProperty(key, value, component.type, component.id, index, propIndex);
                    body.appendChild(propertyRow);
                });
            }
            
            section.appendChild(header);
            section.appendChild(body);
            
            // Toggle functionality
            const componentKey = `${SM.selectedSlot}_${component.type}_${index}`;
            let isExpanded = !this.collapsedComponents.has(componentKey);
            
            // Apply initial state
            body.style.display = isExpanded ? 'block' : 'none';
            header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
            
            header.onclick = () => {
                isExpanded = !isExpanded;
                body.style.display = isExpanded ? 'block' : 'none';
                header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
                
                // Save collapsed state
                if (isExpanded) {
                    this.collapsedComponents.delete(componentKey);
                } else {
                    this.collapsedComponents.add(componentKey);
                }
            };
            
            return section;
        }

        /**
         * Render a property row
         */
        renderProperty(key, value, componentType, componentId, componentIndex, propertyIndex) {
            const row = document.createElement('div');
            row.className = 'property-row';
            
            // Property button (for actions like reset)
            const button = document.createElement('button');
            button.className = 'property-button';
            button.textContent = '↻';
            button.title = 'Reset to default';
            
            // Property label
            const label = document.createElement('span');
            label.className = 'property-label';
            label.textContent = formatPropertyName(key);
            label.title = key;
            
            // Property value container
            const valueContainer = document.createElement('div');
            valueContainer.className = 'property-value';
            
            // Render based on value type
            if (typeof value === 'boolean') {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'checkbox-input';
                input.checked = value;
                input.onchange = () => {
                    const change = new ComponentPropertyChange(componentId, key, input.checked, { source: 'ui' });
                    changeManager.applyChange(change);
                };
                valueContainer.appendChild(input);
                
            } else if (typeof value === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'property-input number';
                input.value = value;
                input.step = 'any';
                input.onchange = () => {
                    const numValue = parseFloat(input.value);
                    if (!isNaN(numValue)) {
                        const change = new ComponentPropertyChange(componentId, key, numValue, { source: 'ui' });
                        changeManager.applyChange(change);
                    }
                };
                valueContainer.appendChild(input);
                
            } else if (componentType === 'Transform' && key === 'localRotation' && isQuaternion(value)) {
                // Transform rotation - convert quaternion to Euler angles
                const eulerAngles = quaternionToEuler(value);
                const vectorGroup = document.createElement('div');
                vectorGroup.className = 'vector-group';
                
                ['x', 'y', 'z'].forEach(axis => {
                    const axisLabel = document.createElement('span');
                    axisLabel.className = 'vector-label';
                    axisLabel.textContent = axis.toUpperCase();
                    
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'property-input number';
                    input.value = formatNumber(eulerAngles[axis], 2);
                    input.step = 'any';
                    input.onchange = () => this.handleRotationChange(componentId, axis, input.value, componentIndex);
                    
                    vectorGroup.appendChild(axisLabel);
                    vectorGroup.appendChild(input);
                });
                
                valueContainer.appendChild(vectorGroup);
                
            } else if (isVector3Object(value)) {
                // Vector3 properties
                const vectorGroup = document.createElement('div');
                vectorGroup.className = 'vector-group';
                
                ['x', 'y', 'z'].forEach(axis => {
                    const axisLabel = document.createElement('span');
                    axisLabel.className = 'vector-label';
                    axisLabel.textContent = axis.toUpperCase();
                    
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'property-input number';
                    input.value = value[axis] || 0;
                    input.step = 'any';
                    input.onchange = () => this.handleVector3Change(componentType, componentId, key, axis, input.value, componentIndex);
                    
                    vectorGroup.appendChild(axisLabel);
                    vectorGroup.appendChild(input);
                });
                
                valueContainer.appendChild(vectorGroup);
                
            } else if (key === 'color' && typeof value === 'object' && 'r' in value) {
                // Color property
                const colorGroup = document.createElement('div');
                colorGroup.className = 'color-group';
                
                // Color preview
                const preview = document.createElement('div');
                preview.className = 'color-preview';
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, ${value.a || 1})`;
                preview.appendChild(swatch);
                
                // Hidden color input
                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.style.display = 'none';
                colorInput.value = rgbToHex(value.r * 255, value.g * 255, value.b * 255);
                colorInput.onchange = () => {
                    const rgb = hexToRgb(colorInput.value);
                    const newColor = {
                        r: rgb.r / 255,
                        g: rgb.g / 255,
                        b: rgb.b / 255,
                        a: value.a || 1
                    };
                    swatch.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${newColor.a})`;
                    const change = new ComponentPropertyChange(componentId, key, newColor, { source: 'ui' });
                    changeManager.applyChange(change);
                };
                
                preview.onclick = () => colorInput.click();
                
                // RGBA inputs
                const rgbaContainer = document.createElement('div');
                rgbaContainer.className = 'vector-group';
                
                ['r', 'g', 'b', 'a'].forEach(channel => {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'property-input number';
                    input.value = channel === 'a' ? (value[channel] || 1) : value[channel];
                    input.min = '0';
                    input.max = '1';
                    input.step = '0.01';
                    input.onchange = () => {
                        const newValue = parseFloat(input.value);
                        if (!isNaN(newValue)) {
                            value[channel] = Math.max(0, Math.min(1, newValue));
                            swatch.style.backgroundColor = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, ${value.a})`;
                            const change = new ComponentPropertyChange(componentId, key, value, { source: 'ui' });
                            changeManager.applyChange(change);
                        }
                    };
                    
                    rgbaContainer.appendChild(input);
                });
                
                colorGroup.appendChild(preview);
                colorGroup.appendChild(colorInput);
                colorGroup.appendChild(rgbaContainer);
                valueContainer.appendChild(colorGroup);
                
            } else {
                // String or other types
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'property-input';
                input.value = value?.toString() || '';
                input.onchange = () => {
                    const change = new ComponentPropertyChange(componentId, key, input.value, { source: 'ui' });
                    changeManager.applyChange(change);
                };
                valueContainer.appendChild(input);
            }
            
            row.appendChild(button);
            row.appendChild(label);
            row.appendChild(valueContainer);
            
            return row;
        }

        /**
         * Render MonoBehavior component with special handling
         */
        renderMonoBehaviorComponent(component, index) {
            const section = document.createElement('div');
            section.className = 'component-section';
            section.dataset.componentId = component.id;
            section.dataset.componentIndex = index;
            
            // Header
            const header = document.createElement('div');
            header.className = 'component-header';
            
            const headerContent = document.createElement('div');
            headerContent.style.display = 'flex';
            headerContent.style.alignItems = 'center';
            headerContent.style.width = '100%';
            headerContent.style.justifyContent = 'space-between';
            
            const titleDiv = document.createElement('div');
            titleDiv.innerHTML = `
                <span class="component-name">MonoBehavior</span>
                <span class="component-type">${component.properties.name || 'Script'}</span>
            `;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.alignItems = 'center';
            actionsDiv.style.gap = '8px';
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'component-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete component';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete MonoBehavior component?`)) {
                    this.deleteComponent(component.id, component.type);
                }
            };
            actionsDiv.appendChild(deleteBtn);
            
            const toggleSpan = document.createElement('span');
            toggleSpan.className = 'component-toggle';
            toggleSpan.textContent = '▼';
            actionsDiv.appendChild(toggleSpan);
            
            headerContent.appendChild(titleDiv);
            headerContent.appendChild(actionsDiv);
            header.appendChild(headerContent);
            
            // Body
            const body = document.createElement('div');
            body.className = 'component-body';
            
            // Name property
            const nameRow = this.createPropertyRow('Name', component.properties.name || 'myScript', 'text', (value) => {
                component.properties.name = value;
                const change = new ComponentPropertyChange(component.id, 'name', value, { source: 'ui' });
                changeManager.applyChange(change);
            });
            body.appendChild(nameRow);
            
            // File property with dropdown
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
            
            const scripts = window.inventory.getAvailableScripts();
            scripts.forEach(script => {
                const option = document.createElement('option');
                option.value = script.name;
                option.textContent = `${script.name} (by ${script.author})`;
                if (component.properties.file === script.name) {
                    option.selected = true;
                }
                fileSelect.appendChild(option);
            });
            
            fileSelect.onchange = async () => {
                if(component.properties.file === fileSelect.value) return;
                
                const change = new ComponentPropertyChange(component.id, 'file', fileSelect.value, { source: 'ui' });
                changeManager.applyChange(change);
                
                // Re-render to show vars
                this.render(SM.selectedSlot);
            };
            
            fileContainer.appendChild(fileSelect);
            fileRow.appendChild(document.createElement('span')); // Empty space for button
            fileRow.appendChild(fileLabel);
            fileRow.appendChild(fileContainer);
            body.appendChild(fileRow);
            
            // Render vars if any
            if (component.ctx.vars && Object.keys(component.ctx.vars).length > 0) {
                const varsHeader = document.createElement('div');
                varsHeader.className = 'property-row';
                varsHeader.style.marginTop = '12px';
                varsHeader.style.fontWeight = 'bold';
                varsHeader.innerHTML = '<span></span><span>Script Variables</span><span></span>';
                body.appendChild(varsHeader);
                
                // Render each variable
                Object.entries(component.ctx.vars).forEach(([varName, varValue]) => {
                    const varRow = this.renderMonoBehaviorVar(varName, varValue, component, index);
                    body.appendChild(varRow);
                });
            }
            
            // Add Edit Script button
            if (component.properties.file) {
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
                
                editButton.onclick = () => {
                    console.log("editButton clicked =>", component.properties.file)
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
                
                body.appendChild(editButtonRow);
            }
            
            section.appendChild(header);
            section.appendChild(body);
            
            // Toggle functionality
            const componentKey = `${SM.selectedSlot}_${component.type}_${index}`;
            let isExpanded = !this.collapsedComponents.has(componentKey);
            
            // Apply initial state
            body.style.display = isExpanded ? 'block' : 'none';
            header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
            
            header.onclick = () => {
                isExpanded = !isExpanded;
                body.style.display = isExpanded ? 'block' : 'none';
                header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
                
                // Save collapsed state
                if (isExpanded) {
                    this.collapsedComponents.delete(componentKey);
                } else {
                    this.collapsedComponents.add(componentKey);
                }
            };
            
            return section;
        }
        
        /**
         * Render a MonoBehavior variable
         */
        renderMonoBehaviorVar(varName, varValue, component, componentIndex) {
            const row = document.createElement('div');
            row.className = 'property-row';
            
            const label = document.createElement('span');
            label.className = 'property-label';
            label.textContent = formatPropertyName(varName);
            label.title = varName;
            
            const valueContainer = document.createElement('div');
            valueContainer.className = 'property-value';
            //console.log("varValue =>", varValue)
            // Determine type and render appropriate input
            if (varValue.type === 'boolean') {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'checkbox-input';
                input.checked = varValue.value;
                input.onchange = () => {
                    const change = new MonoBehaviorVarChange(component.id, varName, {type: 'boolean', value: input.checked}, { source: 'ui' });
                    changeManager.applyChange(change);
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
                    if (!isNaN(numValue)) {
                        const change = new MonoBehaviorVarChange(component.id, varName, {type: 'number', value: numValue}, { source: 'ui' });
                        changeManager.applyChange(change);
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
                        if (!isNaN(numValue)) {
                            varValue.value[axis] = numValue;
                            const change = new MonoBehaviorVarChange(component.id, varName, {type: 'vector3', value: varValue.value}, { source: 'ui' });
                            changeManager.applyChange(change);
                        }
                    };
                    
                    vectorGroup.appendChild(axisLabel);
                    vectorGroup.appendChild(input);
                });
                
                valueContainer.appendChild(vectorGroup);
                
            } else if (varValue.type === 'color') {
                // Color variable
                const colorGroup = document.createElement('div');
                colorGroup.className = 'color-group';
                
                const preview = document.createElement('div');
                preview.className = 'color-preview';
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = `rgba(${varValue.value.r * 255}, ${varValue.value.g * 255}, ${varValue.value.b * 255}, ${varValue.value.a || 1})`;
                preview.appendChild(swatch);
                
                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.style.display = 'none';
                colorInput.value = rgbToHex(varValue.value.r * 255, varValue.value.g * 255, varValue.value.b * 255);
                colorInput.onchange = () => {
                    const rgb = hexToRgb(colorInput.value);
                    varValue.value.r = rgb.r / 255;
                    varValue.value.g = rgb.g / 255;
                    varValue.value.b = rgb.b / 255;
                    swatch.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${varValue.value.a || 1})`;
                    const change = new MonoBehaviorVarChange(component.id, varName, {type: 'color', value: varValue.value}, { source: 'ui' });
                    changeManager.applyChange(change);
                };
                
                preview.onclick = () => colorInput.click();
                
                colorGroup.appendChild(preview);
                colorGroup.appendChild(colorInput);
                valueContainer.appendChild(colorGroup);
                
            } else {
                // String or other types
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'property-input';
                input.value = varValue.value?.toString() || '';
                input.onchange = () => {
                    const change = new MonoBehaviorVarChange(component.id, varName, {type: 'string', value: input.value}, { source: 'ui' });
                    changeManager.applyChange(change);
                };
                valueContainer.appendChild(input);
            }
            
            row.appendChild(document.createElement('span')); // Empty space for button
            row.appendChild(label);
            row.appendChild(valueContainer);
            
            return row;
        }

        /**
         * Create a simple property row
         */
        createPropertyRow(label, value, type, onChange) {
            const row = document.createElement('div');
            row.className = 'property-row';
            
            const labelElement = document.createElement('span');
            labelElement.className = 'property-label';
            labelElement.textContent = label;
            
            const valueContainer = document.createElement('div');
            valueContainer.className = 'property-value';
            
            if (type === 'checkbox') {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'checkbox-input';
                input.checked = value;
                input.onchange = () => onChange(input.checked);
                valueContainer.appendChild(input);
            } else if (type === 'text') {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'property-input';
                input.value = value || '';
                input.onchange = () => onChange(input.value);
                valueContainer.appendChild(input);
            }
            
            row.appendChild(document.createElement('span')); // Empty space for button
            row.appendChild(labelElement);
            row.appendChild(valueContainer);
            
            return row;
        }

        /**
         * Handle Vector3 property changes
         */
        handleVector3Change(componentType, componentId, key, axis, value, componentIndex) {
            const slot = SM.getSlotById(SM.selectedSlot);
            if (!slot) return;
            
            const component = slot.components.find(c => c.id === componentId);
            if (!component || !component.properties[key]) return;
            
            const vector = component.properties[key];
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                let oldValue = deepClone(vector)
                vector[axis] = numValue;
                const change = new ComponentPropertyChange(componentId, key, vector, { source: 'ui', oldValue: oldValue });
                changeManager.applyChange(change);
            }
        }

        /**
         * Handle rotation changes (Euler angles to Quaternion)
         */
        handleRotationChange(componentId, axis, value, componentIndex) {
            const slot = SM.getSlotById(SM.selectedSlot);
            if (!slot) return;
            
            const component = slot.components.find(c => c.id === componentId);
            if (!component || !component.properties.localRotation) return;
            
            // Get current quaternion and convert to Euler
            const currentQuaternion = component.properties.localRotation;
            const eulerAngles = quaternionToEuler(currentQuaternion);
            
            // Update the changed axis
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                let oldValue = deepClone(currentQuaternion)

                eulerAngles[axis] = numValue;
                
                // Convert back to quaternion
                const newQuaternion = eulerToQuaternion(eulerAngles);
                
                // Queue the change
                const change = new ComponentPropertyChange(componentId, 'localRotation', newQuaternion, { source: 'ui', oldValue: oldValue });
                changeManager.applyChange(change);
            }
        }


        /**
         * Delete a component from the selected slot
         */
        async deleteComponent(componentId, componentType) {
            const slotId = SM.selectedSlot;
            if (!slotId) return;
            
            // Queue the component removal through change manager
            const change = new ComponentRemoveChange(componentId, { source: 'ui' });
            changeManager.applyChange(change);
            
            // The actual deletion will be handled by the change manager
            // Re-render will happen after the change is processed
            setTimeout(() => this.render(slotId), 100);
        }
    }
// })()