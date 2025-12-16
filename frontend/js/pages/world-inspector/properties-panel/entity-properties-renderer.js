/**
 * Entity Properties Renderer
 * Renders the entity properties section with transforms, name, layer, etc.
 */

import { BanterLayers } from '../../../entity-components/index.js';

export class EntityPropertiesRenderer {
    constructor(propertyInputRenderer, transformHandler, scaleLockHandler, utils, changeManager) {
        this.propertyInputRenderer = propertyInputRenderer;
        this.transformHandler = transformHandler;
        this.scaleLockHandler = scaleLockHandler;
        this.utils = utils || {};
        this.changeManager = changeManager;
    }

    /**
     * Create entity properties section
     * @param {Object} entity - The entity to render properties for
     * @param {boolean} showLoadSettings - Whether to show async toggle
     * @returns {Promise<HTMLElement>} - The entity section element
     */
    async createEntityPropertiesSection(entity, showLoadSettings = false) {
        if (!entity) return null;

        const section = document.createElement('div');
        section.className = 'entity-section';
        section.dataset.panel = 'propertyPanelComponent';

        // Create header
        const header = this.createEntityHeader(entity);
        section.appendChild(header);

        // Create body
        const body = await this.createEntityBody(entity, showLoadSettings);
        section.appendChild(body);

        return section;
    }

    /**
     * Create entity header with transform mode toggle
     */
    createEntityHeader(entity) {
        const header = document.createElement('div');
        header.className = 'component-header perm';

        const headerContent = document.createElement('div');
        headerContent.style.display = 'flex';
        headerContent.style.justifyContent = 'space-between';
        headerContent.style.alignItems = 'center';
        headerContent.style.width = '100%';

        // Title
        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `
            <span class="component-name">Entity</span>
            <span class="component-type">${entity.id}</span>
        `;

        // Transform mode toggle button
        const transformToggleBtn = this.transformHandler.createModeToggleButton(() => {
            // Trigger re-render on toggle
            if (typeof SM !== 'undefined' && SM.selectedEntity) {
                window.dispatchEvent(new CustomEvent('transform-mode-changed'));
            }
        });

        headerContent.appendChild(titleDiv);
        headerContent.appendChild(transformToggleBtn);
        header.appendChild(headerContent);

        return header;
    }

    /**
     * Create entity body with all properties
     */
    async createEntityBody(entity, showLoadSettings) {
        const body = document.createElement('div');
        body.className = 'component-body';

        // Add async toggle if enabled
        if (showLoadSettings) {
            const asyncRow = this.createAsyncToggleRow(entity);
            body.appendChild(asyncRow);
        }

        // Name property
        const nameRow = this.createNameRow(entity);
        body.appendChild(nameRow);

        // Layer property
        const layerRow = await this.createLayerRow(entity);
        body.appendChild(layerRow);

        // Active property
        const activeRow = this.createActiveRow(entity);
        body.appendChild(activeRow);

        // Transform properties
        const transformRows = this.createTransformRows(entity);
        transformRows.forEach(row => body.appendChild(row));

        return body;
    }

    /**
     * Create name property row with inline editing
     */
    createNameRow(entity) {
        const { EntityPropertyChange } = this.changeManager.changeTypes || {};

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
            if (newName && newName !== entity.name && EntityPropertyChange) {
                const change = new EntityPropertyChange(entity.id, 'name', newName, { source: 'ui' });
                this.changeManager.applyChange(change);

                // Update selection after rename
                setTimeout(() => {
                    if (typeof SM !== 'undefined') {
                        SM.selectEntity(entity.parentId + "/" + newName);
                    }
                }, 70);
            }
        };

        inputName.addEventListener('change', handleRename);
        inputName.addEventListener('blur', handleRename);

