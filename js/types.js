
// Import required dependencies
let basePath = window.location.hostname === 'localhost' ? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js';
const { sceneManager } = await import(`${basePath}/scene-manager.js`);
const { deepClone } = await import(`${basePath}/utils.js`);

// options: { source: 'ui' | 'history' | 'script' | 'sync' }

export class SlotPropertyChange {
    constructor(slotId, property, newValue, options) {
        this.slotId = slotId;
        this.property = property;
        this.newValue = newValue;
        this.options = options;
        this.oldValue = options.oldValue || this.getOldValue();
    }

    getOldValue() {
        const slot = sceneManager.getSlotById(this.slotId);
        return slot[this.property];
    }

    async apply(){
        await this.change(this.newValue)
    }

    async undo(){
        await this.change(this.oldValue)
    }

    async change(value){
        const slot = sceneManager?.getSlotById(this.slotId);
        if(!slot){
            console.log(`ERROR: Slot not found ${this.slotId}`)
            return;
        }
        let gO = window.SM.scene.objects[this.slotId]
        if (!gO){
            console.log(`ERROR: Slot not found ${this.slotId}`)
            return;
        }

        
        slot[this.property] = value;
        if(this.property === "active"){
            await gO.SetActive(Boolean(value));
        }
        if(this.property === "name"){
            slot.name = value;
            inspectorApp.hierarchyPanel.render()
        }

        const spaceKey = '__' + slot.name + '/' + this.property + ':slot_' + this.slotId;
        await window.SM.setSpaceProperty(spaceKey, value, false);
    }

    getDescription() {
        return `Changed slot ${this.slotId} ${this.property} to ${this.newValue}`;
    }

    getUndoDescription() {
        return `Changed slot ${this.slotId} ${this.property} to ${this.oldValue}`;
    }
}

export class ComponentPropertyChange {
    constructor(componentId, property, newValue, options) {
        this.componentId = componentId;
        this.property = property;
        this.newValue = deepClone(newValue);
        this.options = options || {};
        this.oldValue = deepClone(options.oldValue || this.getOldValue());
        this.component = sceneManager.getSlotComponentById(componentId);
        Object.freeze(this)
    }

    getOldValue() {        
        return deepClone(this.component.properties?.[this.property]);
    }

    async apply() {
        await this.change(this.newValue);
    }

    async undo() {
        await this.change(this.oldValue);
    }

    async change(value) {
        if(!this.component) return;

        // Update local state
        if (this.component.properties) {
            this.component.properties[this.property] = value;
        }

        // Generate space key for persistence
        const spaceKey = `__${this.component._slot.name}/${this.component.type}/${this.property}:component_${this.componentId}`;
        if (window.SM) {
            await window.SM.setSpaceProperty(spaceKey, value, false);
        }

        // Apply to Unity component
        if (window.SM) {
            await window.SM.updateUnityComponent(this.componentId, this.property, value);
        }

        // Refresh UI if needed
        if (window.inspectorApp?.spacePropsPanel) {
            window.inspectorApp.spacePropsPanel.render();
        }
    }

    getDescription() {
        return `Changed ${this.component.type} ${this.property} to ${JSON.stringify(this.newValue)}`;
    }
    getUndoDescription() {
        return `Changed ${this.component.type} ${this.property} to ${JSON.stringify(this.oldValue)}`;
    }
}

export class SpacePropertyChange {
    constructor(property, newValue, protect, options) {
        this.property = property;
        this.newValue = newValue;
        this.protected = protect;
        this.options = options || {};
        this.oldValue = options.oldValue || this.getOldValue();
    }

    getOldValue() {
        const spaceState = sceneManager?.scene?.spaceState;
        if (!spaceState) return undefined;
        
        const props = this.protected ? spaceState.protected : spaceState.public;
        return props[this.property];
    }

    async apply() {
        await this.change(this.newValue);
    }

    async undo() {
        await this.change(this.oldValue);
    }

    async change(value) {
        if (window.SM) {
            await window.SM.setSpaceProperty(this.property, value, this.protected);
        }

        // Update space props panel
        if (window.inspectorApp?.spacePropsPanel) {
            window.inspectorApp.spacePropsPanel.render();
        }
    }

    getDescription() {
        const propType = this.protected ? 'protected' : 'public';
        return `Change ${propType} property ${this.property} to ${this.newValue}`;
    }

