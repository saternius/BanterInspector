
log("Trackers", "Trackers script loadesd");
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
        let material = tracker.getComponent("BanterMaterial");
        material.Set("color", rgba);
        let attachment = tracker.getComponent("BanterAttachedObject");
        attachment.Set("attachmentPoint", attachmentPoints[name]);
        attachment.Set("uid", scene.localUser.uid);
    }
    return tracker;
}


(async ()=>{
    let trackers = SM.getEntityById(`People/${me}/Trackers`, false);
    if(!trackers){
        await AddEntity("People/"+me, "Trackers");
    }
    let headTracker = await getOrMakeTracker("HEAD");
    let bodyTracker = await getOrMakeTracker("BODY");
    let leftHandTracker = await getOrMakeTracker("LEFT_HAND");
    let rightHandTracker = await getOrMakeTracker("RIGHT_HAND");
    let cockpitTracker = await getOrMakeTracker("COCKPIT");
})()

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