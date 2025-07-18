/**
 * Space Properties Panel
 * Handles public and protected space properties management
 */

// (async () => {
    let basePath = window.location.hostname === 'localhost'? '.' : `${window.repoUrl}/js`;
    const { sceneManager } = await import(`${basePath}/scene-manager.js`);
    const { isVector3Object, isQuaternion, quaternionToEuler, formatNumber } = await import(`${basePath}/utils.js`);
    const { changeManager } = await import(`${basePath}/change-manager.js`);
    const { SpacePropertyChange } = await import(`${basePath}/change-types.js`);

    export class SpacePropsPanel {
        constructor() {
            this.editingProps = new Map();
            this.setupEventListeners();
            this.render();
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Listen for space state changes
            document.addEventListener('spaceStateChanged', () => {
                this.render();
            });

            // Add property key press handlers
            const publicKeyInput = document.getElementById('addPublicKey');
            const publicValueInput = document.getElementById('addPublicValue');
            const protectedKeyInput = document.getElementById('addProtectedKey');
            const protectedValueInput = document.getElementById('addProtectedValue');

            if (publicKeyInput && publicValueInput) {
                const addPublic = () => this.addPublicProp();
                publicKeyInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') addPublic();
                });
                publicValueInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') addPublic();
                });
            }

            if (protectedKeyInput && protectedValueInput) {
                const addProtected = () => this.addProtectedProp();
                protectedKeyInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') addProtected();
                });
                protectedValueInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') addProtected();
                });
            }
        }

        /**
         * Render space properties
         */
        render() {
            this.renderPropsList('public', sceneManager.scene.spaceState.public);
            this.renderPropsList('protected', sceneManager.scene.spaceState.protected);
        }

        /**
         * Render properties list
         */
        renderPropsList(type, props) {
            const listElement = document.getElementById(`${type}PropsList`);
            const countElement = document.getElementById(`${type}PropsCount`);
            
            if (!listElement || !countElement) return;
            
            const propKeys = Object.keys(props);
            countElement.textContent = propKeys.length;
            
            if (propKeys.length === 0) {
                listElement.innerHTML = `<div class="empty-props">No ${type} properties</div>`;
                return;
            }
            
            listElement.innerHTML = '';
            
            propKeys.forEach(key => {
                const value = props[key];
                const propItem = this.createPropItem(type, key, value);
                listElement.appendChild(propItem);
            });
        }

        /**
         * Create property item element
         */
        createPropItem(type, key, value) {
            const item = document.createElement('div');
            item.className = 'prop-item';
            
            const keyElement = document.createElement('div');
            keyElement.className = 'prop-key';
            keyElement.textContent = key;
            keyElement.title = key;
            
            const valueContainer = document.createElement('div');
            valueContainer.className = 'prop-value';
            
            const isEditing = this.editingProps.has(`${type}_${key}`);
            
            if (isQuaternion(value)) {
                // Quaternion - display as read-only Euler angles
                const eulerAngles = quaternionToEuler(value);
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'prop-value-display quaternion-euler';
                valueDisplay.textContent = `(${formatNumber(eulerAngles.x, 2)}, ${formatNumber(eulerAngles.y, 2)}, ${formatNumber(eulerAngles.z, 2)})`;
                valueDisplay.title = 'Rotation in Euler angles (read-only)';
                
                valueContainer.appendChild(valueDisplay);
                
                // Only delete button for quaternions (no edit)
                const actions = document.createElement('div');
                actions.className = 'prop-actions';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'prop-button delete';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete';
                deleteBtn.onclick = () => this.deleteProp(type, key);
                
                actions.appendChild(deleteBtn);
                valueContainer.appendChild(actions);
                
            } else if (isVector3Object(value)) {
                // Vector3 always shows input fields
                const vectorGroup = document.createElement('div');
                vectorGroup.className = 'vector-group';
                
                ['x', 'y', 'z'].forEach(axis => {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'property-input number';
                    input.id = `${type}_prop_${key}_${axis}`;
                    input.value = value[axis] || 0;
                    input.step = 'any';
                    
                    // Auto-save on change
                    input.addEventListener('change', () => {
                        this.saveVector3Prop(type, key);
                    });
                    
                    // Handle Enter and Escape keys
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            this.saveVector3Prop(type, key);
                            e.preventDefault();
                        }
                    });
                    
                    const label = document.createElement('span');
                    label.className = 'vector-label';
                    label.textContent = axis.toUpperCase();
                    
                    vectorGroup.appendChild(label);
                    vectorGroup.appendChild(input);
                });
                
                valueContainer.appendChild(vectorGroup);
                
                // Delete button for Vector3
                const actions = document.createElement('div');
                actions.className = 'prop-actions';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'prop-button delete';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete';
                deleteBtn.onclick = () => this.deleteProp(type, key);
                
                actions.appendChild(deleteBtn);
                valueContainer.appendChild(actions);
                
            } else if (isEditing) {
                // Edit mode for non-Vector3
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'prop-input';
                input.id = `${type}_prop_${key}`;
                input.value = typeof value === 'object' ? JSON.stringify(value) : value;
                input.addEventListener('keypress', (e) => {
                    this.handlePropKeyPress(e, type, key);
                });
                valueContainer.appendChild(input);
                
                // Save/Cancel buttons
                const actions = document.createElement('div');
                actions.className = 'prop-actions';
                
                const saveBtn = document.createElement('button');
                saveBtn.className = 'prop-button save';
                saveBtn.innerHTML = '✓';
                saveBtn.title = 'Save';
                saveBtn.onclick = () => this.saveProp(type, key);
                
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'prop-button';
                cancelBtn.innerHTML = '×';
                cancelBtn.title = 'Cancel';
                cancelBtn.onclick = () => this.cancelEditProp(type, key);
                
                actions.appendChild(saveBtn);
                actions.appendChild(cancelBtn);
                valueContainer.appendChild(actions);
                
            } else {
                // Display mode for non-Vector3 and non-Quaternion
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'prop-value-display';
                
                if (typeof value === 'object') {
                    valueDisplay.textContent = JSON.stringify(value);
                } else {
                    valueDisplay.textContent = value;
                }
                
                valueContainer.appendChild(valueDisplay);
                
                // Edit/Delete buttons
                const actions = document.createElement('div');
                actions.className = 'prop-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'prop-button';
                editBtn.innerHTML = '✎';
                editBtn.title = 'Edit';
                editBtn.onclick = () => this.editProp(type, key);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'prop-button delete';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete';
                deleteBtn.onclick = () => this.deleteProp(type, key);
                
                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                valueContainer.appendChild(actions);
            }
            
            item.appendChild(keyElement);
            item.appendChild(valueContainer);
            
            return item;
        }

        /**
         * Start editing a property
         */
        editProp(type, key) {
            this.editingProps.set(`${type}_${key}`, true);
            this.render();
            
            // Focus the input after render
            setTimeout(() => {
                const props = type === 'public' ? sceneManager.scene.spaceState.public : sceneManager.scene.spaceState.protected;
                const value = props[key];
                
                if (isVector3Object(value)) {
                    // Focus the first Vector3 input (x)
                    const xInput = document.getElementById(`${type}_prop_${key}_x`);
                    if (xInput) {
                        xInput.focus();
                        xInput.select();
                    }
                } else {
                    // Focus regular input
                    const input = document.getElementById(`${type}_prop_${key}`);
                    if (input) {
                        input.focus();
                        input.select();
                    }
                }
            }, 0);
        }

        /**
         * Save edited property
         */
        saveProp(type, key) {
            const props = type === 'public' ? sceneManager.scene.spaceState.public : sceneManager.scene.spaceState.protected;
            const currentValue = props[key];
            
            if (isVector3Object(currentValue)) {
                // Save Vector3
                const xInput = document.getElementById(`${type}_prop_${key}_x`);
                const yInput = document.getElementById(`${type}_prop_${key}_y`);
                const zInput = document.getElementById(`${type}_prop_${key}_z`);
                
                if (xInput && yInput && zInput) {
                    const newValue = {
                        x: parseFloat(xInput.value) || 0,
                        y: parseFloat(yInput.value) || 0,
                        z: parseFloat(zInput.value) || 0
                    };
                    const change = new SpacePropertyChange(key, newValue, type === 'protected', { source: 'ui' });
                    changeManager.applyChange(change);
                }
            } else {
                // Save regular value
                const input = document.getElementById(`${type}_prop_${key}`);
                if (input) {
                    // Use parseValue method to handle all value types including Vector3
                    const newValue = this.parseValue(input.value);
                    const change = new SpacePropertyChange(key, newValue, type === 'protected', { source: 'ui' });
                    changeManager.applyChange(change);
                }
            }
            
            this.cancelEditProp(type, key);
        }

        /**
         * Cancel editing a property
         */
        cancelEditProp(type, key) {
            this.editingProps.delete(`${type}_${key}`);
            this.render();
        }

        /**
         * Delete a property
         */
        deleteProp(type, key) {
            if (confirm(`Are you sure you want to delete the ${type} property "${key}"?`)) {
                const change = new SpacePropertyChange(key, undefined, type === 'protected', { source: 'ui' });
                changeManager.applyChange(change);
                if (type === 'public') {
                    delete sceneManager.scene.spaceState.public[key];
                } else {
                    delete sceneManager.scene.spaceState.protected[key];
                }
                this.render();
            }
        }

        /**
         * Add public property
         */
        addPublicProp() {
            const keyInput = document.getElementById('addPublicKey');
            const valueInput = document.getElementById('addPublicValue');
            
            if (!keyInput || !valueInput) return;
            
            const key = keyInput.value.trim();
            const value = this.parseValue(valueInput.value);
            
            if (key) {
                const change = new SpacePropertyChange(key, value, false, { source: 'ui' });
                changeManager.applyChange(change);
                sceneManager.scene.spaceState.public[key] = value;
                keyInput.value = '';
                valueInput.value = '';
                this.render();
            }
        }

        /**
         * Add protected property
         */
        addProtectedProp() {
            const keyInput = document.getElementById('addProtectedKey');
            const valueInput = document.getElementById('addProtectedValue');
            
            if (!keyInput || !valueInput) return;
            
            const key = keyInput.value.trim();
            const value = this.parseValue(valueInput.value);
            
            if (key) {
                const change = new SpacePropertyChange(key, value, true, { source: 'ui' });
                changeManager.applyChange(change);
                sceneManager.scene.spaceState.protected[key] = value;
                keyInput.value = '';
                valueInput.value = '';
                this.render();
            }
        }

        /**
         * Parse value from string input
         */
        parseValue(value) {
            value = value.trim();
            
            // Try to parse as JSON
            if (value.startsWith('{') || value.startsWith('[')) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    // Keep as string if JSON parse fails
                }
            }
            
            // Check for Vector3 format: "(x, y, z)" or "x y z" or "x,y,z"
            const vector3Pattern = /^\(?\s*(-?\d*\.?\d+)\s*[,\s]\s*(-?\d*\.?\d+)\s*[,\s]\s*(-?\d*\.?\d+)\s*\)?$/;
            const match = value.match(vector3Pattern);
            if (match) {
                return {
                    x: parseFloat(match[1]),
                    y: parseFloat(match[2]),
                    z: parseFloat(match[3])
                };
            }
            
            // Check for boolean
            if (value === 'true') return true;
            if (value === 'false') return false;
            
            // Check for number
            if (!isNaN(value) && value !== '') {
                return parseFloat(value);
            }
            
            // Return as string
            return value;
        }

        /**
         * Save Vector3 property directly
         */
        saveVector3Prop(type, key) {
            const xInput = document.getElementById(`${type}_prop_${key}_x`);
            const yInput = document.getElementById(`${type}_prop_${key}_y`);
            const zInput = document.getElementById(`${type}_prop_${key}_z`);
            
            if (xInput && yInput && zInput) {
                const newValue = {
                    x: parseFloat(xInput.value) || 0,
                    y: parseFloat(yInput.value) || 0,
                    z: parseFloat(zInput.value) || 0
                };
                const change = new SpacePropertyChange(key, newValue, type === 'protected', { source: 'ui' });
                changeManager.applyChange(change);
                
                // Update local state
                if (type === 'public') {
                    sceneManager.scene.spaceState.public[key] = newValue;
                } else {
                    sceneManager.scene.spaceState.protected[key] = newValue;
                }
            }
        }

        /**
         * Handle key press in property input
         */
        handlePropKeyPress(event, type, key) {
            if (event.key === 'Enter') {
                this.saveProp(type, key);
            } else if (event.key === 'Escape') {
                this.cancelEditProp(type, key);
            }
        }
    }

    // Make functions globally available for inline onclick handlers
    window.addPublicProp = () => {
        const panel = window.spacePropsPanel;
        if (panel) panel.addPublicProp();
    };

    window.addProtectedProp = () => {
        const panel = window.spacePropsPanel;
        if (panel) panel.addProtectedProp();
    };
//})()