    getUndoDescription(){
        const propType = this.protected ? 'protected' : 'public';
        return `Change ${propType} property ${this.property} to ${this.oldValue}`;
    }
}

export class ComponentAddChange {
    constructor(slotId, componentType, componentConfig, options) {
        this.slotId = slotId;
        this.componentType = componentType;
        this.componentConfig = componentConfig || this.getDefaultConfig();
        this.componentId = null; // Will be set after creation
        this.options = options || {};
    }

    getDefaultConfig() {
        // Import default configs from component-menu
        const configs = {
            'MonoBehavior': {
                properties: {
                    name: 'myScript',
                    file: null,
                    vars: {}
                }
            },
            'BanterRigidbody': {
                properties: {
                    mass: 1,
                    drag: 0,
                    angularDrag: 0.05,
                    useGravity: true,
                    isKinematic: false
                }
            },
            'BoxCollider': {
                properties: {
                    isTrigger: false,
                    center: { x: 0, y: 0, z: 0 },
                    size: { x: 1, y: 1, z: 1 }
                }
            },
            'SphereCollider': {
                properties: {
                    isTrigger: false,
                    radius: 0.5
                }
            },
            'BanterMaterial': {
                properties: {
                    shader: 'Standard',
                    color: { r: 1, g: 1, b: 1, a: 1 },
                    texture: ''
                }
            },
            'BanterText': {
                properties: {
                    text: 'New Text',
                    fontSize: 14,
                    color: { r: 1, g: 1, b: 1, a: 1 },
                    alignment: 'Center'
                }
            },
            'BanterGeometry': {
                properties: {
                    geometryType: 'BoxGeometry',
                    width: 1,
                    height: 1,
                    depth: 1
                }
            }
        };
        
        return configs[this.componentType] || { properties: {} };
    }

    async apply() {
        const slot = sceneManager.getSlotById(this.slotId);
        if (!slot) {
            console.error(`Slot ${this.slotId} not found`);
            return;
        }

        // Check if component already exists (for unique components)
        const uniqueComponents = ['Transform', 'BanterRigidbody', 'BanterSyncedObject'];
        if (uniqueComponents.includes(this.componentType)) {
            const exists = slot.components.some(c => c.type === this.componentType);
            if (exists) {
                console.warn(`A ${this.componentType} component already exists on this slot`);
                return;
            }
        }

        // Create the component
        let slotComponent = null;
        
        if (this.componentType === 'MonoBehavior') {
            // Dynamic import to avoid circular dependency
            const { MonoBehavior } = await import(`${basePath}/monobehavior.js`);
            slotComponent = new MonoBehavior(slot, {
                id: Math.floor(Math.random() * 10000),
                type: 'MonoBehavior',
                properties: this.componentConfig.properties
            });
            
        } else {
            // Create Unity component
            const unityComponent = await this.createUnityComponent();
            if (unityComponent) {
                slotComponent = {
                    id: unityComponent.id,
                    type: this.componentType,
                    properties: this.componentConfig.properties,
                    _bs: unityComponent
                };
            }
        }

        if (slotComponent) {
            this.componentId = slotComponent.id;
            slot.components.push(slotComponent);
            sceneManager.sceneData.componentMap[slotComponent.id] = slotComponent;

            // Refresh properties panel
            if (window.inspectorApp?.propertiesPanel) {
                window.inspectorApp.propertiesPanel.render(this.slotId);
            }
        }
    }

    async undo() {
        if (!this.componentId) return;

        const slot = sceneManager.getSlotById(this.slotId);
        if (!slot) return;

        // Remove component
        const componentIndex = slot.components.findIndex(c => c.id === this.componentId);
        if (componentIndex !== -1) {
            const component = slot.components[componentIndex];
            
            // Clean up MonoBehavior
            if (this.componentType === 'MonoBehavior' && component.destroy) {
                component.destroy();
            }

            // Remove from slot
            slot.components.splice(componentIndex, 1);
            delete sceneManager.sceneData.componentMap[this.componentId];

            // Remove from Unity
            if (this.componentType !== 'MonoBehavior' && window.SM) {
                try {
                    // Note: BanterScript doesn't support component removal yet
                    console.warn('Unity component removal not yet supported by BanterScript');
                } catch (error) {
                    console.error('Failed to remove Unity component:', error);
                }
            }

            // Remove space properties
            await this.removeSpaceProperties(slot);

            // Refresh UI
            if (window.inspectorApp?.propertiesPanel) {
                window.inspectorApp.propertiesPanel.render(this.slotId);
            }
        }
    }

