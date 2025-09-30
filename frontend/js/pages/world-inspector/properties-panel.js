/**
 * Properties Panel
 * Handles component display and property editing
 */

// (async () => {
    const { parseBest, formatPropertyName, rgbToHex, hexToRgb, isVector3Object, isQuaternion, quaternionToEuler, eulerToQuaternion, formatNumber, deepClone, confirm } = await import(`${window.repoUrl}/utils.js`);
    const { changeManager } = await import(`${window.repoUrl}/change-manager.js`);
    const { EntityPropertyChange, ComponentPropertyChange, ComponentRemoveChange, MonoBehaviorVarChange, ComponentReorderChange } = await import(`${window.repoUrl}/change-types.js`);
    const { BanterLayers } = await import(`${window.repoUrl}/entity-components/index.js`);

    export class PropertiesPanel {
        constructor() {
            this.propertiesContent = document.getElementById('propertiesContent');
            this.addComponentContainer = document.getElementById('addComponentContainer');
            this.addComponentBtn = document.getElementById('addComponentBtn');
            this.selectedEntityNameElement = document.getElementById('selectedEntityName');
            this.collapseAllBtn = document.getElementById('collapseAllBtn');
            this.loadSettingsBtn = document.getElementById('loadSettingsBtn');
            
            // Store collapsed state of components
            this.collapsedComponents = new Set();
            
            // Store proportional scaling lock state for scale properties
            this.scaleLockStates = new Map(); // Key: componentId_propertyKey, Value: boolean
            this.scaleRatios = new Map(); // Key: componentId_propertyKey, Value: {x: number, y: number, z: number}
            
            // Load settings toggle state
            this.showLoadSettings = false;
            
            this.setupEventListeners();
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

            this.loadSettingsBtn?.addEventListener('mousedown', () => {
                this.toggleLoadSettings();
            });
        }

        /**
         * Collapse all components
         */
        collapseAllComponents() {
            const entity = SM.getEntityById(SM.selectedEntity);
            if (!entity || !entity.components) return;
            
            // Add all components to collapsed set
            entity.components.forEach((component, index) => {
                const componentKey = `${SM.selectedEntity}_${component.type}_${index}`;
                this.collapsedComponents.add(componentKey);
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
                return !this.collapsedComponents.has(componentKey);
            });
            
            this.collapseAllBtn.style.display = hasExpandedComponent ? 'block' : 'none';
        }

        /**
         * Render properties for a entity
         */
        render(entityId = null) {
            if (!this.propertiesContent) return;
            
            const entity = entityId ? SM.getEntityById(entityId) : null;
            
            if (!entity) {
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
                return;
            }
            
            // Update header
            if (this.selectedEntityNameElement) {
                this.selectedEntityNameElement.textContent = `Properties - ${entity.name}`;
            }
            
            // Clear content
            this.propertiesContent.innerHTML = '';
            
            // Entity properties section
            const entitySection = this.createEntityPropertiesSection(entity);
            this.propertiesContent.appendChild(entitySection);
            
            // Render components
            if (entity.components && entity.components.length > 0) {
                entity.components.forEach((component, index) => {
                    const componentElement = this.renderComponent(component, index, entity.components.length);
                    this.propertiesContent.appendChild(componentElement);
                });
            }
            
            // Show add component button
            if (this.addComponentContainer) {
                this.addComponentContainer.style.display = 'block';
            }
            
            // Update collapse all button visibility
            this.updateCollapseAllButtonVisibility();
            window.dispatchEvent(new CustomEvent("ui-rendered", {
                detail: { id: "propertiesPanel" }
            }));
        }

        /**
         * Create entity properties section
         */
        createEntityPropertiesSection(entity) {
            const section = document.createElement('div');
            section.className = 'component-section';
            section.dataset.panel = 'propertyPanelComponent';
            
            const header = document.createElement('div');
            header.className = 'component-header perm';
            header.innerHTML = `
                <div>
                    <span class="component-name">Entity</span>
                    <span class="component-type">${entity.id}</span>
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
            inputName.value = entity.name;
            inputName.style.width = '100%';
            
            const handleRename = () => {
                const newName = inputName.value.trim();
                if(newName && newName !== entity.name){
                    const change = new EntityPropertyChange(entity.id, 'name', newName, { source: 'ui' });
                    changeManager.applyChange(change);
                }
                setTimeout(()=>{
                    SM.selectEntity(entity.parentId+"/"+newName)
                }, 70)
            };
            
            inputName.addEventListener('change', (e) => {
                handleRename();
            });
            
            inputName.addEventListener('blur', handleRename);
            nameRow.appendChild(inputName);

            // Layer property
            const layerRow = this.createPropertyRow('Layer', entity.layer, 'dropdown',  (value) => {
                const change = new EntityPropertyChange(entity.id, 'layer', value, { source: 'ui' });
                changeManager.applyChange(change);
            }, BanterLayers);


            
            // Active property
            const activeRow = this.createPropertyRow('Active', entity.active, 'checkbox', (value) => {
                const change = new EntityPropertyChange(entity.id, 'active', value, { source: 'ui' });
                changeManager.applyChange(change);
            });
            
            // Persistent property
            const persistentRow = this.createPropertyRow('Persistent', entity.persistent, 'checkbox', (value) => {
                const change = new EntityPropertyChange(entity.id, 'persistent', value, { source: 'ui' });
                changeManager.applyChange(change);
            });
            
            if (this.showLoadSettings) {
                const asyncRow = this.createAsyncToggleRow(entity);
                body.appendChild(asyncRow);
            }

            body.appendChild(nameRow);
            body.appendChild(layerRow);
            body.appendChild(activeRow);
            body.appendChild(persistentRow);
            
            section.appendChild(header);
            section.appendChild(body);
            
            return section;
        }


        /**
         * Move component up in the order
         */
        moveComponentUp(index) {
            if (index <= 1) return; // Can't move Transform or already at top after Transform
            
            const change = new ComponentReorderChange(SM.selectedEntity, index, index - 1, { source: 'ui' });
            changeManager.applyChange(change);
            
            // Re-render after a short delay
            setTimeout(() => this.render(SM.selectedEntity), 100);
        }
        
        /**
         * Move component down in the order
         */
        moveComponentDown(index, totalComponents) {
            if (index === 0 || index >= totalComponents - 1) return; // Can't move Transform or already at bottom
            
            const change = new ComponentReorderChange(SM.selectedEntity, index, index + 1, { source: 'ui' });
            changeManager.applyChange(change);
            
            // Re-render after a short delay
            setTimeout(() => this.render(SM.selectedEntity), 100);
        }

        /**
         * Render a component
         */
        renderComponent(component, index, totalComponents) {
            // Special handling for MonoBehavior components
            if (component.type === 'MonoBehavior') {
                return this.renderMonoBehaviorComponent(component, index, totalComponents);
            }
            
            const section = document.createElement('div');
            section.className = 'component-section';
            section.dataset.panel = 'propertyPanelComponent';
            section.dataset.componentId = component.id;
            section.dataset.componentIndex = index;
            
            // Header
            const header = document.createElement('div');
            header.className = 'component-header';
            if(component.type === "Transform"){
                header.classList.add('perm');
            }
            
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
            
            // Add up/down arrows (except for Transform component)
            if (component.type !== 'Transform') {
                // Up arrow - hide if component is at index 1 (right after Transform)
                if (index > 1) {
                    const upBtn = document.createElement('button');
                    upBtn.className = 'component-reorder-btn';
                    upBtn.innerHTML = '↑';
                    upBtn.title = 'Move up';
                    upBtn.onmousedown = (e) => {
                        e.stopPropagation();
                        this.moveComponentUp(index);
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
                        this.moveComponentDown(index, totalComponents);
                    };
                    actionsDiv.appendChild(downBtn);
                }
            }
            
            // Delete button (don't allow deleting Transform components)
            if (component.type !== 'Transform') {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'component-delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete component';
                deleteBtn.onmousedown = async (e) => {
                    e.stopPropagation();
                    if (await confirm(`Delete ${component.type} component?`)) {
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

            // Add async loading toggle if Load Settings is enabled
            if (this.showLoadSettings) {
                const asyncRow = this.createAsyncToggleRow(component);
                body.appendChild(asyncRow);
            }

            if(component._controls){
                let controls = component._controls;
                Object.values(controls.controls).forEach(control=>{
                    if(control.input === "button"){
                        const button = document.createElement('button');
                        button.className = 'property-button prop-control-btn';
                        button.textContent = control.label;
                        button.id = `${component.id}_${control.id}`;
                        button.onmousedown = control.callback;
                        body.appendChild(button);
                    }
                })
            }
            
            // Render properties
            if (component.properties) {
                Object.entries(component.properties).forEach(([key, value], propIndex) => {
                    const propertyRow = this.renderProperty(key, value, component, index, propIndex);
                    body.appendChild(propertyRow);
                });
            }
            
            section.appendChild(header);
            section.appendChild(body);
            
            // Toggle functionality
            const componentKey = `${SM.selectedEntity}_${component.type}_${index}`;
            let isExpanded = !this.collapsedComponents.has(componentKey);
            
            // Apply initial state
            body.style.display = isExpanded ? 'block' : 'none';
            header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
            
            header.onmousedown = () => {
                isExpanded = !isExpanded;
                body.style.display = isExpanded ? 'block' : 'none';
                header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
                
                // Save collapsed state
                if (isExpanded) {
                    this.collapsedComponents.delete(componentKey);
                } else {
                    this.collapsedComponents.add(componentKey);
                }
                
                // Update collapse all button visibility
                this.updateCollapseAllButtonVisibility();
            };
            
            return section;
        }

        /**
         * Render a property row
         */
        renderProperty(key, value, component, componentIndex, propertyIndex) {
            const componentType = component.type;
            const componentId = component.id;
            const row = document.createElement('div');
            row.className = 'property-row';
            row.id = `prop_${componentId}_${key}`;
            
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
            
            const enums = component.enums();
            if(enums[key]){
                const dropdown = document.createElement('select');
                dropdown.className = 'property-input';
                dropdown.style.width = '100%';
                Object.keys(enums[key]).forEach(enumKey => {
                    const option = document.createElement('option');
                    option.value = enumKey;
                    option.textContent = enums[key][enumKey];
                    if(value == enumKey){
                        option.selected = true;
                    }
                    dropdown.appendChild(option);
                });
                dropdown.onchange = () => {
                    const change = new ComponentPropertyChange(componentId, key, parseBest(dropdown.value), { source: 'ui' });
                    changeManager.applyChange(change);
                };
                valueContainer.appendChild(dropdown);
            } else if(key === "uid"){
                //create a dropdown input that list all of the users Object.values(SM.scene.users) with the label being user.name and the value being user.uid
                const dropdown = document.createElement('select');
                dropdown.className = 'property-input';
                dropdown.style.width = '100%';
                Object.values(SM.scene.users).forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.uid;
                    option.textContent = user.name;
                    if(value === user.uid){
                        option.selected = true;
                    }
                    dropdown.appendChild(option);
                });

                let nullOption = document.createElement('option');
                nullOption.value = "";
                nullOption.textContent = "None";
                if(value === ""){
                    nullOption.selected = true;
                }
                dropdown.appendChild(nullOption);

                dropdown.onchange = () => {
                    const change = new ComponentPropertyChange(componentId, key, dropdown.value, { source: 'ui' });
                    changeManager.applyChange(change);
                };
                valueContainer.appendChild(dropdown);
            }else if (typeof value === 'boolean') {
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
            
                input.onclick = (e)=>{
                    inputHandler.inputFocusChanged(input, component, key);
                }

                if(inputHandler.focusComponent === component && inputHandler.focusProperty === key){
                    input.style.backgroundColor = "#1e3764";
                    input.style.borderColor = "#326689";
                }   
               
                valueContainer.appendChild(input);
                
            } else if (key.includes('otation') && isQuaternion(value)) {
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
                    input.onclick = (e)=>{
                        inputHandler.inputFocusChanged(input, component,`${key}.${axis}`);
                    }

                    if(inputHandler.focusComponent === component && inputHandler.focusProperty === `${key}.${axis}`){
                        input.style.backgroundColor = "#1e3764";
                        input.style.borderColor = "#326689";
                    }

                    vectorGroup.appendChild(axisLabel);
                    vectorGroup.appendChild(input);
                });

                // Add reset button for rotation
                const resetButton = document.createElement('button');
                resetButton.className = 'rotation-reset-btn';
                resetButton.style.marginLeft = '8px';
                resetButton.style.padding = '4px 8px';
                resetButton.style.background = '#2a2a2a';
                resetButton.style.border = '1px solid #3a3a3a';
                resetButton.style.borderRadius = '4px';
                resetButton.style.color = '#999';
                resetButton.style.cursor = 'pointer';
                resetButton.style.fontSize = '14px';
                resetButton.innerHTML = '∅';
                resetButton.title = 'Reset rotation to zero';

                resetButton.onmousedown = (e) => {
                    e.stopPropagation();
                    // Set all rotation values to 0
                    const zeroRotation = { x: 0, y: 0, z: 0, w: 1 };
                    const change = new ComponentPropertyChange(componentId, key, zeroRotation, { source: 'ui' });
                    changeManager.applyChange(change);
                };

                vectorGroup.appendChild(resetButton);

                valueContainer.appendChild(vectorGroup);
                
            } else if (isVector3Object(value)) {
                // Vector3 properties
                const isScaleProperty = key.toLowerCase().includes('scale');
                const scaleLockKey = `${componentId}_${key}`;
                
                const vectorContainer = document.createElement('div');
                vectorContainer.style.display = 'flex';
                vectorContainer.style.alignItems = 'center';
                vectorContainer.style.width = '100%';
                
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
                    input.onchange = () => {
                        if (isScaleProperty && this.scaleLockStates.get(scaleLockKey)) {
                            this.handleProportionalScaleChange(componentType, componentId, key, axis, input.value, value, componentIndex);
                        } else {
                            this.handleVector3Change(componentType, componentId, key, axis, input.value, componentIndex);
                        }
                    };
                    input.onclick = (e)=>{
                        inputHandler.inputFocusChanged(input, component,`${key}.${axis}`);
                    }
                    if(inputHandler.focusComponent === component && inputHandler.focusProperty === `${key}.${axis}`){
                        input.style.backgroundColor = "#1e3764";
                        input.style.borderColor = "#326689";
                    }   

                    vectorGroup.appendChild(axisLabel);
                    vectorGroup.appendChild(input);
                });
                
                vectorContainer.appendChild(vectorGroup);
                
                // Add lock button for scale properties
                if (isScaleProperty) {
                    const lockButton = document.createElement('button');
                    lockButton.className = 'scale-lock-btn';
                    lockButton.style.marginLeft = '8px';
                    lockButton.style.padding = '4px 4px';
                    lockButton.style.background = this.scaleLockStates.get(scaleLockKey) ? '#4a90e2' : '#2a2a2a';
                    lockButton.style.border = '1px solid #3a3a3a';
                    lockButton.style.borderRadius = '4px';
                    lockButton.style.color = this.scaleLockStates.get(scaleLockKey) ? '#fff' : '#999';
                    lockButton.style.cursor = 'pointer';
                    lockButton.style.fontSize = '12px';
                    lockButton.innerHTML = this.scaleLockStates.get(scaleLockKey) ? '🔒' : '🔓';
                    lockButton.title = this.scaleLockStates.get(scaleLockKey) ? 'Proportional scaling locked' : 'Click to lock proportional scaling';
                    
                    lockButton.onmousedown = (e) => {
                        e.stopPropagation();
                        const isLocked = !this.scaleLockStates.get(scaleLockKey);
                        this.scaleLockStates.set(scaleLockKey, isLocked);
                        
                        if (isLocked) {
                            // Store current ratios when locking
                            const baseValue = value.x || 1;
                            this.scaleRatios.set(scaleLockKey, {
                                x: (value.x || 0) / baseValue,
                                y: (value.y || 0) / baseValue,
                                z: (value.z || 0) / baseValue
                            });
                        }
                        
                        // Update button appearance
                        lockButton.style.background = isLocked ? '#4a90e2' : '#2a2a2a';
                        lockButton.style.color = isLocked ? '#fff' : '#999';
                        lockButton.innerHTML = isLocked ? '🔒' : '🔓';
                        lockButton.title = isLocked ? 'Proportional scaling locked' : 'Click to lock proportional scaling';
                    };
                    
                    vectorGroup.appendChild(lockButton);
                }
                
                valueContainer.appendChild(vectorContainer);
                
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
                // Enable color input handler for VR
                preview.onclick = (e) => {
                    e.stopPropagation();
                    inputHandler.inputFocusChanged(colorInput, component, key);
                };

                
                preview.onmousedown = () => colorInput.click();
                
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
                    input.onclick = (e)=>{
                        inputHandler.inputFocusChanged(input, component,`${key}.${channel}`);
                    }
                    if(inputHandler.focusComponent === component && inputHandler.focusProperty === `${key}.${channel}`){
                        input.style.backgroundColor = "#1e3764";
                        input.style.borderColor = "#326689";
                    }   

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
        renderMonoBehaviorComponent(component, index, totalComponents) {
            const section = document.createElement('div');
            section.className = 'component-section';
            section.dataset.panel = 'propertyPanelComponent';
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
                <span class="component-type">${component.id}</span>
            `;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.alignItems = 'center';
            actionsDiv.style.gap = '8px';
            
            // Add up/down arrows for MonoBehavior
            // Up arrow - hide if component is at index 1 (right after Transform)
            if (index > 1) {
                const upBtn = document.createElement('button');
                upBtn.className = 'component-reorder-btn';
                upBtn.innerHTML = '▲';
                upBtn.title = 'Move up';
                upBtn.onmousedown = (e) => {
                    e.stopPropagation();
                    this.moveComponentUp(index);
                };
                actionsDiv.appendChild(upBtn);
            }
            
            // Down arrow - hide if component is the last one
            if (index < totalComponents - 1) {
                const downBtn = document.createElement('button');
                downBtn.className = 'component-reorder-btn';
                downBtn.innerHTML = '▼';
                downBtn.title = 'Move down';
                downBtn.onmousedown = (e) => {
                    e.stopPropagation();
                    this.moveComponentDown(index, totalComponents);
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
                if (await confirm(`Delete MonoBehavior component?`)) {
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
            
            let addScriptOption = (script)=>{
                if(!script) return;
                const option = document.createElement('option');
                option.value = script.name;
                option.textContent = `${script.name} (by ${script.author})`;
                if (component.properties.file === script.name) {
                    option.selected = true;
                }
                fileSelect.appendChild(option);
            }

            addScriptOption(inventory.items[component.properties.file]);
            scripts.forEach(script => {
                if(script.name === component.properties.file) return;
                addScriptOption(script);
            });
            
            fileSelect.onchange = async () => {
                if(component.properties.file === fileSelect.value) return;
                
                const change = new ComponentPropertyChange(component.id, 'file', fileSelect.value, { source: 'ui' });
                changeManager.applyChange(change);
                
                // Re-render to show vars
                this.render(SM.selectedEntity);
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
                
                editButton.onmousedown = () => {
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
            const componentKey = `${SM.selectedEntity}_${component.type}_${index}`;
            let isExpanded = !this.collapsedComponents.has(componentKey);
            
            // Apply initial state
            body.style.display = isExpanded ? 'block' : 'none';
            header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
            
            header.onmousedown = () => {
                isExpanded = !isExpanded;
                body.style.display = isExpanded ? 'block' : 'none';
                header.querySelector('.component-toggle').textContent = isExpanded ? '▼' : '▶';
                
                // Save collapsed state
                if (isExpanded) {
                    this.collapsedComponents.delete(componentKey);
                } else {
                    this.collapsedComponents.add(componentKey);
                }
                
                // Update collapse all button visibility
                this.updateCollapseAllButtonVisibility();
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
                
                preview.onmousedown = () => colorInput.click();
                
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
         * Create async toggle row for component
         */
        createAsyncToggleRow(componentOrEntity) {
            const row = document.createElement('div');
            row.className = 'async-toggle-row';
            
            const label = document.createElement('span');
            label.className = 'property-label';
            label.textContent = 'Async';
            label.style.fontWeight = 'bold';
            label.style.flex = "none"

            const valueContainer = document.createElement('div');
            valueContainer.className = 'property-value';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'checkbox-input';
            input.style.flex = "none"
            
            // Check both component.loadAsync and entity.loadAsync
            input.checked = componentOrEntity.loadAsync;
            
            input.onchange = () => {
                console.log("loadAsync changed", input.checked)
                componentOrEntity.loadAsync = input.checked;
            };
            
            valueContainer.appendChild(input);
            
            row.appendChild(document.createElement('span')); // Empty space for button
            row.appendChild(label);
            row.appendChild(valueContainer);
            
            return row;
        }

        /**
         * Create a simple property row
         */
        createPropertyRow(label, value, type, onChange, enums) {
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
            } else if (type === 'dropdown') {
                const select = document.createElement('select');
                select.className = 'property-input';
                select.value = value || '';
                select.onchange = () => onChange(select.value);
                Object.entries(enums).forEach(([key, enumValue]) => {
                    const option = document.createElement('option');
                    option.value = enumValue;
                    option.textContent = key;
                    if(enumValue === value){
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
                valueContainer.appendChild(select);
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
            const entity = SM.getEntityById(SM.selectedEntity);
            if (!entity) return;
            
            const component = entity.components.find(c => c.id === componentId);
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
         * Handle proportional scale changes when lock is active
         */
        handleProportionalScaleChange(componentType, componentId, key, changedAxis, newValue, currentVector, componentIndex) {
            const entity = SM.getEntityById(SM.selectedEntity);
            if (!entity) return;
            
            const component = entity.components.find(c => c.id === componentId);
            if (!component || !component.properties[key]) return;
            
            const numValue = parseFloat(newValue);
            if (isNaN(numValue)) return;
            
            const scaleLockKey = `${componentId}_${key}`;
            let ratios = this.scaleRatios.get(scaleLockKey);
            
            // If no ratios stored, calculate them from current values
            if (!ratios) {
                const baseValue = currentVector[changedAxis] || 1;
                ratios = {
                    x: (currentVector.x || 0) / baseValue,
                    y: (currentVector.y || 0) / baseValue,
                    z: (currentVector.z || 0) / baseValue
                };
                this.scaleRatios.set(scaleLockKey, ratios);
            }
            
            // Calculate the scale factor based on the changed axis
            const oldValue = currentVector[changedAxis] || 1;
            const scaleFactor = numValue / oldValue;
            
            // Apply proportional scaling to all axes
            const oldVector = deepClone(currentVector);
            const newVector = {
                x: currentVector.x * scaleFactor,
                y: currentVector.y * scaleFactor,
                z: currentVector.z * scaleFactor
            };
            
            // Apply the change
            const change = new ComponentPropertyChange(componentId, key, newVector, { source: 'ui', oldValue: oldVector });
            changeManager.applyChange(change);
            
            // Update the inputs to reflect the new values
            setTimeout(() => {
                const propertyRow = this.propertiesContent.querySelector(`.component-section[data-component-id="${componentId}"]`);
                if (propertyRow) {
                    const inputs = propertyRow.querySelectorAll('.vector-group input[type="number"]');
                    const vectorInputs = Array.from(inputs).filter(input => {
                        const container = input.closest('.property-row');
                        const label = container?.querySelector('.property-label');
                        return label && label.textContent === formatPropertyName(key);
                    });
                    
                    if (vectorInputs.length === 3) {
                        vectorInputs[0].value = formatNumber(newVector.x, 6);
                        vectorInputs[1].value = formatNumber(newVector.y, 6);
                        vectorInputs[2].value = formatNumber(newVector.z, 6);
                    }
                }
            }, 50);
        }

        /**
         * Handle rotation changes (Euler angles to Quaternion)
         */
        handleRotationChange(componentId, axis, value, componentIndex) {
            const entity = SM.getEntityById(SM.selectedEntity);
            if (!entity) return;
            
            const component = entity.components.find(c => c.id === componentId);
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
         * Delete a component from the selected entity
         */
        async deleteComponent(componentId, componentType) {
            const entityId = SM.selectedEntity;
            if (!entityId) return;
            
            // Queue the component removal through change manager
            const change = new ComponentRemoveChange(componentId, { source: 'ui' });
            changeManager.applyChange(change);
            
            // The actual deletion will be handled by the change manager
            // Re-render will happen after the change is processed
            setTimeout(() => this.render(entityId), 100);
        }

        /**
         * Update a property value programmatically
         * @param {string} componentId - The ID of the component
         * @param {string} propertyKey - The key of the property to update
         * @param {*} newValue - The new value to set
         */
        updateProperty(componentId, propertyKey, newValue) {
            const propertyRowId = `prop_${componentId}_${propertyKey}`;
            const propertyRow = document.getElementById(propertyRowId);
            if (!propertyRow) {
                //console.warn(`Property row not found: ${propertyRowId}`);
                return;
            }

            // Find the component
            const entity = SM.getEntityById(SM.selectedEntity);
            if (!entity) return;

            const component = entity.components.find(c => c.id === componentId);
            if (!component) {
                console.warn(`Component not found: ${componentId}`);
                return;
            }

            // Update based on value type
            if (typeof newValue === 'boolean') {
                const checkbox = propertyRow.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = newValue;

            } else if (typeof newValue === 'number') {
                const numberInput = propertyRow.querySelector('input[type="number"]:not(.vector-group input)');
                if (numberInput) numberInput.value = newValue;

            } else if (typeof newValue === 'string') {
                // Check for dropdowns first
                const dropdown = propertyRow.querySelector('select');
                if (dropdown) {
                    dropdown.value = newValue;
                } else {
                    // Text input
                    const textInput = propertyRow.querySelector('input[type="text"]');
                    if (textInput) textInput.value = newValue;
                }

            } else if (typeof newValue === 'object') {
                // Handle Vector3 objects
                if (newValue && 'x' in newValue && 'y' in newValue && 'z' in newValue) {
                    const vectorInputs = propertyRow.querySelectorAll('.vector-group input[type="number"]');
                    if (vectorInputs.length >= 3) {
                        vectorInputs[0].value = newValue.x || 0;
                        vectorInputs[1].value = newValue.y || 0;
                        vectorInputs[2].value = newValue.z || 0;
                    }
                }
                // Handle Color objects
                else if (newValue && 'r' in newValue && 'g' in newValue && 'b' in newValue) {
                    const colorSwatch = propertyRow.querySelector('.color-swatch');
                    if (colorSwatch) {
                        colorSwatch.style.backgroundColor = `rgba(${newValue.r * 255}, ${newValue.g * 255}, ${newValue.b * 255}, ${newValue.a || 1})`;
                    }

                    const rgbaInputs = propertyRow.querySelectorAll('.vector-group input[type="number"]');
                    if (rgbaInputs.length >= 3) {
                        rgbaInputs[0].value = newValue.r || 0;
                        rgbaInputs[1].value = newValue.g || 0;
                        rgbaInputs[2].value = newValue.b || 0;
                        if (rgbaInputs[3]) rgbaInputs[3].value = newValue.a || 1;
                    }

                    const colorInput = propertyRow.querySelector('input[type="color"]');
                    if (colorInput) {
                        const { rgbToHex } = window.utils || {};
                        if (rgbToHex) {
                            colorInput.value = rgbToHex(newValue.r * 255, newValue.g * 255, newValue.b * 255);
                        }
                    }
                }
                // Handle Quaternion (rotation)
                else if (newValue && 'x' in newValue && 'y' in newValue && 'z' in newValue && 'w' in newValue) {
                    const { quaternionToEuler, formatNumber } = window.utils || {};
                    if (quaternionToEuler) {
                        const eulerAngles = quaternionToEuler(newValue);
                        const vectorInputs = propertyRow.querySelectorAll('.vector-group input[type="number"]');
                        if (vectorInputs.length >= 3) {
                            vectorInputs[0].value = formatNumber ? formatNumber(eulerAngles.x, 2) : eulerAngles.x;
                            vectorInputs[1].value = formatNumber ? formatNumber(eulerAngles.y, 2) : eulerAngles.y;
                            vectorInputs[2].value = formatNumber ? formatNumber(eulerAngles.z, 2) : eulerAngles.z;
                        }
                    }
                }
            }
        }
    }
// })()