/**
 * Properties Panel
 * Handles component display and property editing
 */

import { sceneManager } from './scene-manager.js';
import { formatPropertyName, rgbToHex, hexToRgb, isVector3Object } from './utils.js';

export class PropertiesPanel {
    constructor() {
        this.propertiesContent = document.getElementById('propertiesContent');
        this.addComponentContainer = document.getElementById('addComponentContainer');
        this.addComponentBtn = document.getElementById('addComponentBtn');
        this.selectedSlotNameElement = document.getElementById('selectedSlotName');
        
        this.pendingChanges = new Map();
        this.updateTimer = null;
        
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
        nameRow.innerHTML = `
            <span class="property-label">Name</span>
            <div class="property-value">
                <span class="node-name" id="slotNameDisplay">${slot.name}</span>
            </div>
        `;
        
        // Make name editable on click
        const nameDisplay = nameRow.querySelector('#slotNameDisplay');
        nameDisplay.style.cursor = 'pointer';
        nameDisplay.onclick = () => this.startNameEdit(slot, nameDisplay);
        
        // Active property
        const activeRow = this.createPropertyRow('Active', slot.active, 'checkbox', (value) => {
            slot.active = value;
            this.queueChange(slot.id, null, 'active', value, 'slot', null);
            // Update hierarchy display
            document.dispatchEvent(new CustomEvent('slotPropertiesChanged', {
                detail: { slotId: slot.id }
            }));
        });
        
        // Persistent property
        const persistentRow = this.createPropertyRow('Persistent', slot.persistent, 'checkbox', (value) => {
            slot.persistent = value;
            this.queueChange(slot.id, null, 'persistent', value, 'slot', null);
        });
        
        body.appendChild(nameRow);
        body.appendChild(activeRow);
        body.appendChild(persistentRow);
        
        section.appendChild(header);
        section.appendChild(body);
        
        return section;
    }

    /**
     * Start inline name editing
     */
    startNameEdit(slot, displayElement) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'name-input';
        input.value = slot.name;
        input.style.width = '100%';
        
        const handleRename = () => {
            const newName = input.value.trim();
            if (newName && newName !== slot.name) {
                slot.name = newName;
                displayElement.textContent = newName;
                this.queueChange(slot.id, null, 'name', newName, 'slot', null);
                // Update hierarchy
                document.dispatchEvent(new CustomEvent('slotPropertiesChanged', {
                    detail: { slotId: slot.id }
                }));
                // Update header
                if (this.selectedSlotNameElement) {
                    this.selectedSlotNameElement.textContent = `Properties - ${newName}`;
                }
            } else {
                displayElement.textContent = slot.name;
            }
            displayElement.style.display = '';
            input.remove();
        };
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleRename();
            } else if (e.key === 'Escape') {
                displayElement.style.display = '';
                input.remove();
            }
        });
        
        input.addEventListener('blur', handleRename);
        
        displayElement.style.display = 'none';
        displayElement.parentElement.appendChild(input);
        input.focus();
        input.select();
    }

    /**
     * Render a component
     */
    renderComponent(component, index) {
        const section = document.createElement('div');
        section.className = 'component-section';
        section.dataset.componentId = component.id;
        section.dataset.componentIndex = index;
        
        // Header
        const header = document.createElement('div');
        header.className = 'component-header';
        header.innerHTML = `
            <div>
                <span class="component-name">${component.type}</span>
                <span class="component-type">#${index}</span>
            </div>
            <span class="component-toggle">▼</span>
        `;
        
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
                this.queueChange(sceneManager.selectedSlot, componentId, key, input.checked, componentType, componentIndex);
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
                    this.queueChange(sceneManager.selectedSlot, componentId, key, numValue, componentType, componentIndex);
                }
            };
            valueContainer.appendChild(input);
            
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
                this.queueChange(sceneManager.selectedSlot, componentId, key, newColor, componentType, componentIndex);
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
                        this.queueChange(sceneManager.selectedSlot, componentId, key, value, componentType, componentIndex);
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
                this.queueChange(sceneManager.selectedSlot, componentId, key, input.value, componentType, componentIndex);
            };
            valueContainer.appendChild(input);
        }
        
        row.appendChild(button);
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
            this.queueChange(sceneManager.selectedSlot, componentId, key, vector, componentType, componentIndex);
        }
    }

    /**
     * Queue a property change
     */
    queueChange(slotId, componentId, propertyKey, newValue, componentType, componentIndex) {
        const changeKey = componentId ? 
            `${slotId}_${componentId}_${propertyKey}` : 
            `${slotId}_${propertyKey}`;
        
        this.pendingChanges.set(changeKey, {
            slotId,
            componentId,
            componentType,
            componentIndex,
            propertyKey,
            newValue
        });
        
        // Update local state immediately
        const slot = sceneManager.getSlotById(slotId);
        if (slot) {
            if (componentId) {
                const component = slot.components.find(c => c.id === componentId);
                if (component && component.properties) {
                    component.properties[propertyKey] = newValue;
                }
            } else {
                // Slot property
                slot[propertyKey] = newValue;
            }
        }
        
        // Debounce Unity updates
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        
        this.updateTimer = setTimeout(() => {
            this.flushPendingChanges();
        }, 100);
    }

    /**
     * Flush pending changes to Unity/storage
     */
    async flushPendingChanges() {
        if (this.pendingChanges.size === 0) return;
        
        const changes = Array.from(this.pendingChanges.values());
        this.pendingChanges.clear();
        

        console.log("CHANGES:", changes)


        // Group changes by slot
        const changesBySlot = new Map();
        changes.forEach(change => {
            if (!changesBySlot.has(change.slotId)) {
                changesBySlot.set(change.slotId, []);
            }
            changesBySlot.get(change.slotId).push(change);
        });
        
        // Apply changes
        for (const [slotId, slotChanges] of changesBySlot) {
            console.log("HANDLING CHANGES:", slotId, slotChanges)
            // If we have Unity access, update the actual components
            if (sceneManager.scene && typeof window.BS !== 'undefined') {
                try {
                    const slot = sceneManager.getSlotById(slotId);
                    const gameObject = sceneManager.scene.objects?.[slotId];
                    if (slot && gameObject) {
                        
                        for (const change of slotChanges) {
                            if (change.componentId) {
                                await sceneManager.updateUnityComponent(gameObject, change);
                            } else {
                                // Handle slot-level properties
                                if (change.propertyKey === 'active') {
                                    await sceneManager.updateUnityObject(gameObject, change);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to update Unity components:', error);
                }
            }
            
            // Store changes in space state for persistence
            slotChanges.forEach(change => {
                if (change.componentId) {
                    const slot = sceneManager.getSlotById(slotId);
                    const propKey = `__${slot.name}/${change.componentType}/${change.propertyKey}:${change.componentId}`;
                    const propValue = {
                        value: change.newValue,
                        componentId: change.componentId,
                        slotId: slotId,
                        slotName: slot?.name || 'Unknown',
                        componentType: change.componentType,
                        componentIndex: change.componentIndex,
                        propertyKey: change.propertyKey,
                        timestamp: Date.now()
                    };
                    sceneManager.setSpaceProperty(propKey, propValue, false);
                } else {
                    // Slot property
                    const slot = sceneManager.getSlotById(slotId);
                    const propKey = `__${slot.name}/${change.propertyKey}:${slotId}`;
                    const propValue = {
                        slotId: slotId,
                        slotName: slot?.name || 'Unknown',
                        value: change.newValue,
                        timestamp: Date.now()
                    };
                    sceneManager.setSpaceProperty(propKey, propValue, false);
                }
            });
        }
    }
}