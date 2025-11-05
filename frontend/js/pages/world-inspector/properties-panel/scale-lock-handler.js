/**
 * Scale Lock Handler
 * Manages proportional scaling lock states and calculations for scale properties
 */

export class ScaleLockHandler {
    constructor() {
        // Store collapsed state of components
        this.scaleLockStates = new Map(); // Key: componentId_propertyKey, Value: boolean
        this.scaleRatios = new Map(); // Key: componentId_propertyKey, Value: {x: number, y: number, z: number}
    }

    /**
     * Check if a scale property is locked
     * @param {string} scaleLockKey - The key for the scale property (entityId_propertyName)
     * @returns {boolean} - Whether proportional scaling is locked
     */
    isLocked(scaleLockKey) {
        return this.scaleLockStates.get(scaleLockKey) || false;
    }

    /**
     * Get the scale ratios for a locked scale property
     * @param {string} scaleLockKey - The key for the scale property
     * @returns {Object|null} - The scale ratios or null if not set
     */
    getRatios(scaleLockKey) {
        return this.scaleRatios.get(scaleLockKey) || null;
    }

    /**
     * Set the scale ratios for a property
     * @param {string} scaleLockKey - The key for the scale property
     * @param {Object} ratios - The scale ratios {x, y, z}
     */
    setRatios(scaleLockKey, ratios) {
        this.scaleRatios.set(scaleLockKey, ratios);
    }

    /**
     * Toggle the lock state for a scale property
     * @param {string} scaleLockKey - The key for the scale property
     * @param {Object} currentValue - The current scale value {x, y, z}
     * @returns {boolean} - The new lock state
     */
    toggleLock(scaleLockKey, currentValue) {
        const isLocked = !this.scaleLockStates.get(scaleLockKey);
        this.scaleLockStates.set(scaleLockKey, isLocked);

        if (isLocked) {
            // Store current ratios when locking
            const baseValue = currentValue.x || 1;
            this.setRatios(scaleLockKey, {
                x: (currentValue.x || 0) / baseValue,
                y: (currentValue.y || 0) / baseValue,
                z: (currentValue.z || 0) / baseValue
            });
        }

        return isLocked;
    }

    /**
     * Create a scale lock button element
     * @param {string} scaleLockKey - The key for the scale property
     * @param {Object} value - The current scale value
     * @returns {HTMLElement} - The lock button element
     */
    createLockButton(scaleLockKey, value) {
        const lockButton = document.createElement('button');
        lockButton.className = 'scale-lock-btn';
        lockButton.style.marginLeft = '8px';
        lockButton.style.padding = '4px 4px';
        lockButton.style.background = this.isLocked(scaleLockKey) ? '#4a90e2' : '#2a2a2a';
        lockButton.style.border = '1px solid #3a3a3a';
        lockButton.style.borderRadius = '4px';
        lockButton.style.color = this.isLocked(scaleLockKey) ? '#fff' : '#999';
        lockButton.style.cursor = 'pointer';
        lockButton.style.fontSize = '12px';
        lockButton.innerHTML = this.isLocked(scaleLockKey) ? '🔒' : '🔓';
        lockButton.title = this.isLocked(scaleLockKey) ? 'Proportional scaling locked' : 'Click to lock proportional scaling';

        lockButton.onmousedown = (e) => {
            e.stopPropagation();
            const isLocked = this.toggleLock(scaleLockKey, value);

            // Update button appearance
            lockButton.style.background = isLocked ? '#4a90e2' : '#2a2a2a';
            lockButton.style.color = isLocked ? '#fff' : '#999';
            lockButton.innerHTML = isLocked ? '🔒' : '🔓';
            lockButton.title = isLocked ? 'Proportional scaling locked' : 'Click to lock proportional scaling';
        };

        return lockButton;
    }

    /**
     * Handle proportional scale changes when locked
     * @param {string} scaleLockKey - The key for the scale property
     * @param {Object} currentValue - The current scale value
     * @param {string} axis - The axis being changed ('x', 'y', or 'z')
     * @param {number} newValue - The new value for the axis
     * @returns {Object} - The new proportional scale values for all axes
     */
    handleProportionalScale(scaleLockKey, currentValue, axis, newValue) {
        if (!this.isLocked(scaleLockKey)) {
            // If not locked, return single axis change
            const result = { ...currentValue };
            result[axis] = newValue;
            return result;
        }

        const numValue = parseFloat(newValue);
        if (isNaN(numValue)) {
            return currentValue;
        }

        let ratios = this.getRatios(scaleLockKey);

        // If no ratios stored, calculate them from current values
        if (!ratios) {
            const baseValue = currentValue[axis] || 1;
            ratios = {
                x: (currentValue.x || 0) / baseValue,
                y: (currentValue.y || 0) / baseValue,
                z: (currentValue.z || 0) / baseValue
            };
            this.setRatios(scaleLockKey, ratios);
        }

        // Calculate the scale factor based on the changed axis
        const oldValue = currentValue[axis] || 1;
        const scaleFactor = numValue / oldValue;

        // Apply proportional scaling to all axes
        return {
            x: currentValue.x * scaleFactor,
            y: currentValue.y * scaleFactor,
            z: currentValue.z * scaleFactor
        };
    }

    /**
     * Clear all lock states
     */
    clearAll() {
        this.scaleLockStates.clear();
        this.scaleRatios.clear();
    }

    /**
     * Clear lock state for a specific entity
     * @param {string} entityId - The entity ID to clear locks for
     */
    clearForEntity(entityId) {
        // Remove all entries that start with the entityId
        const keysToRemove = [];
        for (const key of this.scaleLockStates.keys()) {
            if (key.startsWith(entityId + '_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => {
            this.scaleLockStates.delete(key);
            this.scaleRatios.delete(key);
        });
    }
}