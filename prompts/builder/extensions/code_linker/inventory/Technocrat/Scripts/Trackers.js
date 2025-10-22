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
    let tracker = SM.getEntityById(`People/${me}/Trackers/${name}`, false);
    if(!tracker){
        log("Trackers", "Tracker not found, loading =>", name);
        tracker = await LoadItem('Tracker', `People/${me}/Trackers`, {name: name});
        let material = tracker.getComponent("Material");
        material.Set("color", rgba);
        let attachment = tracker.getComponent("AttachedObject");
        attachment.Set("attachmentPoint", attachmentPoints[name]);
        attachment.Set("uid", scene.localUser.uid);

        // tracker._bs.WatchTransform(e=>{
        //     console.log("Trackers", "Tracker transform changed", e);
        // })
    }
    return tracker;
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


let headTracker = null;
let leftHandTracker = null;
let rightHandTracker = null;

(async ()=>{
    log("Trackers", "[START]");
    await VerifyExistance("People");
    log("Trackers", "'People' exists, checking my dir..", me);
    if(!scene.spaceState.public['$People/'+me+':active']){
        log("Trackers", `$People/${me} does not exist, creating..`);
        await AddEntity("People", me);
    }
    log("Trackers", "Lets verify that it actually exists");
    await VerifyExistance("People/"+me);
    log("Trackers", "$People/${me} exists, checking trackers dir..");
    

    if(!scene.spaceState.public['$People/'+me+'/Trackers:active']){
        log("Trackers", `$People/${me}/Trackers does not exist, creating..`);
        await AddEntity("People/"+me, "Trackers");
    }
    await VerifyExistance(`People/${me}/Trackers`);
    log("Trackers", "$People/${me}/Trackers exists, loading trackers..");


    headTracker = await getOrMakeTracker("HEAD");
    log("Trackers", "HEAD tracker loaded");
    leftHandTracker = await getOrMakeTracker("LEFT_HAND");
    log("Trackers", "LEFT_HAND tracker loaded");
    rightHandTracker = await getOrMakeTracker("RIGHT_HAND");
    log("Trackers", "RIGHT_HAND tracker loaded");

    log("Trackers", "[END]");
})()




// let onUpdate = async ()=>{
//     if(headTracker){
//         let headTransform = headTracker.getTransform();
//         await headTransform._bs.Q([13])
//         headTransform._update("localPosition", headTransform._bs._localPosition);
//         headTransform._update("localRotation", headTransform._bs._localRotation);
//     }
//     if(bodyTracker){
//         let bodyTransform = bodyTracker.getTransform();
//         await bodyTransform._bs.Q([13])
//         bodyTransform._update("localPosition", bodyTransform._bs._localPosition);
//         bodyTransform._update("localRotation", bodyTransform._bs._localRotation);
//     }
//     if(leftHandTracker){
//         let leftHandTransform = leftHandTracker.getTransform();
//         await leftHandTransform._bs.Q([13])
//         leftHandTransform._update("localPosition", leftHandTransform._bs._localPosition);
//         leftHandTransform._update("localRotation", leftHandTransform._bs._localRotation);
//     }
//     if(rightHandTracker){
//         let rightHandTransform = rightHandTracker.getTransform();
//         await rightHandTransform._bs.Q([13])
//         rightHandTransform._update("localPosition", rightHandTransform._bs._localPosition);
//         rightHandTransform._update("localRotation", rightHandTransform._bs._localRotation);
//     }
//     if(cockpitTracker){
//         let cockpitTransform = cockpitTracker.getTransform();
//         await cockpitTransform._bs.Q([13])
//         cockpitTransform._update("localPosition", cockpitTransform._bs._localPosition);
//         cockpitTransform._update("localRotation", cockpitTransform._bs._localRotation);
//     }
// }

// setInterval(onUpdate, (1000/lifecycle.fps));

// let loadTrackers = async ()=>{
//     let trackersEnt = SM.getEntityById("People/Technocrat/Trackers", false);
//     let headTracker = await getOrMakeTracker("LEFT_HAND");
//     headTracker.Set("color", rgb);
// }

// let StartWhenHeirLoaded = ()=>{
//    let myheir = SM.getEntityById("People/"+me);
//    if(myheir){
//     loadTrackers();
//     clearInterval(StartWhenHeirLoaded);
//    }
// }
// setInterval(StartWhenHeirLoaded, 500);
// //Create an Event On everything loaded