    async createUnityComponent() {
        const gameObject = sceneManager.scene?.objects?.[this.slotId];
        if (!gameObject || !window.BS) return null;

        let component = null;
        
        switch (this.componentType) {
            case 'BanterRigidbody':
                component = new BS.BanterRigidbody();
                break;
            case 'BoxCollider':
                component = new BS.BoxCollider(false, new BS.Vector3(0, 0, 0), new BS.Vector3(1, 1, 1));
                break;
            case 'SphereCollider':
                component = new BS.SphereCollider(false, 0.5);
                break;
            case 'BanterGeometry':
                component = new BS.BanterGeometry(BS.GeometryType.BoxGeometry, null, 1, 1, 1, 1, 1, 1);
                break;
            case 'BanterMaterial':
                component = new BS.BanterMaterial("Standard", null, new BS.Vector4(1, 1, 1, 1), BS.MaterialSide.Front, true);
                break;
            case 'BanterText':
                component = new BS.BanterText("New Text", new BS.Vector4(1, 1, 1, 1), BS.HorizontalAlignment.Center, BS.VerticalAlignment.Middle, 14, true, true, new BS.Vector2(100, 50));
                break;
            // Add more component types as needed
        }

        if (component && gameObject.AddComponent) {
            await gameObject.AddComponent(component);
        }
        
        return component;
    }

    async removeSpaceProperties(slot) {
        const spaceState = sceneManager.scene?.spaceState;
        if (!spaceState) return;

        const propsToRemove = [];
        ['public', 'protected'].forEach(type => {
            const props = spaceState[type];
            Object.keys(props).forEach(key => {
                if (key.includes(`:component_${this.componentId}`)) {
                    propsToRemove.push({ key, isProtected: type === 'protected' });
                }
            });
        });

        for (const { key, isProtected } of propsToRemove) {
            if (window.SM) {
                await window.SM.setSpaceProperty(key, null, isProtected);
            }
        }
    }

    getDescription() {
        return `Add ${this.componentType} component`;
    }

    getUndoDescription(){
        return `Remove ${this.componentType} component`;
    }
}

export class ComponentRemoveChange {
    constructor(componentId, options) {
        this.componentId = componentId;
        this.componentData = this.captureComponentData();
        this.slotId = null;
        this.componentIndex = null;
        this.options = options || {};
    }

    captureComponentData() {
        // Find the component and its slot
        const slots = sceneManager.getAllSlots();
        for (const slot of slots) {
            const componentIndex = slot.components?.findIndex(c => c.id === this.componentId);
            if (componentIndex !== -1) {
                this.slotId = slot.id;
                this.componentIndex = componentIndex;
                const component = slot.components[componentIndex];
                
                // Deep clone the component data
                return {
                    id: component.id,
                    type: component.type,
                    properties: JSON.parse(JSON.stringify(component.properties || {})),
                    // Store additional metadata if needed
                    _wasMonoBehavior: component.constructor?.name === 'MonoBehavior'
                };
            }
        }
        return null;
    }

    async apply() {
        if (!this.componentData || !this.slotId) {
            console.error('No component data to remove');
            return;
        }

        await sceneManager.deleteComponent(this.slotId, this.componentId, this.componentData.type);

        // Refresh properties panel
        if (window.inspectorApp?.propertiesPanel) {
            window.inspectorApp.propertiesPanel.render(this.slotId);
        }
    }

    async undo() {
        if (!this.componentData || !this.slotId) return;

        const slot = sceneManager.getSlotById(this.slotId);
        if (!slot) return;

        // Recreate the component
        if (this.componentData.type === 'MonoBehavior') {
            const { MonoBehavior } = await import(`${basePath}/monobehavior.js`);
            const component = new MonoBehavior(slot, {
                id: this.componentData.id,
                type: 'MonoBehavior',
                properties: this.componentData.properties
            });
            
            // Insert at original position if possible
            if (this.componentIndex !== null && this.componentIndex < slot.components.length) {
                slot.components.splice(this.componentIndex, 0, component);
            } else {
                slot.components.push(component);
            }
            
            sceneManager.sceneData.componentMap[component.id] = component;
            
        } else {
            // Recreate Unity component
            const addChange = new ComponentAddChange(this.slotId, this.componentData.type, { properties: this.componentData.properties });
            await addChange.apply();
            
            // Update the ID to match the original
            const newComponent = slot.components[slot.components.length - 1];
            if (newComponent && this.componentIndex !== null) {
                // Move to original position
                slot.components.pop();
                slot.components.splice(this.componentIndex, 0, newComponent);
            }
        }

        // Refresh UI
        if (window.inspectorApp?.propertiesPanel) {
            window.inspectorApp.propertiesPanel.render(this.slotId);
        }
    }

