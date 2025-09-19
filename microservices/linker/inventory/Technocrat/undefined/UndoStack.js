let timestamp2Time = (timestamp)=>{
    return new Date(timestamp).toUTCString().substr(-12,8)
}

let container = null;
let generateUI = ()=>{
    if(container){
        container.destroy();
    }
    container = doc.createElement();

    let renderChange = (change, type)=>{
        const row = doc.createElement();
        row.style.display = "flex";
        row.style.flexDirection = "row"
        row.style.gap = "10px";
        row.style.backgroundColor = (type === "undo" ? "#231422" : "#431422");

        const time = doc.createElement();
        time.style.color = "grey"
        time.text = `${timestamp2Time(change.timestamp)}`;


        const description = doc.createElement();
        description.text = `${change.description}`;

        row.appendChild(time);
        row.appendChild(description);
        container.appendChild(row);
    }

    changeManager.undoStack.forEach(change=>{
        renderChange(change, "undo");
    })
    changeManager.redoStack.forEach(change=>{
        renderChange(change, "redo");
    })
}

let PaneEntity = null;
let changeListener = null;
let held = false;
let lastParent = "Scene";
let doc = null;
let user = SM.myName();

this.onStart = async ()=>{
    let curTime = new Date().toUTCString();
    log("UNDO UI", `making UI [${curTime}]`)
    let transform = this._entity.getTransform();
    let headTracker = await GetTracker("HEAD");
    let headTransform = headTracker.getTransform();
    let headPosition = headTransform._bs._localPosition;
    let headForward = TransformOps.Multiply(headTransform._bs.forward, 1.75);
    let startingPosition = TransformOps.Add(headPosition, headForward);
    let startingRotation = headTransform._bs._rotation;
    transform.Set("localPosition", {x: 0, y: 0, z: 0});
    PaneEntity = await AddEntity(this._entity.id, "UI")
 
    
    doc = await PaneEntity._bs.AddComponent(new BS.BanterUI(new BS.Vector2(512,512), false));
    doc.SetBackgroundColor(new BS.Vector4(.12,.18,.24,1));


    doc.gameObject.On("click", (e)=>{
        if(held){
            this._entity.SetParent(lastParent)
        }else{
            console.log("click", e.detail)
            let tippyHolderPath = "People/"+user+"/Trackers/RIGHT_HAND/Holder";
            let tippyHolder = SM.getEntityById(tippyHolderPath)
            console.log(`RIGHT_HAND HOLDER => ${tippyHolderPath}`, tippyHolder)
            if(!tippyHolder){
                showNotification("Error: RIGHT_HAND Holder not found")
                return;
            }
            tippyHolder.getTransform().Set("position", e.detail.point)
            lastParent = this._entity.parentId;
            this._entity.SetParent(tippyHolderPath)
        }
        held = !held;
    })

    // panel = new BS.BanterUIPanel(BS.UIPanelPool.acquirePanel(), new BS.Vector2(512,512), false);
    // await PaneEntity._bs.AddComponent(panel);
    // panel.SetBackgroundColor(new BS.Vector4(.12,.18,.24,1))

    transform.Set("localPosition", startingPosition);
    transform.Set("localRotation", startingRotation);

    generateUI();
    changeListener = (change)=>{
        generateUI();
    }
    
    changeManager.addChangeListener(changeListener)
    
}


this.onDestroy = async()=>{
    log("UNDO UI", "onDestroy")
    if(PaneEntity){
        await RemoveEntity(PaneEntity.id)
    }
    changeManager.removeChangeListener(changeListener)
}
