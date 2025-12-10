/**
 * Property Input Renderer
 * Factory for creating property input fields of various types
 */

import { VectorColorInputRenderer } from './vector-color-inputs.js';

export class PropertyInputRenderer {
    constructor(utils, changeManager, scaleLockHandler = null) {
        this.utils = utils || {};
        this.changeManager = changeManager;
        this.scaleLockHandler = scaleLockHandler;
        this.vectorColorRenderer = new VectorColorInputRenderer(utils);
    }

    /**
     * Create a simple property row for Entities and MonoBehaviors
     * @param {string} label - Property label
     * @param {*} value - Current value
     * @param {string} type - Input type ('checkbox', 'text', 'dropdown', 'vector3', 'vector4', 'number')
     * @param {Function} onChange - Callback when value changes
     * @param {Object} enums - Enum values for dropdown (optional)
     * @param {string} entityId - Entity ID (optional)
     * @param {Object} entity - Entity object (optional)
     * @returns {HTMLElement} - The property row element
     */
    createPropertyRow(label, value, type, onChange, enums = null, entityId = null, entity = null) {
        const { formatPropertyName } = this.utils;

        const row = document.createElement('div');
        row.className = 'property-row';

        const labelElement = document.createElement('span');
        labelElement.className = 'property-label';
        labelElement.textContent = formatPropertyName ? formatPropertyName(label) : label;

        const valueContainer = document.createElement('div');
        valueContainer.className = 'property-value';

        // Create appropriate input based on type
        switch (type) {
            case 'checkbox':
                valueContainer.appendChild(this.createCheckboxInput(value, onChange, entityId, label));
                break;
            case 'text':
                valueContainer.appendChild(this.createTextInput(value, onChange, entityId, label));
                break;
            case 'number':
                valueContainer.appendChild(this.createNumberInput(value, onChange, entityId, label, entity));
                break;
            case 'dropdown':
                valueContainer.appendChild(this.createDropdownInput(value, enums, onChange, entityId, label));
                break;
            case 'vector3':
                this.createVector3Row(valueContainer, label, value, onChange, entityId, entity);
                break;
            case 'vector4':
                this.createVector4Row(valueContainer, label, value, onChange, entityId, entity);
                break;
        }

        row.appendChild(document.createElement('span')); // Empty space for button
        row.appendChild(labelElement);
        row.appendChild(valueContainer);

        return row;
    }

    /**
     * Render a property row for arbitrary Components
     * @param {string} key - Property key
     * @param {*} value - Property value
     * @param {Object} component - Component object
     * @param {number} componentIndex - Component index
     * @param {number} propertyIndex - Property index
     * @returns {HTMLElement} - The property row element
     */
    renderProperty(key, value, component, componentIndex, propertyIndex) {
        const { formatPropertyName, parseBest, deepClone } = this.utils;
        const { ComponentPropertyChange } = this.changeManager.changeTypes || {};

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
        label.textContent = formatPropertyName ? formatPropertyName(key) : key;
        label.title = key;

        // Property value container
        const valueContainer = document.createElement('div');
        valueContainer.className = 'property-value';

        const enums = component.enums ? component.enums() : {};
        // log('property-input-renderer', 'rendering property', key, value, component, componentIndex, propertyIndex)
        // Handle different property types
        if (enums[key]) {
            // Enum dropdown
            valueContainer.appendChild(
                this.createEnumDropdown(key, value, enums[key], componentId, ComponentPropertyChange)
            );
            valueContainer.style.width = '50%';
        } else if (key === "uid") {
            // User UID dropdown
            valueContainer.appendChild(
                this.createUserUidDropdown(value, componentId, key, ComponentPropertyChange)
            );
        } else if (typeof value === 'boolean') {
            // Boolean checkbox
            valueContainer.appendChild(
                this.createComponentCheckbox(value, componentId, key, ComponentPropertyChange)
            );
        } else if (typeof value === 'number') {
            // Number input
            valueContainer.appendChild(
                this.createComponentNumberInput(value, componentId, key, component, ComponentPropertyChange)
            );
        } else if (this.vectorColorRenderer.isVector3Object(value)) {
            // Vector3 input
            this.createComponentVector3Input(valueContainer, key, value, componentId, component, ComponentPropertyChange);
        } else if (key === 'color' && this.vectorColorRenderer.isColor(value)) {
            // Color input
            const colorInput = this.vectorColorRenderer.createColorInput(key, value, componentId, component, (newColor) => {
                if (ComponentPropertyChange) {
                    const change = new ComponentPropertyChange(componentId, key, newColor, { source: 'ui' });
                    this.changeManager.applyChange(change);
                }
            });
            valueContainer.appendChild(colorInput);
        } else {
            // String or other types - text input
            valueContainer.appendChild(
                this.createComponentTextInput(value, componentId, key, ComponentPropertyChange)
            );
        }

        row.appendChild(button);
        row.appendChild(label);
        row.appendChild(valueContainer);

        return row;
    }

