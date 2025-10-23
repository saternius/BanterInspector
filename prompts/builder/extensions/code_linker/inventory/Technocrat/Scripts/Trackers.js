log("Trackers", "Trackers script loaded");

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

const attachmentPoints = {
    HEAD: 0,
    BODY: 1,
    LEFT_HAND: 2,
    RIGHT_HAND: 3,
    COCKPIT: 4,
}

let me = SM.myName();
let color = scene.localUser.color;

//function to convert hex to rgb
function hexToRgb(hex) {
    const [r, g, b] = hex.match(/\w\w/g).map(c => parseInt(c, 16) / 255);
    return {r, g, b, a: 1};
}

let rgba = hexToRgb(color);

log("Trackers", "color", rgba);

let getOrMakeTracker = async (name)=>{
    let tracker = await LoadItem('Tracker', `People/${me}/Trackers`, {name: name});
    let material = tracker.getComponent("Material");
    log("Trackers", "Material found, setting color", rgba);
    material.Set("color", rgba);
    log("Trackers", "Attachment found, setting attachment point", attachmentPoints[name]);
    let attachment = tracker.getComponent("AttachedObject");
    attachment.Set("attachmentPoint", attachmentPoints[name]);
    attachment.Set("uid", scene.localUser.uid);
    return tracker;
}

async function VerifyComponentExistance(path){
    let entKey = `$${path}:active`
    log("Trackers", "Verifying existence of", path, "with key", entKey, "and value", scene.spaceState.public[entKey]);
    if(scene.spaceState.public[entKey]){
        return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return await VerifyExistance(path);
}


async function VerifyExistance(path){
    let entKey = `$${path}:active`
    log("Trackers", "Verifying existence of", path, "with key", entKey, "and value", scene.spaceState.public[entKey]);
    if(scene.spaceState.public[entKey]){
        return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return await VerifyExistance(path);
}

async function VerifyInexistance(path){
    let entKey = `$${path}:active`
    log("Trackers", "Verifying inexistence of", path, "with key", entKey, "and value", scene.spaceState.public[entKey]);
    if(!scene.spaceState.public[entKey] || scene.spaceState.public[entKey] === "null"){
        return true;
    }
    await RemoveEntity(path);
    await new Promise(resolve => setTimeout(resolve, 500));
    return await VerifyInexistance(path);
}

let headTracker = null;
let leftHandTracker = null;
let rightHandTracker = null;

//conditions
// it doesnt exist in spaceprops, but exist in local
// it exists in spaceprops, but not in local
// it exists in spaceprops and local
// it exists in neither


(async ()=>{
    log("Trackers", "[START]");
    await VerifyExistance("People");

    log("Trackers", "'People' exists, checking my dir..", me);

    await RemoveEntity("People/"+me);
    await VerifyInexistance("People/"+me);
    await AddEntity("People", me);
    await VerifyExistance("People/"+me);
    await AddEntity("People/"+me, "Trackers");
    await VerifyExistance("People/"+me+"/Trackers");

    log("Trackers", "$People/${me}/Trackers exists, loading trackers..");


    headTracker = await getOrMakeTracker("HEAD");
    log("Trackers", "HEAD tracker loaded");
    leftHandTracker = await getOrMakeTracker("LEFT_HAND");
    log("Trackers", "LEFT_HAND tracker loaded");
    rightHandTracker = await getOrMakeTracker("RIGHT_HAND");
    log("Trackers", "RIGHT_HAND tracker loaded");

    log("Trackers", "[END]");
})()
