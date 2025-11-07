let timestamp2Time = (timestamp)=>{
    return new Date(timestamp).toUTCString().substr(-12,8)
}

let held = false;
let lastParent = "Scene";
let user = SM.myName();

let grabHandler = (e)=>{
    console.log("grabHandler", e.detail)
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
}


let fetchTracker = async (name)=>{
    try{
        let tracker = await GetTracker(name);
        return tracker;
    }catch(e){
        await new Promise(resolve => setTimeout(resolve, 500));
        return await fetchTracker(name);
    }
}



let getStartingSpot = async ()=>{
    let headTracker = await fetchTracker("HEAD");
    let headTransform = headTracker.getTransform();
    let headPosition = headTransform._bs._localPosition;
    let headForward = TransformOps.Multiply(headTransform._bs.forward, 1.75);
    let startingPosition = TransformOps.Add(headPosition, headForward);
    startingPosition.y -= 0.5;
    let startingRotation = lockQuaternionAxes(headTransform._bs._rotation, true, false, true);
    // console.log("startingPosition", startingPosition)
    // console.log("startingRotation", startingRotation)
    return {startingPosition, startingRotation};
}

// this.onUpdate = async ()=>{
//     let {startingPosition, startingRotation} = await getStartingSpot();
//     let transform = this._entity.getTransform();
//     transform.Set("localPosition", startingPosition);
//     transform.Set("localRotation", startingRotation);
// }

let container = null;
let contentArea = null;
let generateUI = ()=>{
    if(container){
        container.Destroy();
    }
    log("UNDO UI", "generating UI")
    container = doc.CreateVisualElement();
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.width = "100%";
    container.style.height = "100%";

    // Create Windows-style header
    const header = doc.CreateVisualElement();
    header.style.display = "flex";
    header.style.flexDirection = "row";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.backgroundColor = "grey";
    header.style.padding = "8px";
    header.style.borderBottom = "1px solid #333";

    header.OnClick(grabHandler)

    const title = doc.CreateLabel();
    title.text = "Undo/Redo Stack";
    title.style.color = "#ffffff";
    title.style.fontSize = "14px";
    title.style.fontWeight = "bold";

    const closeButton = doc.CreateButton();
    closeButton.text = "✕";
    closeButton.style.backgroundColor = "transparent";
    closeButton.style.color = "#ffffff";
    closeButton.style.border = "none";
    closeButton.style.fontSize = "16px";
    closeButton.style.padding = "4px 8px";
    closeButton.style.cursor = "pointer";
    closeButton.OnClick(() => {
        DestroySelf();
    });
    closeButton.OnMouseEnter(() => {
        closeButton.style.backgroundColor = "#e81123";
    });
    closeButton.OnMouseLeave(() => {
        closeButton.style.backgroundColor = "transparent";
    });

    header.AppendChild(title);
    header.AppendChild(closeButton);
    container.AppendChild(header);

    // Create content area for undo/redo items
    contentArea = doc.CreateVisualElement();
    contentArea.style.flex = "1";
    contentArea.style.overflowY = "auto";
    contentArea.style.padding = "8px";
    container.AppendChild(contentArea);

    let renderChange = (change, type)=>{
        const row = doc.CreateVisualElement();
        row.style.display = "flex";
        row.style.flexDirection = "row"
        row.style.gap = "10px";
        row.style.backgroundColor = (type === "undo" ? "#231422" : "#431422");

        const time = doc.CreateLabel();
        time.style.color = "grey"
        time.text = `${timestamp2Time(change.timestamp)}`;


        const description = doc.CreateLabel();
        description.text = `${change.description}`;

        row.AppendChild(time);
        row.AppendChild(description);
        contentArea.AppendChild(row);
    }

    changeManager.undoStack.forEach(change=>{
        renderChange(change, "undo");
    })

    changeManager.redoStack.forEach(change=>{
        renderChange(change, "redo");
    })

    contentArea.style.backgroundColor = "rgba(31,46,61,1)";
}



let PaneEntity = null;
let changeListener = null;
let doc = null;

this.onStart = async ()=>{
    let {startingPosition, startingRotation} = await getStartingSpot();
    let transform = this._entity.getTransform();

    let curTime = new Date().toUTCString();
    log("UNDO UI", `making UI [${curTime}]`)
    
    transform.Set("localPosition", {x: 0, y: 0, z: 0});
    PaneEntity = await AddEntity(this._entity.id, "UI")
 

    doc = await PaneEntity._bs.AddComponent(new BS.BanterUI(new BS.Vector2(512,512), false));
    // doc.resolution = new BS.Vector2(512,512);
    // doc.screenSpace = false;

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


let DestroySelf = async ()=>{
    log("UNDO UI", "Destroying Undo UI");
    await RemoveEntity(this._entity.id);
}