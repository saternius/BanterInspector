/**
 * Property Updater
 * Handles programmatic property value updates and DOM synchronization
 */

export class PropertyUpdater {
    constructor() {
        // This class is stateless, just provides update methods
    }

    /**
     * Update a property value programmatically
     * @param {string} componentId - The ID of the component
     * @param {string} propertyKey - The key of the property to update
     * @param {*} newValue - The new value to set
     * @param {Object} utils - Utility functions (optional)
     */
    updateProperty(componentId, propertyKey, newValue, utils = {}) {
        const propertyRowId = `prop_${componentId}_${propertyKey}`;
        const propertyRow = document.getElementById(propertyRowId);

        if (!propertyRow) {
            //console.warn(`Property row not found: ${propertyRowId}`);
            return;
        }

        // Update based on value type
        if (typeof newValue === 'boolean') {
            this.updateCheckbox(propertyRow, newValue);
        } else if (typeof newValue === 'number') {
            this.updateNumberInput(propertyRow, newValue);
        } else if (typeof newValue === 'string') {
            this.updateStringInput(propertyRow, newValue);
        } else if (typeof newValue === 'object') {
            this.updateObjectProperty(propertyRow, newValue, utils);
        }
    }

    /**
     * Update a checkbox input
     * @param {HTMLElement} propertyRow - The property row element
     * @param {boolean} value - The new checkbox value
     */
    updateCheckbox(propertyRow, value) {
        const checkbox = propertyRow.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = value;
        }
    }

    /**
     * Update a number input
     * @param {HTMLElement} propertyRow - The property row element
     * @param {number} value - The new number value
     */
    updateNumberInput(propertyRow, value) {
        const numberInput = propertyRow.querySelector('input[type="number"]:not(.vector-group input)');
        if (numberInput) {
            numberInput.value = value;
        }
    }

    /**
     * Update a string input (text or dropdown)
     * @param {HTMLElement} propertyRow - The property row element
     * @param {string} value - The new string value
     */
    updateStringInput(propertyRow, value) {
        // Check for dropdowns first
        const dropdown = propertyRow.querySelector('select');
        if (dropdown) {
            dropdown.value = value;
        } else {
            // Text input
            const textInput = propertyRow.querySelector('input[type="text"]');
            if (textInput) {
                textInput.value = value;
            }
        }
    }

    /**
     * Update an object property (Vector3, Color, Quaternion, etc.)
     * @param {HTMLElement} propertyRow - The property row element
     * @param {Object} value - The new object value
     * @param {Object} utils - Utility functions
     */
    updateObjectProperty(propertyRow, value, utils) {
        if (!value) return;

        // Handle Vector3 objects
        if ('x' in value && 'y' in value && 'z' in value && !('w' in value)) {
            this.updateVector3(propertyRow, value);
        }
        // Handle Quaternion (rotation) - has x, y, z, and w
        else if ('x' in value && 'y' in value && 'z' in value && 'w' in value) {
            this.updateQuaternion(propertyRow, value, utils);
        }
        // Handle Color objects
        else if ('r' in value && 'g' in value && 'b' in value) {
            this.updateColor(propertyRow, value, utils);
        }
    }

    /**
     * Update Vector3 inputs
     * @param {HTMLElement} propertyRow - The property row element
     * @param {Object} value - The vector3 value {x, y, z}
     */
    updateVector3(propertyRow, value) {
        const vectorInputs = propertyRow.querySelectorAll('.vector-group input[type="number"]');
        if (vectorInputs.length >= 3) {
            vectorInputs[0].value = value.x || 0;
            vectorInputs[1].value = value.y || 0;
            vectorInputs[2].value = value.z || 0;
        }
    }

    /**
     * Update Quaternion inputs (converted to Euler angles)
     * @param {HTMLElement} propertyRow - The property row element
     * @param {Object} value - The quaternion value {x, y, z, w}
     * @param {Object} utils - Utility functions containing quaternionToEuler and formatNumber
     */
    updateQuaternion(propertyRow, value, utils) {
        const { quaternionToEuler, formatNumber } = utils || {};

        if (quaternionToEuler) {
            const eulerAngles = quaternionToEuler(value);
            const vectorInputs = propertyRow.querySelectorAll('.vector-group input[type="number"]');
            if (vectorInputs.length >= 3) {
                vectorInputs[0].value = formatNumber ? formatNumber(eulerAngles.x, 2) : eulerAngles.x;
                vectorInputs[1].value = formatNumber ? formatNumber(eulerAngles.y, 2) : eulerAngles.y;
                vectorInputs[2].value = formatNumber ? formatNumber(eulerAngles.z, 2) : eulerAngles.z;
            }
        }
    }

    /**
     * Update Color inputs
     * @param {HTMLElement} propertyRow - The property row element
     * @param {Object} value - The color value {r, g, b, a}
     * @param {Object} utils - Utility functions containing rgbToHex
     */
    updateColor(propertyRow, value, utils) {
        // Update color swatch
        const colorSwatch = propertyRow.querySelector('.color-swatch');
        if (colorSwatch) {
            colorSwatch.style.backgroundColor = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, ${value.a || 1})`;
        }

        // Update RGBA inputs
        const rgbaInputs = propertyRow.querySelectorAll('.vector-group input[type="number"]');
        if (rgbaInputs.length >= 3) {
            rgbaInputs[0].value = value.r || 0;
            rgbaInputs[1].value = value.g || 0;
            rgbaInputs[2].value = value.b || 0;
            if (rgbaInputs[3]) {
                rgbaInputs[3].value = value.a || 1;
            }
        }

        // Update hidden color input
        const colorInput = propertyRow.querySelector('input[type="color"]');
        if (colorInput) {
            const { rgbToHex } = utils || {};
            if (rgbToHex) {
                colorInput.value = rgbToHex(value.r * 255, value.g * 255, value.b * 255);
            }
        }
    }

    /**
     * Update all properties for a component
     * @param {string} componentId - The component ID
     * @param {Object} properties - Object containing property key-value pairs
     * @param {Object} utils - Utility functions
     */
    updateAllProperties(componentId, properties, utils) {
        if (!properties) return;

        Object.entries(properties).forEach(([key, value]) => {
            this.updateProperty(componentId, key, value, utils);
        });
    }

    /**
     * Update a specific entity property by searching for its label
     * @param {HTMLElement} entitySection - The entity section element
     * @param {string} propertyLabel - The property label to search for
     * @param {*} value - The new value
     */
    updateEntityProperty(entitySection, propertyLabel, value) {
        if (!entitySection) return;

        const propertyRows = entitySection.querySelectorAll('.property-row');
        for (const row of propertyRows) {
            const label = row.querySelector('.property-label');
            if (label && label.textContent === propertyLabel) {
                // Determine type and update accordingly
                if (typeof value === 'boolean') {
                    this.updateCheckbox(row, value);
                } else if (typeof value === 'number') {
                    this.updateNumberInput(row, value);
                } else if (typeof value === 'string') {
                    this.updateStringInput(row, value);
                } else if (typeof value === 'object') {
                    this.updateObjectProperty(row, value);
                }
                break;
            }
        }
    }
}