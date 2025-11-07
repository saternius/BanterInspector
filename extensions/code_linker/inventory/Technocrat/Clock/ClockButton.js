this.default = {
    clickEventName: {
        "type": "string",
        "value": "clock-button-clicked"
    },
    tag: {
        "type": "string",
        "value": "playpause"
    }
}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]){
        this.vars[key] = val
    }
})    

this.onStart = ()=>{
    this._entity._bs.On("click", e => {
        log("clock button", "click")
        const event = new CustomEvent(this.vars.clickEventName.value, {
            detail: {
                entity: this._entity,
                ctx: this,
                details: e.detail,
                flag: this.vars.tag.value
            },
            
        });
        window.dispatchEvent(event);
    })
}

this.onDestroy = ()=>{
    this._entity._bs.listeners.get("click").clear();
}