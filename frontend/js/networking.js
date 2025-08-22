const { appendToConsole } = await import(`${window.repoUrl}/utils.js`);

function safeParse(value) {
    // Only operate on strings
    if (typeof value !== 'string') return value;
  
    const str = value.trim();
  
    // 1) Booleans and null
    if (/^(?:true|false|null)$/i.test(str)) {
      if (str.toLowerCase() === 'null')   return null;
      return str.toLowerCase() === 'true';
    }
  
    // 2) Numbers (integer, float, scientific)
    if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(str)) {
      // +0/-0 edge cases mirror Number()
      return Number(str);
    }
  
    // 3) JSON objects or arrays
    if ((str.startsWith('{') && str.endsWith('}')) ||
        (str.startsWith('[') && str.endsWith(']'))) {
      try {
        return JSON.parse(str);
      } catch {
        // fall through to return original string
      }
    }
  
    // 4) Fallback
    return value;
}

let renderProps = ()=>{
    if(navigation.currentPage !== "world-inspector") return;
    inspector.propertiesPanel.render(SM.selectedEntity)
}


export class Networking {
    constructor(){
        this.db = null;
        this.storage = null;
        // Delay Firebase initialization to ensure all dependencies are loaded
        setTimeout(() => this.initFirebase(), 1000);
    }
    
