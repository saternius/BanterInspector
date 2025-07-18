let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { TransformComponent } = await import(`${basePath}/components/transform.js`);


export class Slot{
    async init(slotData){
        this.id = `slot_${Math.floor(Math.random()*10000)}`;
        this.name = slotData.name || `Unnamed Slot`;
        this.parentId = slotData.parentId;
        this.components = slotData.components || [];
        this.children = slotData.children || [];
        this._bs = slotData._bs;

        this.active = true;
        this.persistent = true;


        if(!slotData._bs){
            let newGameObject = new BS.GameObject(this.name);
            this._bs = newGameObject;
            let parentGameObject = window.SM.slotData.slotMap[this.parentId]._bs;
            if(parentGameObject){
                await newGameObject.SetParent(parentGameObject, true);
            }
            
            await newGameObject.SetActive(true);
            
            if(!this.name){
                let newSlotName = this.id;
                this.name = newSlotName;
            }
            
            let transform = await new TransformComponent().init(this);
            this.components.push(transform);
        }
        window.SM.slotData.slotMap[this.id] = this;
        return this;
    }

    getTransform(){
        return this.components.find(component => component.type === "Transform");
    }

    async setParent(newParent){
        // Cannot parent to itself
        if (newParent === this) return;
        
        // Remove from current parent or root
        if (this.parentId) {
            const oldParent = window.SM.getSlotById(this.parentId);
            oldParent.children = oldParent.children.filter(child => child.id !== this.id);
        }
      
        newParent.children.push(this);
        this.parentId = newParent.id;
        this._bs.SetParent(newParent._bs);

    }

}