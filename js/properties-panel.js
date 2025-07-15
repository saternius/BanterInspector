/**
 * Properties Panel
 * Handles component display and property editing
 */

// (async () => {
    let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
    const { sceneManager } = await import(`${basePath}/scene-manager.js`);
    const { formatPropertyName, rgbToHex, hexToRgb, isVector3Object, isQuaternion, quaternionToEuler, eulerToQuaternion, formatNumber } = await import(`${basePath}/utils.js`);
    const { MonoBehavior } = await import(`${basePath}/monobehavior.js`);
    const { simpleChangeManager } = await import(`${basePath}/simple-change-manager.js`);
    export class PropertiesPanel {
        constructor() {
            this.propertiesContent = document.getElementById('propertiesContent');
            this.addComponentContainer = document.getElementById('addComponentContainer');
            this.addComponentBtn = document.getElementById('addComponentBtn');
            this.selectedSlotNameElement = document.getElementById('selectedSlotName');
            
            this.setupEventListeners();
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Listen for slot selection changes
            document.addEventListener('slotSelectionChanged', (event) => {
                const { slotId } = event.detail;
                this.render(slotId);
            });

            // Add component button
            this.addComponentBtn?.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('showComponentMenu', {
                    detail: { slotId: sceneManager.selectedSlot }
                }));
            });
        }

        /**
         * Render properties for a slot
         */
        render(slotId = null) {
            if (!this.propertiesContent) return;
            
            const slot = slotId ? sceneManager.getSlotById(slotId) : null;
            
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
                if (newName && newName !== slot.name) {
                    simpleChangeManager.applyChange({
                        type: 'slot',
                        targetId: slot.id,
                        property: 'name',
                        value: newName,
                        source: 'inspector-ui',
                        metadata: {
                            slotId: slot.id
                        }
                    });
                    if (this.selectedSlotNameElement) {
                        this.selectedSlotNameElement.textContent = `Properties - ${newName}`;
                    }
                }  
            };
            
            inputName.addEventListener('change', (e) => {
                handleRename();
            });
            
            inputName.addEventListener('blur', handleRename);
            nameRow.appendChild(inputName);

            // nameRow.innerHTML = `
            //     <span class="property-label">Name</span>
            //     <div class="property-value">
            //         <span class="node-name" id="slotNameDisplay">${slot.name}</span>
            //     </div>
            // `;
            
            // // Make name editable on click
            // const nameDisplay = nameRow.querySelector('#slotNameDisplay');
            // nameDisplay.style.cursor = 'pointer';
            // nameDisplay.onclick = () => this.startNameEdit(slot, nameDisplay);
            
            // Active property
            const activeRow = this.createPropertyRow('Active', slot.active, 'checkbox', (value) => {
                simpleChangeManager.applyChange({
                    type: 'slot',
                    targetId: slot.id,
                    property: 'active',
                    value: value,
                    source: 'inspector-ui',
                    metadata: {
                        slotId: slot.id
                    }
                });
            });
            
            // Persistent property
            const persistentRow = this.createPropertyRow('Persistent', slot.persistent, 'checkbox', (value) => {
                simpleChangeManager.applyChange({
                    type: 'slot',
                    targetId: slot.id,
                    property: 'persistent',
                    value: value,
                    source: 'inspector-ui',
                    metadata: {
                        slotId: slot.id
                    }
                });
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
            if (component.type === 'MonoBehavior' || component instanceof MonoBehavior) {
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
                <span class="component-type">#${index}</span>
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
            let isExpanded = true;
            header.onclick = () => {
                isExpanded = !isExpanded;
                body.style.display = isExpanded ? 'block' : 'none';
                header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
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
                    simpleChangeManager.applyChange({
                        type: 'component',
                        targetId: componentId,
                        property: key,
                        value: input.checked,
                        source: 'inspector-ui',
                        metadata: {
                            slotId: sceneManager.selectedSlot,
                            componentType: componentType,
                            componentIndex: componentIndex,
                        }
                    });
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
                        simpleChangeManager.applyChange({
                            type: 'component',
                            targetId: componentId,
                            property: key,
                            value: numValue,
                            source: 'inspector-ui',
                            metadata: {
                                slotId: sceneManager.selectedSlot,
                                componentType: componentType,
                                componentIndex: componentIndex,
                                }
                        });
                    }
                };
                valueContainer.appendChild(input);
                
            } else if (componentType === 'Transform' && key === 'rotation' && isQuaternion(value)) {
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
                    simpleChangeManager.applyChange({
                        type: 'component',
                        targetId: componentId,
                        property: key,
                        value: newColor,
                        source: 'inspector-ui',
                        metadata: {
                            slotId: sceneManager.selectedSlot,
                            componentType: componentType,
                            componentIndex: componentIndex,
                            uiContext: {
                                panelType: 'properties',
                                inputElement: 'color-picker-' + key,
                                eventType: 'change',
                                }
                        }
                    });
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
                            simpleChangeManager.applyChange({
                                type: 'component',
                                targetId: componentId,
                                property: key,
                                value: value,
                                source: 'inspector-ui',
                                metadata: {
                                    slotId: sceneManager.selectedSlot,
                                    componentType: componentType,
                                    componentIndex: componentIndex,
                                    uiContext: {
                                        panelType: 'properties',
                                        inputElement: 'color-rgba-' + key + '-' + channel,
                                        eventType: 'change',
                                                }
                                }
                            });
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
                    simpleChangeManager.applyChange({
                        type: 'component',
                        targetId: componentId,
                        property: key,
                        value: input.value,
                        source: 'inspector-ui',
                        metadata: {
                            slotId: sceneManager.selectedSlot,
                            componentType: componentType,
                            componentIndex: componentIndex,
                            uiContext: {
                                panelType: 'properties',
                                inputElement: 'text-' + key,
                                eventType: 'change',
                                }
                        }
                    });
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
                simpleChangeManager.applyChange({
                    type: 'component',
                    targetId: component.id,
                    property: 'name',
                    value: value,
                    source: 'inspector-ui',
                    metadata: {
                        slotId: sceneManager.selectedSlot,
                        componentType: 'MonoBehavior',
                        componentIndex: index
                    }
                });
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
            const scripts = MonoBehavior.getAvailableScripts();
            scripts.forEach(script => {
                const option = document.createElement('option');
                option.value = script.fileName;
                option.textContent = `${script.name} (by ${script.author})`;
                if (component.properties.file === script.fileName) {
                    option.selected = true;
                }
                fileSelect.appendChild(option);
            });
            
            fileSelect.onchange = async () => {
                const oldFile = component.properties.file;
                component.properties.file = fileSelect.value;
                
                // Load the new script
                if (component instanceof MonoBehavior) {
                    if (oldFile) {
                        component.unloadScript();
                    }
                    if (fileSelect.value) {
                        await component.loadScript(fileSelect.value);
                    }
                }
                
                simpleChangeManager.applyChange({
                    type: 'component',
                    targetId: component.id,
                    property: 'file',
                    value: fileSelect.value,
                    source: 'inspector-ui',
                    metadata: {
                        slotId: sceneManager.selectedSlot,
                        componentType: 'MonoBehavior',
                        componentIndex: index
                    }
                });
                
                // Re-render to show vars
                this.render(sceneManager.selectedSlot);
            };
            
            fileContainer.appendChild(fileSelect);
            fileRow.appendChild(document.createElement('span')); // Empty space for button
            fileRow.appendChild(fileLabel);
            fileRow.appendChild(fileContainer);
            body.appendChild(fileRow);
            
            // Render vars if any
            if (component.properties.vars && Object.keys(component.properties.vars).length > 0) {
                const varsHeader = document.createElement('div');
                varsHeader.className = 'property-row';
                varsHeader.style.marginTop = '12px';
                varsHeader.style.fontWeight = 'bold';
                varsHeader.innerHTML = '<span></span><span>Script Variables</span><span></span>';
                body.appendChild(varsHeader);
                
                // Render each variable
                Object.entries(component.properties.vars).forEach(([varName, varValue]) => {
                    const varRow = this.renderMonoBehaviorVar(varName, varValue, component, index);
                    body.appendChild(varRow);
                });
            }
            
            section.appendChild(header);
            section.appendChild(body);
            
            // Toggle functionality
            let isExpanded = true;
            header.onclick = () => {
                isExpanded = !isExpanded;
                body.style.display = isExpanded ? 'block' : 'none';
                header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
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
            
            // Determine type and render appropriate input
            if (typeof varValue === 'boolean') {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'checkbox-input';
                input.checked = varValue;
                input.onchange = () => {
                    if (component instanceof MonoBehavior) {
                        component.updateVar(varName, input.checked);
                    }
                    component.properties.vars[varName] = input.checked;
                    simpleChangeManager.applyChange({
                        type: 'component',
                        targetId: component.id,
                        property: 'vars',
                        value: component.properties.vars,
                        metadata: {
                            slotId: sceneManager.selectedSlot,
                            componentType: 'MonoBehavior',
                            componentIndex: componentIndex,
                        }
                    });
                };
                valueContainer.appendChild(input);
                
            } else if (typeof varValue === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'property-input number';
                input.value = varValue;
                input.step = 'any';
                input.onchange = () => {
                    const numValue = parseFloat(input.value);
                    if (!isNaN(numValue)) {
                        if (component instanceof MonoBehavior) {
                            component.updateVar(varName, numValue);
                        }
                        component.properties.vars[varName] = numValue;
                        simpleChangeManager.applyChange({
                            type: 'component',
                            targetId: component.id,
                            property: 'vars',
                            value: component.properties.vars,
                            metadata: {
                                slotId: sceneManager.selectedSlot,
                                componentType: 'MonoBehavior',
                                componentIndex: componentIndex,
                                }
                        });
                    }
                };
                valueContainer.appendChild(input);
                
            } else if (isVector3Object(varValue)) {
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
                    input.value = varValue[axis] || 0;
                    input.step = 'any';
                    input.onchange = () => {
                        const numValue = parseFloat(input.value);
                        if (!isNaN(numValue)) {
                            varValue[axis] = numValue;
                            if (component instanceof MonoBehavior) {
                                component.updateVar(varName, varValue);
                            }
                            component.properties.vars[varName] = varValue;
                            simpleChangeManager.applyChange({
                                type: 'component',
                                targetId: component.id,
                                property: 'vars',
                                value: component.properties.vars,
                                metadata: {
                                    slotId: sceneManager.selectedSlot,
                                    componentType: 'MonoBehavior',
                                    componentIndex: componentIndex,
                                        }
                            });
                        }
                    };
                    
                    vectorGroup.appendChild(axisLabel);
                    vectorGroup.appendChild(input);
                });
                
                valueContainer.appendChild(vectorGroup);
                
            } else if (typeof varValue === 'object' && varValue !== null && 'r' in varValue) {
                // Color variable
                const colorGroup = document.createElement('div');
                colorGroup.className = 'color-group';
                
                const preview = document.createElement('div');
                preview.className = 'color-preview';
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = `rgba(${varValue.r * 255}, ${varValue.g * 255}, ${varValue.b * 255}, ${varValue.a || 1})`;
                preview.appendChild(swatch);
                
                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.style.display = 'none';
                colorInput.value = rgbToHex(varValue.r * 255, varValue.g * 255, varValue.b * 255);
                colorInput.onchange = () => {
                    const rgb = hexToRgb(colorInput.value);
                    varValue.r = rgb.r / 255;
                    varValue.g = rgb.g / 255;
                    varValue.b = rgb.b / 255;
                    swatch.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${varValue.a || 1})`;
                    if (component instanceof MonoBehavior) {
                        component.updateVar(varName, varValue);
                    }
                    component.properties.vars[varName] = varValue;
                    simpleChangeManager.applyChange({
                        type: 'component',
                        targetId: component.id,
                        property: 'vars',
                        value: component.properties.vars,
                        metadata: {
                            slotId: sceneManager.selectedSlot,
                            componentType: 'MonoBehavior',
                            componentIndex: componentIndex,
                        }
                    });
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
                input.value = varValue?.toString() || '';
                input.onchange = () => {
                    if (component instanceof MonoBehavior) {
                        component.updateVar(varName, input.value);
                    }
                    component.properties.vars[varName] = input.value;
                    simpleChangeManager.applyChange({
                        type: 'component',
                        targetId: component.id,
                        property: 'vars',
                        value: component.properties.vars,
                        metadata: {
                            slotId: sceneManager.selectedSlot,
                            componentType: 'MonoBehavior',
                            componentIndex: componentIndex,
                        }
                    });
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
            const slot = sceneManager.getSlotById(sceneManager.selectedSlot);
            if (!slot) return;
            
            const component = slot.components.find(c => c.id === componentId);
            if (!component || !component.properties[key]) return;
            
            const vector = component.properties[key];
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                vector[axis] = numValue;
                simpleChangeManager.applyChange({
                    type: 'component',
                    targetId: componentId,
                    property: key,
                    value: vector,
                    source: 'inspector-ui',
                    metadata: {
                        slotId: sceneManager.selectedSlot,
                        componentType: componentType,
                        componentIndex: componentIndex
                    }
                });
            }
        }

        /**
         * Handle rotation changes (Euler angles to Quaternion)
         */
        handleRotationChange(componentId, axis, value, componentIndex) {
            const slot = sceneManager.getSlotById(sceneManager.selectedSlot);
            if (!slot) return;
            
            const component = slot.components.find(c => c.id === componentId);
            if (!component || !component.properties.rotation) return;
            
            // Get current quaternion and convert to Euler
            const currentQuaternion = component.properties.rotation;
            const eulerAngles = quaternionToEuler(currentQuaternion);
            
            // Update the changed axis
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                eulerAngles[axis] = numValue;
                
                // Convert back to quaternion
                const newQuaternion = eulerToQuaternion(eulerAngles);
                
                // Queue the change
                simpleChangeManager.applyChange({
                    type: 'component',
                    targetId: componentId,
                    property: 'rotation',
                    value: newQuaternion,
                    source: 'inspector-ui',
                    metadata: {
                        slotId: sceneManager.selectedSlot,
                        componentType: 'Transform',
                        componentIndex: componentIndex
                    }
                });
            }
        }


        /**
         * Delete a component from the selected slot
         */
        async deleteComponent(componentId, componentType) {
            const slotId = sceneManager.selectedSlot;
            if (!slotId) return;
            
            // Queue the component removal through change manager
            simpleChangeManager.applyChange({
                type: 'componentRemove',
                targetId: componentId,
                property: 'component',
                value: null,
                source: 'inspector-ui',
                metadata: {
                    slotId: slotId,
                    componentType: componentType,
                    uiContext: {
                        panelType: 'properties',
                        inputElement: 'delete-component-' + componentType,
                        eventType: 'delete'
                    }
                }
            });
            
            // The actual deletion will be handled by the change manager
            // Re-render will happen after the change is processed
            setTimeout(() => this.render(slotId), 100);
        }
    }
// })()