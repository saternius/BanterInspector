let grabbing = false;
const pressListener = (e)=>{
    if(!grabbing) return;
    if(e.detail.button === BS.ButtonType.PRIMARY && e.detail.side === BS.HandSide.RIGHT){
        const event = new CustomEvent('button-clicked', { detail: {flag: "A"} });
        window.dispatchEvent(event);
    }
    if(e.detail.button === BS.ButtonType.SECONDARY && e.detail.side === BS.HandSide.RIGHT){
        const event = new CustomEvent('button-clicked', { detail: {flag: "B"} });
        window.dispatchEvent(event);
    }
}

const releaseListener = (e)=>{
    if(!grabbing) return;
    if(e.detail.button === BS.ButtonType.PRIMARY && e.detail.side === BS.HandSide.RIGHT){
        const event = new CustomEvent('button-released', { detail: {flag: "A"} });
        window.dispatchEvent(event);
    }
    if(e.detail.button === BS.ButtonType.SECONDARY && e.detail.side === BS.HandSide.RIGHT){
        const event = new CustomEvent('button-released', { detail: {flag: "B"} });
        window.dispatchEvent(event);
    }
}

this.onStart = ()=>{
    this._entity._bs.On("grab", (e)=>{
        log("grippy", "grabbed")
        grabbing = true;
    })

    this._entity._bs.On("drop", (e)=>{
        log("grippy", "dropped")
        grabbing = false;
    })

    scene.On("button-pressed", pressListener)
    scene.On("button-released", releaseListener)
}

this.onDestroy = ()=>{
    scene.listeners.get('button-pressed').delete(pressListener)
    scene.listeners.get('button-released').delete(releaseListener)
}