    getDescription() {
        return `Remove ${this.componentData?.type || 'unknown'} component`;
    }

    getUndoDescription(){
        return `Add ${this.componentData?.type || 'unknown'} component`;
    }
}

export class SlotAddChange {
    constructor(parentId, slotName, options) {
        this.parentId = parentId;
        this.slotName = slotName || `NewSlot_${Math.floor(Math.random() * 100000)}`;
        this.newSlotId = null; // Will be set after creation
        this.options = options || {};
    }

    async apply() {
        const newSlot = await sceneManager.addNewSlot(this.parentId);
        if (newSlot) {
            this.newSlotId = newSlot.id;
            
            // Set the name if different from default
            if (newSlot.name !== this.slotName) {
                newSlot.name = this.slotName;
                const spaceKey = `__${newSlot.name}/name:slot_${newSlot.id}`;
                if (window.SM) {
                    await window.SM.setSpaceProperty(spaceKey, this.slotName, false);
                }
            }

            // Expand parent
            if (this.parentId) {
                sceneManager.expandedNodes.add(this.parentId);
            }

            // Select new slot
            sceneManager.selectSlot(newSlot.id);

            // Update UI
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: newSlot.id }
            }));

            if (window.inspectorApp?.hierarchyPanel) {
                window.inspectorApp.hierarchyPanel.render();
            }
        }
    }

    async undo() {
        if (!this.newSlotId) return;

        await sceneManager.deleteSlot(this.newSlotId);

        // Clear selection if this slot was selected
        if (sceneManager.selectedSlot === this.newSlotId) {
            sceneManager.selectedSlot = null;
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: null }
            }));
        }

        // Update hierarchy
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    getDescription() {
        return `Added new slot${this.parentId ? ' as child' : ' at root'}`;
    }

    getUndoDescription(){
        return `Remove slot ${this.slotName}`;
    }
}

export class SlotRemoveChange {
    constructor(slotId, options) {
        this.slotId = slotId;
        this.slotData = this.captureSlotState();
        this.parentId = null;
        this.siblingIndex = null;
        this.options = options || {};
    }

    captureSlotState() {
        const slot = sceneManager.getSlotById(this.slotId);
        if (!slot) return null;

        this.parentId = slot.parentId;

        // Find sibling index
        if (this.parentId) {
            const parent = sceneManager.getSlotById(this.parentId);
            if (parent?.children) {
                this.siblingIndex = parent.children.findIndex(child => child.id === this.slotId);
            }
        } else {
            // Root level slot
            this.siblingIndex = sceneManager.sceneData.slots.findIndex(s => s.id === this.slotId);
        }

        return this.captureSlotStateRecursive(slot);
    }

    captureSlotStateRecursive(slot) {
        return {
            id: slot.id,
            name: slot.name,
            active: slot.active,
            persistent: slot.persistent,
            parentId: slot.parentId,
            components: slot.components?.map(c => ({
                id: c.id,
                type: c.type,
                properties: JSON.parse(JSON.stringify(c.properties || {})),
                _wasMonoBehavior: c.constructor?.name === 'MonoBehavior'
            })) || [],
            children: slot.children?.map(child => this.captureSlotStateRecursive(child)) || []
        };
    }