    initFirebase() {
        log("init", "initializing firebase")
        // Firebase configuration
        const firebaseConfig = window.FIREBASE_CONFIG || {
            apiKey: "AIzaSyBrWGOkEJ6YjFmhXqvujbtDjWII3udLpWs",
            authDomain: "inspector-6bad1.firebaseapp.com",
            projectId: "inspector-6bad1",
            storageBucket: "inspector-6bad1.firebasestorage.app",
            messagingSenderId: "565892382854",
            appId: "1:565892382854:web:06cc45d58cc0f0e3205107",
            measurementId: "G-3S4G5E0GVK",
            databaseURL: "https://inspector-6bad1-default-rtdb.firebaseio.com"
        };
        
        // Initialize Firebase only if not already initialized
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.database();
                this.storage = firebase.storage();
                
                // Test the connection
                //this.testConnection();

                let initFirebaseListeners = ()=>{
                    if(window.inventory && window.inventory.firebase){
                        window.inventory.firebase.setupFirebaseListeners()
                    }else{
                        setTimeout(initFirebaseListeners, 500)
                    }
                }
                initFirebaseListeners()
            } catch (error) {
                console.error('Failed to initialize Firebase:', error);
            }
        }
    }
    
    async testConnection() {
        try {
            log('net', 'Testing Firebase Realtime Database connection...');
            
            // Try a simple write operation
            const testRef = this.db.ref('test/connection-test');
            await testRef.set({
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                test: true,
                message: 'Realtime Database connection test'
            });
            
            log('net', 'Realtime Database write successful');
            
            // Try to read it back
            const snapshot = await testRef.once('value');
            log('net', 'Realtime Database read successful:', snapshot.val());
            
            // Clean up - commented out to preserve test data  
            log('net', '✅ Firebase Realtime Database is working correctly!');
            
        } catch (error) {
            err('net', 'Realtime Database connection test failed:', error);
        }
    }
    
    async testStorageConnection() {
        log('net', '=== Starting Firebase Storage Test ===');
        
        try {
            // Step 1: Check if storage is initialized
            log('net', 'Step 1: Checking storage initialization...');
            const storage = this.getStorage();
            if (!storage) {
                err('net', '✗ Storage not initialized');
                return;
            }
            log('net', '✓ Storage initialized:', storage);
            
            // Step 2: Check storage bucket
            log('net', 'Step 2: Checking storage bucket...');
            const storageRef = storage.ref();
            log('net', 'Storage root reference:', storageRef);
            log('net', 'Storage bucket:', storageRef.bucket);
            
            // Step 3: Try to create a reference
            log('net', 'Step 3: Creating test reference...');
            const testPath = `test/storage-test-${Date.now()}.txt`;
            const testRef = storage.ref(testPath);
            log('net', 'Test reference created:', testRef.fullPath);
            
            // Step 4: Try to upload a simple text file
            log('net', 'Step 4: Attempting to upload test text...');
            const testContent = 'Firebase Storage test content';
            const blob = new Blob([testContent], { type: 'text/plain' });
            
            try {
                const snapshot = await testRef.put(blob);
                log('net', '✓ Upload successful:', snapshot);
                log('net', 'Upload state:', snapshot.state);
                log('net', 'Bytes transferred:', snapshot.bytesTransferred);
                
                // Step 5: Try to get download URL
                log('net', 'Step 5: Getting download URL...');
                const downloadURL = await snapshot.ref.getDownloadURL();
                log('net', '✓ Download URL obtained:', downloadURL);

                // Step 6: Try to delete the test file
                log('net', 'Step 6: Cleaning up test file...');
                await testRef.delete();
                log('net', '✓ Test file deleted successfully');
                
                log('net', '=== Firebase Storage Test PASSED ===');
                return true;
                
            } catch (uploadError) {
                err('net', '✗ Upload/Download failed:', uploadError);
                err('net', 'Error code:', uploadError.code);
                err('net', 'Error message:', uploadError.message);
                if (uploadError.serverResponse) {
                    err('net', 'Server response:', uploadError.serverResponse);
                }
                
                // Check common issues
                if (uploadError.code === 'storage/unauthorized') {
                    err('net', 'Issue: Storage security rules may be blocking uploads');
                    err('net', 'Solution: Check Firebase Console > Storage > Rules');
                } else if (uploadError.code === 'storage/unknown') {
                    err('net', 'Issue: Unknown storage error - check CORS and bucket configuration');
                    err('net', 'Check: Firebase Console > Storage > Files tab to ensure bucket exists');
                }
            }
            
        } catch (error) {
            err('net', '✗ Storage test failed:', error);
            err('net', 'Full error object:', error);
            
            // Additional debugging info
            if (error.code) err('net', 'Error code:', error.code);
            if (error.message) err('net', 'Error message:', error.message);
            if (error.serverResponse) {
                err('net', 'Server response:', error.serverResponse);
                try {
                    const parsed = JSON.parse(error.serverResponse);
                    err('net', 'Parsed server response:', parsed);
                } catch (e) {
                    // Not JSON
                }
            }
        }
        
        log('net', '=== Firebase Storage Test FAILED ===');
        return false;
    }

    getUserId(){
        let userId = localStorage.getItem('inspector_user_id');
        if (!userId) {
            userId = SM.myName();
            localStorage.setItem('inspector_user_id', userId);
        }
        return userId;
    }
    
    // Get the Firebase Realtime Database reference
    getDatabase() {
        if (!this.db && typeof firebase !== 'undefined') {
            this.db = firebase.database();
        }
        return this.db;
    }
    
    // Get the Firebase Storage reference
    getStorage() {
        if (!this.storage && typeof firebase !== 'undefined') {
            this.storage = firebase.storage();
        }
        return this.storage;
    }
    
    // Generic Firebase Realtime Database operations
    async addData(path, data) {
        if (!this.db) {
            err('net', 'Firebase Database not initialized');
            throw new Error('Firebase Database not initialized');
        }
        
        try {
            log('net', `Adding data to path: ${path}`, data);
            const newRef = this.db.ref(path).push();
            await newRef.set({
                ...data,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            log('net', 'Data added successfully with key:', newRef.key);
            return { id: newRef.key, ref: newRef };
        } catch (error) {
            err('net', `Failed to add data to ${path}:`, error);
            throw error;
        }
    }
    
    async setData(path, data) {
        if (!this.db) throw new Error('Firebase Database not initialized');
        await this.db.ref(path).set(data);
        return { path, data };
    }
    
    async getData(path) {
        if (!this.db) throw new Error('Firebase Database not initialized');
        const snapshot = await this.db.ref(path).once('value');
        return snapshot.val();
    }
    
    async updateData(path, updates) {
        if (!this.db) throw new Error('Firebase Database not initialized');
        await this.db.ref(path).update(updates);
        return { path, updates };
    }
    
    async deleteData(path) {
        if (!this.db) throw new Error('Firebase Database not initialized');
        await this.db.ref(path).remove();
        return { path };
    }
    
    // Query data with filters
    async queryData(path, options = {}) {
        if (!this.db) throw new Error('Firebase Database not initialized');
        let query = this.db.ref(path);
        
        // Apply ordering
        if (options.orderBy) {
            query = query.orderByChild(options.orderBy);
        }
        
        // Apply filters
        if (options.startAt !== undefined) {
            query = query.startAt(options.startAt);
        }
        if (options.endAt !== undefined) {
            query = query.endAt(options.endAt);
        }
        if (options.equalTo !== undefined) {
            query = query.equalTo(options.equalTo);
        }
        
        // Apply limits
        if (options.limitToFirst) {
            query = query.limitToFirst(options.limitToFirst);
        } else if (options.limitToLast) {
            query = query.limitToLast(options.limitToLast);
        }
        
        const snapshot = await query.once('value');
        const result = [];
        snapshot.forEach(childSnapshot => {
            result.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        return result;
    }

    handleSpaceStateChange(event) {
        const { changes } = event.detail;
        changes.forEach(async (change) => {
            let { property, newValue, isProtected } = change;
            if(window.logger.include.spaceProps){
                appendToConsole("spaceProps", "spaceProps_"+Math.floor(Math.random()*1000000), `[${property}] => ${newValue}`);
            }

            if(newValue[0] === "{" || newValue[0] === "["){
                newValue = JSON.parse(newValue);
            }
            if (isProtected) {
                SM.scene.spaceState.protected[property] = newValue;
            } else {
                SM.scene.spaceState.public[property] = newValue;
            }
        });
    }

    async routeOneShot(data, timestamp){

        if(data.startsWith("component_reordered:")){ // `component_reordered:${event_str}`;
            let eventData = data.slice(20); // Remove "component_reordered:" prefix
            try {
                let event = JSON.parse(eventData);
                let entity = SM.getEntityById(event.entityId);
                if(entity){
                    entity.reorderComponent(event.fromIndex, event.toIndex);
                    if(SM.selectedEntity === entity.id){
                        renderProps();
                    }
                }
            } catch(e) {
                err('net', "Failed to parse component_reordered event:", e);
            }
        }

        if(data.startsWith("update_entity")){ //`update_entity:${this.id}:${property}:${value}`;
            let str = data.slice(14)
            let nxtColon = str.indexOf(":")
            let entityId = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let prop = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let value = str.slice(nxtColon+1)
            let entity = SM.getEntityById(entityId);
            if(entity){
                await entity._set(prop, safeParse(value));
                inspector.hierarchyPanel.render()
                if(SM.selectedEntity === entity.id){
                    renderProps()
                }
            }
            SM.props[`__${entityId}/${prop}:entity`] = value
        }


        if(data.startsWith("update_component")){ // `update_component:${this.id}:${property}:${value}`;
            let str = data.slice(17)
            let nxtColon = str.indexOf(":")
            let componentId = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let prop = str.slice(0, nxtColon)
            let value = str.slice(nxtColon+1)
            let component = SM.getEntityComponentById(componentId);
            if(component){
                await component._setWithTimestamp(prop, safeParse(value), timestamp);
                if(SM.selectedEntity === component._entity.id){
                    renderProps()
                }
            }
            SM.props[`__${componentId}/${prop}:component`] = value
        }

        //update_monobehavior, update_component, update_entity
        if(data.startsWith("update_monobehavior")){
            let str = data.slice(20)
            let nxtColon = str.indexOf(":")
            let componentId = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let op = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let prop = str.slice(0, nxtColon)
            let value = str.slice(nxtColon+1)
            let monobehavior = SM.getEntityComponentById(componentId);
            if(op === "vars"){
                monobehavior.ctx.vars[prop] = safeParse(value);
                if(SM.selectedEntity === monobehavior._entity.id){
                    renderProps()
                }
            }else if(op === "_running"){
                if(monobehavior){
                    monobehavior.ctx._running = safeParse(value);
                    inspector.lifecyclePanel.render()
                }
            }

            SM.props[`__${componentId}/${prop}:component`] = value
        }

        if(data === "reset"){
            await SM._reset();
        }
       
        if(data.startsWith("load_entity")){
            let [parentId, entity_data] = data.slice(12).split("|");
            await SM._loadEntity(JSON.parse(entity_data), parentId);
            await SM.updateHierarchy();
        }

        if(data.startsWith("component_added")){
            let event = JSON.parse(data.slice(16));
            let entity = SM.getEntityById(event.entityId);
            if(entity){
                await SM._addComponent(entity, event.componentType, event.componentProperties);
                await SM.updateHierarchy();
            }
        }

        if(data.startsWith("component_removed")){
            let componentId = data.slice(18);
            let component = SM.getEntityComponentById(componentId);
            if(component){
                await component._destroy();
                await SM.updateHierarchy();
            }
        }

        if(data.startsWith("entity_added")){
            let [parentId, entityName] = data.slice(13).split(":");
            await SM._addNewEntity(entityName, parentId);
            await SM.updateHierarchy();
        }

        if(data.startsWith("entity_removed")){
            let entityId = data.slice(15);
            let entity = SM.getEntityById(entityId);
            if(entity){
                await entity._destroy();
                await SM.updateHierarchy();
            }
        }

        if(data.startsWith("entity_moved")){
            let [entityId, newParentId, newSiblingIndex] = data.slice(13).split(":");
            //newSiblingIndex = (newSiblingIndex)? parseInt(newSiblingIndex) : null;
            const entity = SM.getEntityById(entityId);
            if (!entity) return;
            if(!newParentId) newParentId = SM.entityData.entities[0].id;
            await entity._setParent(SM.getEntityById(newParentId));
            await SM.updateHierarchy();
        }

        if(data.startsWith("monobehavior_start")){
            let componentId = data.slice(19);
            let monobehavior = SM.getEntityComponentById(componentId);
            if(monobehavior){
                monobehavior._start();
            }
        }

        if(data.startsWith("monobehavior_stop")){
            let componentId = data.slice(18);
            let monobehavior = SM.getEntityComponentById(componentId);
            if(monobehavior){
                monobehavior._stop();
            }
        }

        if(data.startsWith("monobehavior_refresh")){
            let componentId = data.slice(21);
            let monobehavior = SM.getEntityComponentById(componentId);
            if(monobehavior){
                monobehavior._refresh();
            }
        }

        
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.style.opacity = 1;
            saveBtn.style.cursor = "pointer";
            saveBtn.style.pointerEvents = "auto";
        }
    }

    async handleOneShot(event){

        let message = event.detail.data;
        
        if(window.logger.include.oneShot){
            appendToConsole("oneShot", "oneShot_"+Math.floor(Math.random()*1000000), message);
        }
        let firstColon = message.indexOf(":");
        let timestamp = parseInt(message.slice(0, firstColon));
        
        message = message.slice(firstColon+1);
        let secondColon = message.indexOf(":");
        let sender = message.slice(0, secondColon);
        
        if(sender === SM.myName()){
            return;
        }
      
        let data = message.slice(secondColon+1);
        await this.routeOneShot(data, timestamp)
    }


    async setSpaceProperty(key, value, isProtected) {
        if (!SM.scene) return;
        // if(typeof value === "object"){
        //     value = JSON.stringify(value);
        // }

        if (isProtected) {
            SM.scene.SetProtectedSpaceProps({ [key]: value });
            SM.scene.spaceState.protected[key] = value;
        } else {
            SM.scene.SetPublicSpaceProps({ [key]: value });
            SM.scene.spaceState.public[key] = value;
        }
        
        if(window.isLocalHost){
            this.handleSpaceStateChange({detail: {changes: [{property: key, newValue: value, isProtected: isProtected}]}})
            //localStorage.setItem('lastSpaceState', JSON.stringify(this.scene.spaceState));
        }
    }

    async deleteSpaceProperty(key, isProtected){
        if(isProtected){
            SM.scene.SetProtectedSpaceProps({ [key]: null });
            delete SM.scene.spaceState.protected[key];
        }else{
            SM.scene.SetPublicSpaceProps({ [key]: null });
            delete SM.scene.spaceState.public[key];
        }
        if(window.isLocalHost){
            localStorage.setItem('lastSpaceState', JSON.stringify(SM.scene.spaceState));
        }
    }


    async sendOneShot(data){
        let now = Date.now();
        let remote_message = `${now}:${SM.myName()}:${data}`
        SM.scene.OneShot(remote_message);
        await this.routeOneShot(data, now)
    }

}

export const networking = new Networking();
window.networking = networking;


//This should eventually be deprecated
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

window.networking.globalProps = (name, globalPos, globalRot) =>{
    //console.log("globalProps", name, globalPos, globalRot)
    let p_arr = globalPos.split(",").map(x=>parseFloat(x))
    let r_arr = globalRot.split(",").map(x=>parseFloat(x))
    let pos_vec = {x:p_arr[0], y:p_arr[1], z:p_arr[2]}
    let quaternion = {x:r_arr[0], y:r_arr[1], z:r_arr[2], w:r_arr[3]}
    let euler = quaternionToEuler(quaternion)
    SM.getAllMonoBehaviors().forEach(monobehavior => {
        if(monobehavior.ctx.globalProps){
            monobehavior.ctx.globalProps(name, pos_vec, euler)
        }
    })
}



// Debug function for testing Firebase Realtime Database
window.testFirebaseDB = async () => {
    log('net', 'Testing Firebase Realtime Database...');
    try {
        const db = networking.getDatabase();
        
        // Test 1: Add data
        const testData = {
            test: true,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            message: 'Test data from Realtime Database',
            number: 42,
            boolean: true,
            array: ['item1', 'item2'],
            nested: { key: 'value' }
        };
        
        log('net', 'Adding test data...');
        const newRef = db.ref('test').push();
        await newRef.set(testData);
        log('net', '✅ Data added with key:', newRef.key);
        
        // Test 2: Read it back
        log('net', 'Reading data...');
        const snapshot = await newRef.once('value');
        log('net', '✅ Retrieved data:', snapshot.val());
        
        // Test 3: Update it
        log('net', 'Updating data...');
        await newRef.update({
            updated: true,
            updateTime: firebase.database.ServerValue.TIMESTAMP
        });
        log('net', '✅ Data updated');
        
        // Test 4: List data
        log('net', 'Listing data...');
        const listSnapshot = await db.ref('test').limitToFirst(10).once('value');
        log('net', '✅ Listed data:', listSnapshot.val());
        
        // Test 5: Delete
        log('net', 'Deleting data...');
        await newRef.remove();
        log('net', '✅ Data deleted');
        
        return '✅ All Realtime Database tests passed!';
    } catch (error) {
        err('net', '❌ Realtime Database test failed:', error);
        return error;
    }
};