log("Spawner", "RADD")
this.default = {}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})

let master = this._component.amOwner();
let inside = false;
let user = SM.myName()
let toggleIn = (e)=>{
    if(inside) return;
    inside = true;
    console.log("IN", e)
    networking.setSpaceProperty(`BigButton_${user}`,true,false,false)
    this.material.Set("color", {'r':1,'g':0,'b':0})
}

let toggleOut = (e)=>{
    if(!inside) return;
    inside = false;
    console.log("OUT", e)   
    networking.deleteSpaceProperty(`BigButton_${user}`)
    let survey = Object.keys(networking.spaceState).filter(s=>(s.startsWith("BigButton_") && (networking.spaceState[s] === true || networking.spaceState[s] === 'true')))
    let somebody = survey.length > 0
    console.log("OUT", survey, somebody)
    if(somebody) return;
    this.material.Set("color", {'r':1,'g':1,'b':1})
}


this.onStart = ()=>{
    this._entity._bs.On("trigger-enter", toggleIn)
    this._entity._bs.On("trigger-exit", toggleOut)
    this.material = this._entity.getComponent("Material")
}

this.onUpdate = ()=>{
    if(master && this.material.properties.color.b === 0){
        //log("spawner", "thinkin")
    }
}

this.onDestroy = ()=>{
    this._entity._bs.listeners.clear()
}
