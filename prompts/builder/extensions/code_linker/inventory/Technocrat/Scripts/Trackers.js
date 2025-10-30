log("Trackers", "Trackers script loaded");
const attachmentPoints = {
    HEAD: 0,
    BODY: 1,
    LEFT_HAND: 2,
    RIGHT_HAND: 3,
    COCKPIT: 4,
}

function hexToRgb(hex) {
    const [r, g, b] = hex.match(/\w\w/g).map(c => parseInt(c, 16) / 255);
    return {r, g, b, a: 1};
}

let me = SM.myName();
let color = scene.localUser.color;
let rgba = hexToRgb(color);

window.GetTracker = async (name)=>{
    let tracker = SM.getEntityById(`People/${me}/Trackers/${name}`, false);
    if(!tracker){
        log("Trackers", "Tracker not found: ", name, "waiting..");
        await new Promise(resolve => setTimeout(resolve, 500));
        return await GetTracker(name);
    }else{
        return tracker;
    }
}


let getOrMakeTracker = async (name)=>{
    let tracker = await LoadItem('Tracker', `People/${me}/Trackers`, {name: name});
    let material = tracker.getComponent("Material");
    material.Set("color", rgba);
    let attachment = tracker.getComponent("AttachedObject");
    attachment.Set("attachmentPoint", attachmentPoints[name]);
    attachment.Set("uid", scene.localUser.uid);
    log("Trackers", `${name} tracker loaded`);
    return tracker;
}


(async ()=>{
    log("Trackers", "[START]");
    await RemoveEntity("People/"+me);
    await AddEntity("People", me);
    await AddEntity("People/"+me, "Trackers");
    await getOrMakeTracker("HEAD");
    await getOrMakeTracker("LEFT_HAND");
    await getOrMakeTracker("RIGHT_HAND");
    log("Trackers", "[END]");
})()