        nameRow.appendChild(inputName);
        return nameRow;
    }

    /**
     * Create layer property dropdown
     */
    async createLayerRow(entity) {
        const { EntityPropertyChange } = this.changeManager.changeTypes || {};

        return this.propertyInputRenderer.createPropertyRow(
            'layer',
            entity.layer,
            'dropdown',
            (value) => {
                if (EntityPropertyChange) {
                    const change = new EntityPropertyChange(entity.id, 'layer', value, { source: 'ui' });
                    this.changeManager.applyChange(change);
                }
            },
            BanterLayers
        );
    }

    /**
     * Create active property checkbox
     */
    createActiveRow(entity) {
        const { EntityPropertyChange } = this.changeManager.changeTypes || {};

        return this.propertyInputRenderer.createPropertyRow(
            'active',
            entity.active,
            'checkbox',
            (value) => {
                if (EntityPropertyChange) {
                    const change = new EntityPropertyChange(entity.id, 'active', value, { source: 'ui' });
                    this.changeManager.applyChange(change);
                }
            }
        );
    }

    /**
     * Create transform property rows (position, rotation, scale)
     */
    createTransformRows(entity) {
        const { EntityPropertyChange } = this.changeManager.changeTypes || {};
        const { deepClone, quaternionToEuler, eulerToQuaternion } = this.utils;

        const rows = [];

        // Get transform values and labels based on mode
        const transforms = this.transformHandler.getTransformValues(entity);
        const labels = this.transformHandler.getTransformLabels();

        // Position row
        const positionRow = this.propertyInputRenderer.createPropertyRow(
            labels.positionLabel,
            transforms.position,
            'vector3',
            (axis, value) => {
                if (axis === 'reset') {
                    // Reset position
                    const change = new EntityPropertyChange(
                        entity.id,
                        'localPosition',
                        { x: 0, y: 0, z: 0 },
                        { source: 'ui' }
                    );
                    this.changeManager.applyChange(change);
                } else {
                    // Update specific axis
                    let newValue = deepClone ? deepClone(transforms.position) : { ...transforms.position };
                    newValue[axis] = parseFloat(value);
                    const change = new EntityPropertyChange(
                        entity.id,
                        'localPosition',
                        newValue,
                        { source: 'ui', oldValue: transforms.position }
                    );
                    this.changeManager.applyChange(change);
                }
            },
            null,
            entity.id,
            entity
        );
        rows.push(positionRow);

        // Rotation row
        const rotationRow = this.propertyInputRenderer.createPropertyRow(
            labels.rotationLabel,
            transforms.rotation,
            'vector4',
            (axis, value) => {
                if (axis === 'reset') {
                    // Reset rotation
                    const change = new EntityPropertyChange(
                        entity.id,
                        'localRotation',
                        { x: 0, y: 0, z: 0, w: 1 },
                        { source: 'ui' }
                    );
                    this.changeManager.applyChange(change);
                } else {
                    // Update specific axis (convert from Euler to Quaternion)
                    let currentEntity = typeof SM !== 'undefined' ? SM.getSelectedEntity() : entity;
                    const currentQuaternion = this.transformHandler.getMode() === 'global'
                        ? currentEntity.transform.rotation
                        : currentEntity.transform.localRotation;

                    const eulerAngles = quaternionToEuler ? quaternionToEuler(currentQuaternion) : { x: 0, y: 0, z: 0 };
                    const numValue = parseFloat(value);

                    if (!isNaN(numValue)) {
                        const oldValue = deepClone ?
                            deepClone(this.transformHandler.getMode() === 'global' ?
                                currentEntity.transform.rotation :
                                currentEntity.transformVal("localRotation")) :
                            { ...currentQuaternion };

                        eulerAngles[axis] = numValue;
                        const newQuaternion = eulerToQuaternion ? eulerToQuaternion(eulerAngles) : currentQuaternion;

                        const change = new EntityPropertyChange(
                            entity.id,
                            'localRotation',
                            newQuaternion,
                            { source: 'ui', oldValue: oldValue }
                        );
                        this.changeManager.applyChange(change);
                    }
                }
            },
            null,
            entity.id,
            entity
        );
        rows.push(rotationRow);

        // Scale row
        const scaleRow = this.propertyInputRenderer.createPropertyRow(
            labels.scaleLabel,
            transforms.scale,
            'vector3',
            (axis, value) => {
                const scaleLockKey = `${entity.id}_localScale`;

                if (axis === 'proportional') {
                    // Proportional scaling - value is the complete new vector
                    const change = new EntityPropertyChange(
                        entity.id,
                        'localScale',
                        value,
                        { source: 'ui', oldValue: transforms.scale }
                    );
                    this.changeManager.applyChange(change);

                    // Update the inputs after proportional change
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('update-transform-display'));
                    }, 50);
                } else {
                    // Single axis change
                    if (this.scaleLockHandler && this.scaleLockHandler.isLocked(scaleLockKey)) {
                        // Handle proportional scaling
                        const newVector = this.scaleLockHandler.handleProportionalScale(
                            scaleLockKey,
                            transforms.scale,
                            axis,
                            value
                        );

                        const change = new EntityPropertyChange(
                            entity.id,
                            'localScale',
                            newVector,
                            { source: 'ui', oldValue: transforms.scale }
                        );
                        this.changeManager.applyChange(change);

                        // Update display
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('update-transform-display'));
                        }, 50);
                    } else {
                        // Normal single axis change
                        let newValue = deepClone ? deepClone(transforms.scale) : { ...transforms.scale };
                        newValue[axis] = parseFloat(value);

                        const change = new EntityPropertyChange(
                            entity.id,
                            'localScale',
                            newValue,
                            { source: 'ui', oldValue: transforms.scale }
                        );
                        this.changeManager.applyChange(change);
                    }
                }
            },
            null,
            entity.id,
            entity
        );
        rows.push(scaleRow);

        return rows;
    }

    /**
     * Create async toggle row for entity
     */
    createAsyncToggleRow(entity) {
        const row = document.createElement('div');
        row.className = 'async-toggle-row';

        const label = document.createElement('span');
        label.className = 'property-label';
        label.textContent = 'Async';
        label.style.fontWeight = 'bold';
        label.style.flex = "none";

        const valueContainer = document.createElement('div');
        valueContainer.className = 'property-value';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'checkbox-input';
        input.style.flex = "none";

        // Check entity.loadAsync
        input.checked = entity.loadAsync || false;

        input.onchange = () => {
            console.log("loadAsync changed", input.checked);
            entity.loadAsync = input.checked;
        };

        valueContainer.appendChild(input);

        row.appendChild(document.createElement('span')); // Empty space for button
        row.appendChild(label);
        row.appendChild(valueContainer);

        return row;
    }
}