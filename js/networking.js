let localhost = window.location.hostname === 'localhost'
let basePath = localhost ? '.' : `${window.repoUrl}/js`;
export class Networking {
    constructor(){
    }

    handleSpaceStateChange(event) {
        const { changes } = event.detail;
        changes.forEach(async (change) => {
            let { property, newValue, isProtected } = change;
            newValue = JSON.parse(newValue);
            if (isProtected) {
                SM.scene.spaceState.protected[property] = newValue;
            } else {
                SM.scene.spaceState.public[property] = newValue;
            }
        });
    }


    async handleOneShot(event){
        let renderProps = ()=>{
            if(navigation.currentPage !== "world-inspector") return;
            inspector.propertiesPanel.render(SM.selectedSlot)
        }


        //console.log("handleOneShot =>", event)
        let message = event.detail.data;
        let firstColon = message.indexOf(":");
        let timestamp = parseInt(message.slice(0, firstColon));
        let data = message.slice(firstColon+1);

        function safeParse(value) {
            // Only operate on strings
            if (typeof value !== 'string') return value;
          
            const str = value.trim();
          
            // 1) Booleans and null
            if (/^(?:true|false|null)$/i.test(str)) {
              if (str.toLowerCase() === 'null')   return null;
              return str.toLowerCase() === 'true';
            }
          
            // 2) Numbers (integer, float, scientific)
            if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(str)) {
              // +0/-0 edge cases mirror Number()
              return Number(str);
            }
          
            // 3) JSON objects or arrays
            if ((str.startsWith('{') && str.endsWith('}')) ||
                (str.startsWith('[') && str.endsWith(']'))) {
              try {
                return JSON.parse(str);
              } catch {
                // fall through to return original string
              }
            }
          
            // 4) Fallback
            return value;
        }


        if(data.startsWith("update_slot")){ //`update_slot:${this.id}:${property}:${value}`;
            let str = data.slice(12)
            let nxtColon = str.indexOf(":")
            let slotId = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let prop = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let value = str.slice(nxtColon+1)
            let slot = SM.getSlotById(slotId);
            if(slot){
                await slot._set(prop, safeParse(value));
                inspector.hierarchyPanel.render()
                if(SM.selectedSlot === slot.id){
                    renderProps()
                }
            }
            SM.props[`__${slotId}/${prop}:slot`] = value
        }


        if(data.startsWith("update_component")){ // `update_component:${this.id}:${property}:${value}`;
            let str = data.slice(17)
            let nxtColon = str.indexOf(":")
            let componentId = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let prop = str.slice(0, nxtColon)
            let value = str.slice(nxtColon+1)
            let component = SM.getSlotComponentById(componentId);
            if(component){
                await component._setWithTimestamp(prop, safeParse(value), timestamp);
                if(SM.selectedSlot === component._slot.id){
                    renderProps()
                }
            }
            SM.props[`__${componentId}/${prop}:component`] = value
        }

        //update_monobehavior, update_component, update_slot
        if(data.startsWith("update_monobehavior")){
            let str = data.slice(20)
            let nxtColon = str.indexOf(":")
            let componentId = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let op = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let prop = str.slice(0, nxtColon)
            let value = str.slice(nxtColon+1)
            let monobehavior = SM.getSlotComponentById(componentId);
            if(op === "vars"){
                monobehavior.ctx.vars[prop] = safeParse(value);
                if(SM.selectedSlot === monobehavior._slot.id){
                    renderProps()
                }
            }else if(op === "_running"){
                if(monobehavior){
                    monobehavior.ctx._running = safeParse(value);
                    inspector.lifecyclePanel.render()
                }
            }

            SM.props[`__${componentId}/${prop}:component`] = value
        }

        if(data === "reset"){
            window.location.reload();
        }
       
        if(data.startsWith("load_slot")){
            let [parentId, slot_data] = data.slice(10).split("|");
            await SM._loadSlot(JSON.parse(slot_data), parentId);
            await SM.updateHierarchy(this.selectedSlot);
        }

        if(data.startsWith("component_added")){
            let event = JSON.parse(data.slice(16));
            let slot = SM.getSlotById(event.slotId);
            if(slot){
                await SM._addComponent(slot, event.componentType, event.componentProperties);
                await SM.updateHierarchy(this.selectedSlot);
            }
        }

        if(data.startsWith("component_removed")){
            let componentId = data.slice(18);
            let component = SM.getSlotComponentById(componentId);
            if(component){
                await component._destroy();
                await SM.updateHierarchy(this.selectedSlot);
            }
        }

        if(data.startsWith("slot_added")){
            let [parentId, slotName] = data.slice(11).split(":");
            await SM._addNewSlot(slotName, parentId);
            await SM.updateHierarchy(SM.selectedSlot);
        }

        if(data.startsWith("slot_removed")){
            let slotId = data.slice(13);
            let slot = SM.getSlotById(slotId);
            if(slot){
                await slot._destroy();
                await SM.updateHierarchy(this.selectedSlot);
            }
        }

        if(data.startsWith("slot_moved")){
            let [slotId, newParentId, newSiblingIndex] = data.slice(11).split(":");
            //newSiblingIndex = (newSiblingIndex)? parseInt(newSiblingIndex) : null;
            const slot = SM.getSlotById(slotId);
            if (!slot) return;
            if(!newParentId) newParentId = SM.slotData.slots[0].id;
            await slot._setParent(SM.getSlotById(newParentId));
            await SM.updateHierarchy(SM.selectedSlot);
        }

        if(data.startsWith("monobehavior_start")){
            let componentId = data.slice(19);
            let monobehavior = SM.getSlotComponentById(componentId);
            if(monobehavior){
                monobehavior._start();
            }
        }

        if(data.startsWith("monobehavior_stop")){
            let componentId = data.slice(18);
            let monobehavior = SM.getSlotComponentById(componentId);
            if(monobehavior){
                monobehavior._stop();
            }
        }

        if(data.startsWith("monobehavior_refresh")){
            let componentId = data.slice(21);
            let monobehavior = SM.getSlotComponentById(componentId);
            if(monobehavior){
                monobehavior._refresh();
            }
        }

        if(SM.saveMethod === "aggressive"){
            SM.saveScene();
        }
    }


    async setSpaceProperty(key, value, isProtected) {
        if (!SM.scene) return;
        value = JSON.stringify(value);

        if (isProtected) {
            SM.scene.SetProtectedSpaceProps({ [key]: value });
            SM.scene.spaceState.protected[key] = value;
        } else {
            SM.scene.SetPublicSpaceProps({ [key]: value });
            SM.scene.spaceState.public[key] = value;
        }
        
        if(localhost){
            this.handleSpaceStateChange({detail: {changes: [{property: key, newValue: value, isProtected: isProtected}]}})
            //localStorage.setItem('lastSpaceState', JSON.stringify(this.scene.spaceState));
        }
    }

    async deleteSpaceProperty(key, isProtected){
        if(isProtected){
            SM.scene.SetProtectedSpaceProps({ [key]: null });
            delete SM.scene.spaceState.protected[key];
        }else{
            SM.scene.SetPublicSpaceProps({ [key]: null });
            delete SM.scene.spaceState.public[key];
        }
        // if(localhost){
        //     localStorage.setItem('lastSpaceState', JSON.stringify(this.scene.spaceState));
        // }
    }


    async sendOneShot(data){
        //console.log("sending one shot =>", data)
        data = `${Date.now()}:${data}`
        SM.scene.OneShot(data);
        if(localhost){
            this.handleOneShot({detail: {data: data}})
        }
    }

}

export const networking = new Networking();
window.networking = networking