    async apply() {
        if (!this.slotData) return;

        await sceneManager.deleteSlot(this.slotId);

        // Clear selection if needed
        if (sceneManager.selectedSlot === this.slotId) {
            sceneManager.selectedSlot = null;
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: null }
            }));
        }

        // Update hierarchy
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    async undo() {
        if (!this.slotData) return;

        // Recreate the slot hierarchy
        await this.recreateSlotHierarchy(this.slotData, this.parentId, this.siblingIndex);

        // Rebuild hierarchy map
        sceneManager.buildHierarchyMap();

        // Update UI
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    async recreateSlotHierarchy(slotData, parentId, siblingIndex) {
        // Create the slot
        const newSlot = await sceneManager.addNewSlot(parentId);
        if (!newSlot) return null;

        // Restore slot properties
        newSlot.name = slotData.name;
        newSlot.active = slotData.active;
        newSlot.persistent = slotData.persistent;

        // Restore components
        for (const compData of slotData.components) {
            if (compData.type === 'MonoBehavior') {
                const { MonoBehavior } = await import(`${basePath}/monobehavior.js`);
                const component = new MonoBehavior(newSlot, {
                    id: compData.id,
                    type: 'MonoBehavior',
                    properties: compData.properties
                });
                newSlot.components.push(component);
                sceneManager.sceneData.componentMap[component.id] = component;
            } else {
                // For Unity components, we need to recreate them
                const addChange = new ComponentAddChange(newSlot.id, compData.type, { properties: compData.properties });
                await addChange.apply();
            }
        }

        // Recreate children recursively
        for (const childData of slotData.children) {
            await this.recreateSlotHierarchy(childData, newSlot.id);
        }

        // Move to correct position if needed
        if (siblingIndex !== null && siblingIndex >= 0) {
            if (parentId) {
                const parent = sceneManager.getSlotById(parentId);
                if (parent?.children) {
                    const currentIndex = parent.children.findIndex(child => child.id === newSlot.id);
                    if (currentIndex !== -1 && currentIndex !== siblingIndex) {
                        parent.children.splice(currentIndex, 1);
                        parent.children.splice(siblingIndex, 0, newSlot);
                    }
                }
            } else {
                // Root level reordering
                const currentIndex = sceneManager.sceneData.slots.findIndex(s => s.id === newSlot.id);
                if (currentIndex !== -1 && currentIndex !== siblingIndex) {
                    sceneManager.sceneData.slots.splice(currentIndex, 1);
                    sceneManager.sceneData.slots.splice(siblingIndex, 0, newSlot);
                }
            }
        }

        return newSlot;
    }

    getDescription() {
        return `Remove slot ${this.slotData?.name || ''}`;
    }

    getUndoDescription(){
        return `Add slot ${this.slotData?.name || ''}`;
    }
}

export class SlotMoveChange {
    constructor(slotId, newParentId, options) {
        this.slotId = slotId;
        this.newParentId = newParentId;
        const slot = sceneManager.getSlotById(slotId);
        this.oldParentId = slot?.parentId || null;
        this.oldSiblingIndex = this.getSiblingIndex(slotId, this.oldParentId);
        this.options = options || {};
    }

    getSiblingIndex(slotId, parentId) {
        if (parentId) {
            const parent = sceneManager.getSlotById(parentId);
            return parent?.children?.findIndex(child => child.id === slotId) ?? -1;
        } else {
            return sceneManager.sceneData.slots.findIndex(s => s.id === slotId);
        }
    }

    async apply() {
        if (this.newParentId === null) {
            await sceneManager.moveSlotToRoot(this.slotId);
        } else {
            await sceneManager.reparentSlot(this.slotId, this.newParentId);
            sceneManager.expandedNodes.add(this.newParentId);
        }

        // Update hierarchy
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    async undo() {
        if (this.oldParentId === null) {
            await sceneManager.moveSlotToRoot(this.slotId);
        } else {
            await sceneManager.reparentSlot(this.slotId, this.oldParentId);
        }

        // Restore sibling position if possible
        const slot = sceneManager.getSlotById(this.slotId);
        if (slot && this.oldSiblingIndex >= 0) {
            if (this.oldParentId) {
                const parent = sceneManager.getSlotById(this.oldParentId);
                if (parent?.children) {
                    const currentIndex = parent.children.findIndex(child => child.id === this.slotId);
                    if (currentIndex !== -1 && currentIndex !== this.oldSiblingIndex) {
                        parent.children.splice(currentIndex, 1);
                        parent.children.splice(this.oldSiblingIndex, 0, slot);
                    }
                }
            } else {
                const currentIndex = sceneManager.sceneData.slots.findIndex(s => s.id === this.slotId);
                if (currentIndex !== -1 && currentIndex !== this.oldSiblingIndex) {
                    sceneManager.sceneData.slots.splice(currentIndex, 1);
                    sceneManager.sceneData.slots.splice(this.oldSiblingIndex, 0, slot);
                }
            }
        }

        // Update hierarchy
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    getDescription() {
        return `Move slot`;
    }

    getUndoDescription(){
        return `Move slot`;
    }
}