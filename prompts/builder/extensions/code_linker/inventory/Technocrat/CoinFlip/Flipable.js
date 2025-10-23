this._entity.penny = true;
let consecutive_heads = 0;
const tracks = {
    'flip_1': 'flips/flip_1.wav',
    'flip_2': 'flips/flip_2.wav',
    'flip_3': 'flips/flip_3.wav',
    'flip_4': 'flips/flip_4.wav',
    'flip_5': 'flips/flip_5.wav',
    'flip_6': 'flips/flip_6.wav',
    'flip_7': 'flips/flip_7.wav',
    'flip_8': 'flips/flip_8.wav',
    'flip_9': 'flips/flip_9.wav',
    'flip_10': 'flips/flip_10.wav',
    'flip_11': 'flips/flip_11.wav',
    'flip_12': 'flips/flip_12.wav',
    'flip_13': 'flips/flip_13.wav',
    'flip_14': 'flips/flip_14.wav',
    'flip_15': 'flips/flip_15.wav',
    'flip_16': 'flips/flip_16.wav',
    'flip_17': 'flips/flip_17.wav',
    'flip_18': 'flips/flip_18.wav',
    'flip_19': 'flips/flip_19.wav',
    'flip_20': 'flips/flip_20.wav',
    'flip_21': 'flips/flip_21.wav',
    'flip_22': 'flips/flip_22.wav',
    'flip_23': 'flips/flip_23.wav',
    'flip_24': 'flips/flip_24.wav',
    'flip_25': 'flips/flip_25.wav',
    'success_1': 'success/success_1.wav',
    'success_2': 'success/success_2.wav',
    'success_3': 'success/success_3.wav',
    'success_4': 'success/success_4.wav',
    'success_5': 'success/success_5.wav',
    'success_6': 'success/success_6.wav',
    'success_7': 'success/success_7.wav',
    'success_8': 'success/success_8.wav',
    'success_9': 'success/success_9.wav',
    'success_10': 'success/success_10.wav',
    'success_11': 'success/success_11.wav',
    'success_12': 'success/success_12.wav',
    'success_13': 'success/success_13.wav',
    'success_14': 'success/success_14.wav',
    'nothing': 'tap.mp3'
}

this.onLoaded = ()=>{
    let preloadAudio = SM.getEntityById(`${this._entity.id}/sfx/preloader`).getComponent("AudioSource")
    Object.values(tracks).forEach((suburl)=>{
        preloadAudio._bs.PlayOneShotFromUrl(`https://suitable-bulldog-flying.ngrok-free.app/assets/audio/${suburl}`)
    })
}


let play_audio = (track)=>{
    let source = track.split('_')[0]
    let audio = SM.getEntityById(`${this._entity.id}/sfx/${source}`).getComponent("AudioSource")
    audio._bs.PlayOneShotFromUrl(`https://suitable-bulldog-flying.ngrok-free.app/assets/audio/${tracks[track]}`)
}

let audio = this._entity.getComponent("AudioSource")
this.flip = async ()=>{
    //SM.getScriptByName("Gains")?.clear()
    let up_force = Math.random()*2+2
    let x_torque = (Math.random() - 0.5) * 4    // Range: -2 to +2
    let y_torque = (Math.random() - 0.5) * 4    // Range: -2 to +2
    let z_torque = (Math.random() - 0.5) * 10 + 1  // Range: -4 to +6 
    log("flipable", up_force, x_torque, y_torque, z_torque)

    let rigidBody = this._entity.getComponent("Rigidbody")
    if(!rigidBody){
        log("flipable", "NO RIGIDBODY")
        return null;
    }

    // Apply flip forces
    rigidBody._bs.AddForce({x: 0, y: up_force, z: 0}, BS.ForceMode.Impulse);
    rigidBody._bs.AddTorque({x: x_torque, y:y_torque,  z: z_torque}, BS.ForceMode.Impulse);
    play_audio('flip_'+Math.floor(Math.random()*25+1))
    // Track the coin and return result
    return await this.trackCoin();
}

// Function to check if coin is heads or tails
this.isCoinHeads = () => {
    // Get the rotation of the coin
    const rotation = this._entity.Get("rotation");

    if (!rotation) {
        return false;
    }

    // Convert quaternion to up vector
    // For a coin, we check if the local "up" vector points upward in world space
    // Quaternion to matrix conversion for the up vector (0,1,0)
    const { x, z } = rotation;

    // Calculate the world "up" direction from the coin's local up axis
    // We only need the Y component to determine if the coin is facing up or down
    const upY = 1 - 2 * (x*x + z*z);

    // If the coin's up vector points upward (positive Y), it's heads
    // If it points downward (negative Y), it's tails
    return !(upY > 0);
}

