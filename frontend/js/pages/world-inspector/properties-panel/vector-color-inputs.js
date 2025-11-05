/**
 * Vector and Color Input Renderer
 * Creates specialized input fields for Vector3, Vector4 (Quaternion), and Color properties
 */

export class VectorColorInputRenderer {
    constructor(utils) {
        this.utils = utils || {};
    }

    /**
     * Create a Vector3 input group
     * @param {string} label - Property label
     * @param {Object} value - Current vector3 value {x, y, z}
     * @param {Function} onChange - Callback when value changes (axis, newValue)
     * @param {string} entityId - Entity ID for input identification
     * @param {Object} entity - Entity object
     * @param {boolean} isScaleProperty - Whether this is a scale property
     * @param {Object} scaleLockHandler - Scale lock handler instance (optional)
     * @param {boolean} showResetButton - Whether to show reset button
     * @returns {HTMLElement} - The vector3 input container
     */
    createVector3Input(label, value, onChange, entityId, entity = null, isScaleProperty = false, scaleLockHandler = null, showResetButton = false) {
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
            input.id = `${entityId}_${label}.${axis}`;

            input.onchange = () => {
                if (isScaleProperty && scaleLockHandler && scaleLockHandler.isLocked(`${entityId}_${label}`)) {
                    const newVector = scaleLockHandler.handleProportionalScale(
                        `${entityId}_${label}`,
                        value,
                        axis,
                        input.value
                    );
                    onChange('proportional', newVector);
                } else {
                    onChange(axis, input.value, value);
                }
            };

            // VR input handler integration
            if (entity && typeof inputHandler !== 'undefined') {
                input.onclick = (e) => {
                    inputHandler.inputFocusChanged(input, entity, `${label}.${axis}`);
                };

                if (inputHandler.focusComponent === entity && inputHandler.focusProperty === `${label}.${axis}`) {
                    input.style.backgroundColor = "#1e3764";
                    input.style.borderColor = "#326689";
                }
            }

            vectorGroup.appendChild(axisLabel);
            vectorGroup.appendChild(input);
        });

        vectorContainer.appendChild(vectorGroup);

        // Add scale lock button for scale properties
        if (isScaleProperty && scaleLockHandler) {
            const scaleLockKey = `${entityId}_${label}`;
            const lockButton = scaleLockHandler.createLockButton(scaleLockKey, value);
            vectorGroup.appendChild(lockButton);
        }

        // Add reset button for position properties
        if (showResetButton) {
            const resetButton = this.createVector3ResetButton(label, () => {
                const zeroVector = { x: 0, y: 0, z: 0 };
                onChange('reset', zeroVector);
            });
            vectorGroup.appendChild(resetButton);
        }

        return vectorContainer;
    }

    /**
     * Create a Vector4 input group (for Quaternion/rotation)
     * @param {string} label - Property label
     * @param {Object} value - Current quaternion value {x, y, z, w}
     * @param {Function} onChange - Callback when value changes (axis, newValue)
     * @param {string} entityId - Entity ID for input identification
     * @param {Object} entity - Entity object
     * @param {boolean} showResetButton - Whether to show reset button
     * @returns {HTMLElement} - The vector4 input container
     */
    createVector4Input(label, value, onChange, entityId, entity = null, showResetButton = false) {
        const { quaternionToEuler, formatNumber } = this.utils;

        // Convert quaternion to Euler angles for display
        const eulerAngles = quaternionToEuler ? quaternionToEuler(value) : { x: 0, y: 0, z: 0 };

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
            input.value = formatNumber ? formatNumber(eulerAngles[axis], 2) : eulerAngles[axis];
            input.step = 'any';
            input.id = `${entityId}_${label}.${axis}`;

            input.onchange = () => onChange(axis, input.value, value);

            // VR input handler integration for rotation
            if (entity && typeof inputHandler !== 'undefined') {
                input.onclick = (e) => {
                    inputHandler.inputFocusChanged(input, entity, `localRotation.${axis}`);
                };

                if (inputHandler.focusComponent === entity && inputHandler.focusProperty === `localRotation.${axis}`) {
                    input.style.backgroundColor = "#1e3764";
                    input.style.borderColor = "#326689";
                }
            }

            vectorGroup.appendChild(axisLabel);
            vectorGroup.appendChild(input);
        });

        // Add reset button for rotation
        if (showResetButton) {
            const resetButton = this.createRotationResetButton(() => {
                const zeroRotation = { x: 0, y: 0, z: 0, w: 1 };
                onChange('reset', zeroRotation);
            });
            vectorGroup.appendChild(resetButton);
        }

        vectorContainer.appendChild(vectorGroup);
        return vectorContainer;
    }

    /**
     * Create a color input with preview and RGBA sliders
     * @param {string} key - Property key
     * @param {Object} value - Current color value {r, g, b, a}
     * @param {string} componentId - Component ID
     * @param {Object} component - Component object
     * @param {Function} onChange - Callback when color changes
     * @returns {HTMLElement} - The color input container
     */
    createColorInput(key, value, componentId, component = null, onChange) {
        const { rgbToHex, hexToRgb } = this.utils;

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

        if (rgbToHex) {
            colorInput.value = rgbToHex(value.r * 255, value.g * 255, value.b * 255);
        }

        colorInput.onchange = () => {
            if (hexToRgb) {
                const rgb = hexToRgb(colorInput.value);
                const newColor = {
                    r: rgb.r / 255,
                    g: rgb.g / 255,
                    b: rgb.b / 255,
                    a: value.a || 1
                };
                swatch.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${newColor.a})`;
                if (onChange) {
                    onChange(newColor);
                }
            }
        };

        // Enable color input handler for VR
        if (component && typeof inputHandler !== 'undefined') {
            preview.onclick = (e) => {
                e.stopPropagation();
                inputHandler.inputFocusChanged(colorInput, component, key);
            };
        }

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
                    // Create a new color object instead of mutating the existing one
                    const newColor = {
                        r: channel === 'r' ? Math.max(0, Math.min(1, newValue)) : value.r,
                        g: channel === 'g' ? Math.max(0, Math.min(1, newValue)) : value.g,
                        b: channel === 'b' ? Math.max(0, Math.min(1, newValue)) : value.b,
                        a: channel === 'a' ? Math.max(0, Math.min(1, newValue)) : (value.a || 1)
                    };
                    swatch.style.backgroundColor = `rgba(${newColor.r * 255}, ${newColor.g * 255}, ${newColor.b * 255}, ${newColor.a})`;
                    if (onChange) {
                        onChange(newColor);
                    }
                }
            };

            // VR input handler integration
            if (component && typeof inputHandler !== 'undefined') {
                input.onclick = (e) => {
                    inputHandler.inputFocusChanged(input, component, `${key}.${channel}`);
                };

                if (inputHandler.focusComponent === component && inputHandler.focusProperty === `${key}.${channel}`) {
                    input.style.backgroundColor = "#1e3764";
                    input.style.borderColor = "#326689";
                }
            }

            rgbaContainer.appendChild(input);
        });

        colorGroup.appendChild(preview);
        colorGroup.appendChild(colorInput);
        colorGroup.appendChild(rgbaContainer);

        return colorGroup;
    }

    /**
     * Create a reset button for Vector3 properties
     * @param {string} label - Property label
     * @param {Function} onReset - Callback when reset is clicked
     * @returns {HTMLElement} - The reset button
     */
    createVector3ResetButton(label, onReset) {
        const resetButton = document.createElement('button');
        resetButton.className = 'position-reset-btn';
        resetButton.style.marginLeft = '8px';
        resetButton.style.padding = '4px 8px';
        resetButton.style.background = '#2a2a2a';
        resetButton.style.border = '1px solid #3a3a3a';
        resetButton.style.borderRadius = '4px';
        resetButton.style.color = '#999';
        resetButton.style.cursor = 'pointer';
        resetButton.style.fontSize = '14px';
        resetButton.innerHTML = '∅';
        resetButton.title = `Reset ${label} to zero`;

        resetButton.onmousedown = (e) => {
            e.stopPropagation();
            if (onReset) {
                onReset();
            }
        };

        return resetButton;
    }

    /**
     * Create a reset button for rotation properties
     * @param {Function} onReset - Callback when reset is clicked
     * @returns {HTMLElement} - The reset button
     */
    createRotationResetButton(onReset) {
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
            if (onReset) {
                onReset();
            }
        };

        return resetButton;
    }

    /**
     * Check if a value is a Vector3 object
     * @param {*} value - Value to check
     * @returns {boolean} - True if value is a Vector3
     */
    isVector3Object(value) {
        return value &&
               typeof value === 'object' &&
               'x' in value &&
               'y' in value &&
               'z' in value &&
               !('w' in value);
    }

    /**
     * Check if a value is a Quaternion object
     * @param {*} value - Value to check
     * @returns {boolean} - True if value is a Quaternion
     */
    isQuaternion(value) {
        return value &&
               typeof value === 'object' &&
               'x' in value &&
               'y' in value &&
               'z' in value &&
               'w' in value;
    }

    /**
     * Check if a value is a Color object
     * @param {*} value - Value to check
     * @returns {boolean} - True if value is a Color
     */
    isColor(value) {
        return value &&
               typeof value === 'object' &&
               'r' in value &&
               'g' in value &&
               'b' in value;
    }
}