    /**
     * Create a checkbox input
     */
    createCheckboxInput(value, onChange, entityId, label) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'checkbox-input';
        input.checked = value;
        if (entityId) {
            input.id = `${entityId}_${label}`;
        }
        input.onchange = () => onChange(input.checked);
        return input;
    }

    /**
     * Create a text input
     */
    createTextInput(value, onChange, entityId, label) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'property-input';
        input.value = value || '';
        if (entityId) {
            input.id = `${entityId}_${label}`;
        }
        input.onchange = () => onChange(input.value);
        return input;
    }

    /**
     * Create a number input
     */
    createNumberInput(value, onChange, entityId, label, entity = null) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'property-input number';
        input.value = value || 0;
        input.step = 'any';
        if (entityId) {
            input.id = `${entityId}_${label}`;
        }
        input.onchange = () => {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue)) {
                onChange(numValue);
            }
        };

        // VR input handler integration
        if (entity && typeof inputHandler !== 'undefined') {
            input.onclick = (e) => {
                inputHandler.inputFocusChanged(input, entity, label);
            };

            if (inputHandler.focusComponent === entity && inputHandler.focusProperty === label) {
                input.style.backgroundColor = "#1e3764";
                input.style.borderColor = "#326689";
            }
        }

        return input;
    }

    /**
     * Create a dropdown input
     */
    createDropdownInput(value, enums, onChange, entityId, label) {
        const select = document.createElement('select');
        select.className = 'property-input';
        if (entityId) {
            select.id = `${entityId}_${label}`;
        }

        Object.entries(enums).forEach(([key, enumValue]) => {
            const option = document.createElement('option');
            option.value = enumValue;
            option.textContent = key;
            if (enumValue === value) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.onchange = () => onChange(select.value);
        return select;
    }

    /**
     * Create Vector3 row content
     */
    createVector3Row(valueContainer, label, value, onChange, entityId, entity) {
        const isScaleProperty = label.toLowerCase().includes('scale');
        const showResetButton = label === 'localPosition' || label === 'position';

        const vector3Input = this.vectorColorRenderer.createVector3Input(
            label,
            value,
            onChange,
            entityId,
            entity,
            isScaleProperty,
            this.scaleLockHandler,
            showResetButton
        );

        valueContainer.appendChild(vector3Input);
    }

    /**
     * Create Vector4 (Quaternion) row content
     */
    createVector4Row(valueContainer, label, value, onChange, entityId, entity) {
        const showResetButton = label === 'localRotation' || label === 'rotation';

        const vector4Input = this.vectorColorRenderer.createVector4Input(
            label,
            value,
            onChange,
            entityId,
            entity,
            showResetButton
        );

        valueContainer.appendChild(vector4Input);
    }

    /**
     * Create enum dropdown for component
     */
    createEnumDropdown(key, value, enumValues, componentId, ComponentPropertyChange) {
        const { parseBest } = this.utils;
        const dropdown = document.createElement('select');
        dropdown.className = 'property-input';
        dropdown.style.width = '100%';

        Object.keys(enumValues).forEach(enumKey => {
            const option = document.createElement('option');
            option.value = enumKey;
            option.textContent = enumValues[enumKey];
            if (value == enumKey) {
                option.selected = true;
            }
            dropdown.appendChild(option);
        });

        dropdown.onchange = () => {
            if (ComponentPropertyChange) {
                const change = new ComponentPropertyChange(
                    componentId,
                    key,
                    parseBest ? parseBest(dropdown.value) : dropdown.value,
                    { source: 'ui' }
                );
                this.changeManager.applyChange(change);
            }
        };

        return dropdown;
    }

    /**
     * Create user UID dropdown for component
     */
    createUserUidDropdown(value, componentId, key, ComponentPropertyChange) {
        const dropdown = document.createElement('select');
        dropdown.className = 'property-input';
        dropdown.style.width = '100%';

        // Add users from scene
        if (typeof SM !== 'undefined' && SM.scene && SM.scene.users) {
            Object.values(SM.scene.users).forEach(user => {
                const option = document.createElement('option');
                option.value = user.uid;
                option.textContent = user.name;
                if (value === user.uid) {
                    option.selected = true;
                }
                dropdown.appendChild(option);
            });
        }

        // Add null/empty option
        const nullOption = document.createElement('option');
        nullOption.value = "";
        nullOption.textContent = "None";
        if (value === "") {
            nullOption.selected = true;
        }
        dropdown.appendChild(nullOption);

        dropdown.onchange = () => {
            if (ComponentPropertyChange) {
                const change = new ComponentPropertyChange(componentId, key, dropdown.value, { source: 'ui' });
                this.changeManager.applyChange(change);
            }
        };

        return dropdown;
    }

    /**
     * Create checkbox for component property
     */
    createComponentCheckbox(value, componentId, key, ComponentPropertyChange) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'checkbox-input';
        input.checked = value;

        input.onchange = () => {
            if (ComponentPropertyChange) {
                const change = new ComponentPropertyChange(componentId, key, input.checked, { source: 'ui' });
                this.changeManager.applyChange(change);
            }
        };

        return input;
    }

    /**
     * Create number input for component property
     */
    createComponentNumberInput(value, componentId, key, component, ComponentPropertyChange) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'property-input number';
        input.value = value;
        input.step = 'any';

        input.onchange = () => {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue) && ComponentPropertyChange) {
                const change = new ComponentPropertyChange(componentId, key, numValue, { source: 'ui' });
                this.changeManager.applyChange(change);
            }
        };

        // VR input handler integration
        if (component && typeof inputHandler !== 'undefined') {
            input.onclick = (e) => {
                inputHandler.inputFocusChanged(input, component, key);
            };

            if (inputHandler.focusComponent === component && inputHandler.focusProperty === key) {
                input.style.backgroundColor = "#1e3764";
                input.style.borderColor = "#326689";
            }
        }

        return input;
    }

    /**
     * Create text input for component property
     */
    createComponentTextInput(value, componentId, key, ComponentPropertyChange) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'property-input';
        input.value = value?.toString() || '';

        input.onchange = () => {
            if (ComponentPropertyChange) {
                const change = new ComponentPropertyChange(componentId, key, input.value, { source: 'ui' });
                this.changeManager.applyChange(change);
            }
        };

        return input;
    }

    /**
     * Create Vector3 input for component property
     */
    createComponentVector3Input(valueContainer, key, value, componentId, component, ComponentPropertyChange) {
        const { deepClone } = this.utils;

        const handleVector3Change = (axis, newValue) => {
            if (!ComponentPropertyChange || !deepClone) return;

            let newVector = deepClone(value);
            const numValue = parseFloat(newValue);
            if (!isNaN(numValue)) {
                newVector[axis] = numValue;
                const change = new ComponentPropertyChange(
                    componentId,
                    key,
                    newVector,
                    { source: 'ui', oldValue: value }
                );
                this.changeManager.applyChange(change);
            }
        };

        const vector3Input = this.vectorColorRenderer.createVector3Input(
            key,
            value,
            handleVector3Change,
            componentId,
            component,
            false,
            null,
            false
        );

        valueContainer.appendChild(vector3Input);
    }
}