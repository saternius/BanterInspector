//hey2
this.default = {}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})

let timestamp2Time = (timestamp)=>{
    return new Date(timestamp).toUTCString().substr(-12,8)
}

let generateUI = ()=>{
    changeManager.undoStack.forEach(undo=>{
        const row = new BS.UILabel(panel);
        const title = new BS.UILabel(row);
        title.Text = `${timestamp2Time(undo.timestamp)}`;
        const description = new BS.UILabel(row);
        description.Text = `${undo.description}`;
    })
    changeManager.redoStack.forEach(redo=>{
        const row = new BS.UILabel(panel);
        row.Text = `[${timestamp2Time(redo.timestamp)}]: ${redo.description}`;
    })
}

let PaneEntity = null;
let changeListener = null;
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
    panel.SetBackgroundColor(new BS.Vector4(.12,.18,.24,1))

    transform.Set("localPosition", startingPosition);

    generateUI();
    changeListener = (change)=>{
        console.log("UNDO UI", "change =>", change)
    }
    
    changeManager.addChangeListener(changeListener)
    
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = async()=>{
    log("UNDO UI", "onDestroy")
    if(PaneEntity){
        await RemoveEntity(PaneEntity.id)
    }
    changeManager.removeChangeListener(changeListener)
}

this.keyDown = (key)=>{
    console.log("keyDown", key)
}

this.keyUp = (key)=>{
    console.log("keyUp", key)
}