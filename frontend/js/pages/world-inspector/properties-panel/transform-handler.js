/**
 * Transform Handler
 * Manages transform mode (local/global) and transform calculations
 */

export class TransformHandler {
    constructor() {
        // Transform display mode - 'local' or 'global'
        this.transformMode = 'local';
    }

    /**
     * Get the current transform mode
     * @returns {string} - 'local' or 'global'
     */
    getMode() {
        return this.transformMode;
    }

    /**
     * Toggle between local and global transform mode
     * @returns {string} - The new transform mode
     */
    toggleMode() {
        this.transformMode = this.transformMode === 'local' ? 'global' : 'local';
        return this.transformMode;
    }

    /**
     * Set the transform mode
     * @param {string} mode - 'local' or 'global'
     */
    setMode(mode) {
        if (mode === 'local' || mode === 'global') {
            this.transformMode = mode;
        }
    }

    /**
     * Get transform values based on current mode
     * @param {Object} entity - The entity to get transform values from
     * @returns {Object} - Object containing position, rotation, and scale values
     */
    getTransformValues(entity) {
        if (!entity) {
            return {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
                scale: { x: 1, y: 1, z: 1 }
            };
        }

        if (this.transformMode === 'global') {
            return {
                position: entity.transform.position || { x: 0, y: 0, z: 0 },
                rotation: entity.transform.rotation || { x: 0, y: 0, z: 0, w: 1 },
                scale: entity.transform.scale || { x: 1, y: 1, z: 1 }
            };
        } else {
            return {
                position: entity.transformVal("localPosition"),
                rotation: entity.transformVal("localRotation"),
                scale: entity.transformVal("localScale")
            };
        }
    }

    /**
     * Get transform property labels based on current mode
     * @returns {Object} - Object containing positionLabel, rotationLabel, and scaleLabel
     */
    getTransformLabels() {
        if (this.transformMode === 'global') {
            return {
                positionLabel: 'position',
                rotationLabel: 'rotation',
                scaleLabel: 'scale'
            };
        } else {
            return {
                positionLabel: 'localPosition',
                rotationLabel: 'localRotation',
                scaleLabel: 'localScale'
            };
        }
    }

    /**
     * Create a transform mode toggle button
     * @param {Function} onToggle - Callback when button is clicked
     * @returns {HTMLElement} - The toggle button element
     */
    createModeToggleButton(onToggle) {
        const transformToggleBtn = document.createElement('button');
        transformToggleBtn.className = 'transform-mode-toggle-btn';
        transformToggleBtn.style.padding = '4px 8px';
        transformToggleBtn.style.marginRight = '8px';
        transformToggleBtn.style.background = '#2a2a2a';
        transformToggleBtn.style.border = '1px solid #3a3a3a';
        transformToggleBtn.style.borderRadius = '4px';
        transformToggleBtn.style.color = '#ccc';
        transformToggleBtn.style.cursor = 'pointer';
        transformToggleBtn.style.fontSize = '11px';
        transformToggleBtn.style.fontWeight = 'bold';
        transformToggleBtn.textContent = this.transformMode === 'local' ? 'Local' : 'Global';
        transformToggleBtn.title = 'Toggle between local and global transform display';

        transformToggleBtn.onmousedown = (e) => {
            e.stopPropagation();
            this.toggleMode();
            transformToggleBtn.textContent = this.transformMode === 'local' ? 'Local' : 'Global';
            if (onToggle) {
                onToggle();
            }
        };

        return transformToggleBtn;
    }

    /**
     * Create a reset button for position properties
     * @param {Function} onReset - Callback when reset is clicked
     * @returns {HTMLElement} - The reset button element
     */
    createPositionResetButton(onReset) {
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
        resetButton.title = 'Reset position to zero';

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
     * @returns {HTMLElement} - The reset button element
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
     * Update transform inputs in the DOM to match current entity state
     * @param {HTMLElement} section - The entity section element
     * @param {Object} entity - The entity to update from
     * @param {Object} utils - Utility functions (quaternionToEuler, formatNumber)
     */
    updateTransformInputs(section, entity, utils) {
        if (!entity || !section) return;

        const { quaternionToEuler, formatNumber } = utils;

        // Get current transform values based on mode
        const transforms = this.getTransformValues(entity);
        const labels = this.getTransformLabels();

        // Format labels for display
        const formatPropertyName = (name) => {
            return name.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        };

        const positionLabel = formatPropertyName(labels.positionLabel);
        const rotationLabel = formatPropertyName(labels.rotationLabel);
        const scaleLabel = formatPropertyName(labels.scaleLabel);

        // Update position inputs
        this.updateVector3Inputs(section, positionLabel, transforms.position, formatNumber);

        // Update rotation inputs (convert quaternion to euler)
        const eulerAngles = quaternionToEuler(transforms.rotation);
        this.updateVector3Inputs(section, rotationLabel, eulerAngles, formatNumber);

        // Update scale inputs
        this.updateVector3Inputs(section, scaleLabel, transforms.scale, formatNumber);
    }

    /**
     * Helper to update vector3 inputs for a specific property
     * @param {HTMLElement} section - The section containing the inputs
     * @param {string} labelText - The label text to match
     * @param {Object} values - The values to set {x, y, z}
     * @param {Function} formatNumber - Number formatting function
     */
    updateVector3Inputs(section, labelText, values, formatNumber) {
        const propertyRows = section.querySelectorAll('.property-row');
        for (const row of propertyRows) {
            const label = row.querySelector('.property-label');
            if (label && label.textContent === labelText) {
                const inputs = row.querySelectorAll('.vector-group input[type="number"]');
                if (inputs.length >= 3) {
                    inputs[0].value = formatNumber ? formatNumber(values.x, 6) : values.x;
                    inputs[1].value = formatNumber ? formatNumber(values.y, 6) : values.y;
                    inputs[2].value = formatNumber ? formatNumber(values.z, 6) : values.z;
                }
                break;
            }
        }
    }
}