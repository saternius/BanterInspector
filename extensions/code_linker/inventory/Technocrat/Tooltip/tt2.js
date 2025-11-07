this.default = {}
console.log("TT2")
Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})


//quaternion to euler
function quaternionToEuler(quaternion) {
    const x = quaternion.x;
    const y = quaternion.y;
    const z = quaternion.z;
    const w = quaternion.w;
    
    const t0 = 2.0 * (w * x + y * z);
    const t1 = 1.0 - 2.0 * (x * x + y * y);
    const roll = Math.atan2(t0, t1);
    
    const t2 = 2.0 * (w * y - z * x);
    
    const t3 = 1.0 - 2.0 * (y * y + z * z);
    const pitch = Math.asin(t2);
    
    const t4 = 2.0 * (w * z + x * y);
    const t5 = 1.0 - 2.0 * (y * y + z * z);
    const yaw = Math.atan2(t4, t5);

    return {
        x: roll,
        y: pitch,
        z: yaw
    }
}
  

let GetObjectGlobalTransform = (objectName)=>{
    scene.SendToVisualScripting('globalTransform', objectName);
}

window.networking.globalProps = (name, globalPos, globalRot) =>{
    //console.log("OBJECT PROPS [RAW] ", name, globalPos, globalRot)
    // let p_arr = globalPos.split(",").map(x=>parseFloat(x))
    let r_arr = globalRot.split(",").map(x=>parseFloat(x))
    // console.log("OBJECT PROPS [ARR] ", name, p_arr, r_arr)
    // let pos_vec = {x:p_arr[0], y:p_arr[1], z:p_arr[2]}
    let quaternion = {x:r_arr[0], y:r_arr[1], z:r_arr[2], w:r_arr[3]}
    let euler = quaternionToEuler(quaternion)
    window.inputHandler.getRightControllerRot = ()=>{
        return {
            x: euler.z,
            y: euler.y,
            z: euler.x,
        }
    }

    //console.log("OBJECT PROPS [VEC] ", name, euler)
    
    //const localUp = { x: 0, y: 1, z: 0 };
    //const globalUpDirection = rotateVectorByQuaternion(localUp, rot_vec);
    //tool_tip_pos = pos_vec;
    //RayCast(pos_vec, globalUpDirection, 100)
}

console.log('ENTITY NAME', this._entity.name)
GetObjectGlobalTransform(this._entity.name)
this.onStart = ()=>{
    console.log("onStart")
}

this.onUpdate = ()=>{
    //console.log("what")
   GetObjectGlobalTransform(this._entity.name)
}

this.onDestroy = ()=>{
    console.log("onDestroy")
}