// Async function to track the coin until it settles
this.trackCoin = () => {
    log('flipable', 'Tracking coin');
    return new Promise((resolve) => {
        // Wait 500ms before starting to track to let physics kick in
        setTimeout(() => {
            let checkCount = 0;
            let hasMovedSignificantly = false;
            let lastPos = null;

            const checkInterval = setInterval(() => {
                const rigidBody = this._entity.getComponent("Rigidbody");
                if (!rigidBody) {
                    clearInterval(checkInterval);
                    resolve(null);
                    return;
                }

                // Try to get angular velocity from the BanterScript rigidbody
                let angularVelocity = rigidBody._bs.angularVelocity;
                let velocity = rigidBody._bs.velocity;

                if (!angularVelocity) {
                    // Fallback: check rotation changes
                    const currentRot = this._entity.Get("rotation");

                    if (lastPos && lastPos.rotation) {
                        const dx = currentRot.x - lastPos.rotation.x;
                        const dy = currentRot.y - lastPos.rotation.y;
                        const dz = currentRot.z - lastPos.rotation.z;
                        const dw = currentRot.w - lastPos.rotation.w;
                        angularVelocity = { x: dx * 10, y: dy * 10, z: dz * 10 }; // Approximate angular velocity
                    } else {
                        angularVelocity = { x: 100, y: 100, z: 100 }; // Force movement detection on first check
                    }
                    lastPos = { position: this._entity.Get("position"), rotation: currentRot };
                }

                // Check both angular and linear velocity for settling
                const angularSpeed = Math.sqrt(angularVelocity.x**2 + angularVelocity.y**2 + angularVelocity.z**2);
                const linearSpeed = velocity ? Math.sqrt(velocity.x**2 + velocity.y**2 + velocity.z**2) : 0;

                // Track if coin has moved/rotated significantly
                if (!hasMovedSignificantly && (angularSpeed > 0.35 || linearSpeed > 0.35)) {
                    hasMovedSignificantly = true;
                    log('flipable', `Coin has moved significantly: ${angularSpeed}, ${linearSpeed}`);
                }
                if(!hasMovedSignificantly){
                    log('flipable', `Coin has not moved significantly: ${angularSpeed}, ${linearSpeed}`);
                }


                checkCount++;

                // Only consider it settled if it has moved significantly AND both angular and linear speeds are low
                if (hasMovedSignificantly && angularSpeed < 0.25 && linearSpeed < 0.25) {
                    clearInterval(checkInterval);

                    // Check if it's heads or tails
                    const isHeads = this.isCoinHeads();
                    if(isHeads){
                        consecutive_heads++;
                    }else{
                        consecutive_heads = 0;
                    }
                    const result = isHeads ? 'heads' : 'tails';
                    log('flipable', `Coin landed: ${result.toUpperCase()}`);
                    if(isHeads){
                        play_audio('success_'+consecutive_heads)

                        let position = this._entity.Get("position")
                        let positionStr = JSON.stringify(position);
                        networking.runJS(`
                            SM.getScriptByName("Gains").pop(${positionStr})
                        `)

                    }else{
                        play_audio('nothing')
                    }
                    
                    resolve(result);
                }

                // Timeout after 10 seconds
                if (checkCount > 200) {
                    log('flipable', `Coin tracking timeout`);
                    clearInterval(checkInterval);
                    // Still check the final position
                    const isHeads = this.isCoinHeads();
                    const result = isHeads ? 'heads' : 'tails';
                    resolve(result);
                }
            }, 50); // Check every 100ms
        }, 100); // Wait 500ms before starting tracking
    });
}


this.onStart = ()=>{
    log("flipable", "onStart called - setting up watchers");

    // Test WatchTransform with detailed logging
    const watchResult = this._entity.WatchTransform(["position", "rotation"], (data)=>{
        log("flipable", "WatchTransform callback fired!");
        log("flipable", "Callback data received:", data);
        log("flipable", "Current position:", this._entity.Get("position"));
        log("flipable", "Current rotation:", this._entity.Get("rotation"));
    });

    log("flipable", "WatchTransform returned:", watchResult);
    log("flipable", "Return type:", typeof watchResult);
    log("flipable", "Is Promise?", watchResult instanceof Promise);

    // Also test the rigidbody watcher
    const rigidBody = this._entity.getComponent("Rigidbody");
    if(rigidBody) {
        rigidBody.WatchProperties(['velocity', 'angularVelocity'], (data)=>{
            log("flipable", "velocity changed, data:", data);
            log("flipable", "Current velocity:", rigidBody._bs.velocity);
        });
        log("flipable", "Rigidbody velocity watcher set up");
    } else {
        log("flipable", "WARNING: No rigidbody found!");
    }

    log("flipable", "onStart completed - all watchers should be active");

    this._entity._bs.On("click", (e)=>{
        log("flipable", "click", e.detail)
        this.flip();
    });
}

this.onDestroy = ()=>{
    // this._entity._bs.listeners.get("click").delete(flip);
}
