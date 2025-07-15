
//options: { source: ux | history | script }


export class SlotPropertyChange {
    constructor(slotId, property, newValue, options) {
        this.slotId = slotId;
        this.property = property;
        this.newValue = newValue;
        this.oldValue = this.getOldValue();
        this.options = options;
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
        if(this.property == "active"){
            await gO.SetActive(Boolean(value));
        }

        const spaceKey = '__' + slot.name + '/' + this.property + ':slot_' + this.slotId;
        await window.SM.setSpaceProperty(spaceKey, value, false);
    }
}

export class ComponentPropertyChange {
    constructor(componentId, property, newValue, options) {
        this.componentId = componentId;
        this.property = property;
        this.newValue = newValue;
        this.oldValue = this.getOldValue();
        this.options = options;
    }

    getOldValue() {
        const component = sceneManager.getSlotComponentById(this.componentId);
        return component[this.property];
    }
}

export class SpacePropertyChange {
    constructor(property, newValue, protect, options) {
        this.property = property;
        this.newValue = newValue;
        this.protected = protect;
        this.oldValue = protect ? sceneManager.scene.spaceState.protected[property] : sceneManager.scene.spaceState.public[property];
        this.options = options;
    }
}

export class ComponentAddChange {
    constructor(slotId, componentType, options) {
        this.slotId = slotId;
        this.componentType = componentType;
        this.options = options;
    }
}

export class ComponentRemoveChange {
    constructor(componentId, options) {
        this.componentId = componentId;
        this.options = options;
    }
}

export class SlotAddChange {
    constructor(slotId, options) {
        this.slotId = slotId;
        this.options = options;
    }
}

export class SlotRemoveChange {
    constructor(slotId, options) {
        this.slotId = slotId;
        this.options = options;
    }
}

export class SlotMoveChange {
    constructor(slotId, newParentId, options) {
        this.slotId = slotId;
        this.newParentId = newParentId;
        this.oldParent = sceneManager.getSlotById(slotId).parentId;
        this.options = options;
    }
}