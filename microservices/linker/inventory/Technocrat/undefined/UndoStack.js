//hey3
this.default = {}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})

let PaneEntity = null;
let held = false;
let lastParent = "Scene";
let panel = null;
this.onStart = async ()=>{
    let curTime = new Date().toUTCString();
    log("UNDO UI", `making UI [${curTime}]`)
    let transform = this._entity.getTransform();
    let startingPosition = {x: -1.67, y: 1.345, z: -2.47};
    transform.Set("localPosition", {x: 0, y: 0, z: 0});
    PaneEntity = await AddEntity(this._entity.id, "UI")
 
    
    panel = new BS.BanterUIPanel(BS.UIPanelPool.acquirePanel(), new BS.Vector2(512,512), false);
    await PaneEntity._bs.AddComponent(panel);
    const label = new BS.UILabel(panel);
    label.Text = `New Pane [${curTime}]`;
    label.addEventListener("click", e=>console.log(e))
    panel.SetBackgroundColor(new BS.Vector4(0,0,0,1))

    transform.Set("localPosition", startingPosition);


    
    
    //transform.Set("localRotation", {x: 0, y: 0, z: 0});

    this._entity._bs.On("click", async (e) => {
        if(held){
            this._entity.SetParent(lastParent)
        }else{
            console.log("click", e.detail.point)
            lastParent = this._entity.parentId;
            let tippyHolderPath = "People/"+user+"/Tippy_"+user+"/Holder";
            let tippyHolder = SM.getEntityById(tippyHolderPath)
            console.log(`tippy => ${tippyHolderPath}`, tippyHolder)
            if(!tippyHolder){
                showNotification("Error: Tippy not found")
                return;
            }
            tippyHolder.getTransform().Set("position", e.detail.point)
            this._entity.SetParent(tippyHolderPath)
        }
        held = !held;
    })
    
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = async()=>{
    log("UNDO UI", "onDestroy")
    if(PaneEntity){
        await RemoveEntity(PaneEntity.id)
    }
}

this.keyDown = (key)=>{
    console.log("keyDown", key)
}

this.keyUp = (key)=>{
    console.log("keyUp", key)
}