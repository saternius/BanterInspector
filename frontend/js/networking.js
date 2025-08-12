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
    inspector.propertiesPanel.render(SM.selectedSlot)
}


export class Networking {
    constructor(){
        this.db = null;
        // Delay Firebase initialization to ensure all dependencies are loaded
        setTimeout(() => this.initFirebase(), 1000);
    }
    
    initFirebase() {
        console.log("INITIALIZING FIREBASE")
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
                
                console.log('Firebase Realtime Database initialized');
                
                // Test the connection
                //this.testConnection();
            } catch (error) {
                console.error('Failed to initialize Firebase:', error);
            }
        }
    }
    
    async testConnection() {
        try {
            console.log('Testing Firebase Realtime Database connection...');
            
            // Try a simple write operation
            const testRef = this.db.ref('test/connection-test');
            await testRef.set({
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                test: true,
                message: 'Realtime Database connection test'
            });
            
            console.log('Realtime Database write successful');
            
            // Try to read it back
            const snapshot = await testRef.once('value');
            console.log('Realtime Database read successful:', snapshot.val());
            
            // Clean up - commented out to preserve test data
            // await testRef.remove();
            // console.log('Realtime Database delete successful');
            
            console.log('✅ Firebase Realtime Database is working correctly!');
            
        } catch (error) {
            console.error('Realtime Database connection test failed:', error);
        }
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
    
    // Generic Firebase Realtime Database operations
    async addData(path, data) {
        if (!this.db) {
            console.error('Firebase Database not initialized');
            throw new Error('Firebase Database not initialized');
        }
        
        try {
            console.log(`Adding data to path: ${path}`, data);
            const newRef = this.db.ref(path).push();
            await newRef.set({
                ...data,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('Data added successfully with key:', newRef.key);
            return { id: newRef.key, ref: newRef };
        } catch (error) {
            console.error(`Failed to add data to ${path}:`, error);
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
                let slot = SM.getSlotById(event.slotId);
                if(slot){
                    slot.reorderComponent(event.fromIndex, event.toIndex);
                    if(SM.selectedSlot === slot.id){
                        renderProps();
                    }
                }
            } catch(e) {
                console.error("Failed to parse component_reordered event:", e);
            }
        }

        if(data.startsWith("update_slot")){ //`update_slot:${this.id}:${property}:${value}`;
            let str = data.slice(12)
            let nxtColon = str.indexOf(":")
            let slotId = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let prop = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let value = str.slice(nxtColon+1)
            let slot = SM.getSlotById(slotId);
            if(slot){
                await slot._set(prop, safeParse(value));
                inspector.hierarchyPanel.render()
                if(SM.selectedSlot === slot.id){
                    renderProps()
                }
            }
            SM.props[`__${slotId}/${prop}:slot`] = value
        }


        if(data.startsWith("update_component")){ // `update_component:${this.id}:${property}:${value}`;
            let str = data.slice(17)
            let nxtColon = str.indexOf(":")
            let componentId = str.slice(0, nxtColon)
            str = str.slice(nxtColon+1)
            nxtColon = str.indexOf(":")
            let prop = str.slice(0, nxtColon)
            let value = str.slice(nxtColon+1)
            let component = SM.getSlotComponentById(componentId);
            if(component){
                await component._setWithTimestamp(prop, safeParse(value), timestamp);
                if(SM.selectedSlot === component._slot.id){
                    renderProps()
                }
            }
            SM.props[`__${componentId}/${prop}:component`] = value
        }

        //update_monobehavior, update_component, update_slot
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
            let monobehavior = SM.getSlotComponentById(componentId);
            if(op === "vars"){
                monobehavior.ctx.vars[prop] = safeParse(value);
                if(SM.selectedSlot === monobehavior._slot.id){
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
       
        if(data.startsWith("load_slot")){
            let [parentId, slot_data] = data.slice(10).split("|");
            await SM._loadSlot(JSON.parse(slot_data), parentId);
            await SM.updateHierarchy(this.selectedSlot);
        }

        if(data.startsWith("component_added")){
            let event = JSON.parse(data.slice(16));
            let slot = SM.getSlotById(event.slotId);
            if(slot){
                await SM._addComponent(slot, event.componentType, event.componentProperties);
                await SM.updateHierarchy(this.selectedSlot);
            }
        }

        if(data.startsWith("component_removed")){
            let componentId = data.slice(18);
            let component = SM.getSlotComponentById(componentId);
            if(component){
                await component._destroy();
                await SM.updateHierarchy(this.selectedSlot);
            }
        }

        if(data.startsWith("slot_added")){
            let [parentId, slotName] = data.slice(11).split(":");
            await SM._addNewSlot(slotName, parentId);
            await SM.updateHierarchy(SM.selectedSlot);
        }

        if(data.startsWith("slot_removed")){
            let slotId = data.slice(13);
            let slot = SM.getSlotById(slotId);
            if(slot){
                await slot._destroy();
                await SM.updateHierarchy(this.selectedSlot);
            }
        }

        if(data.startsWith("slot_moved")){
            let [slotId, newParentId, newSiblingIndex] = data.slice(11).split(":");
            //newSiblingIndex = (newSiblingIndex)? parseInt(newSiblingIndex) : null;
            const slot = SM.getSlotById(slotId);
            if (!slot) return;
            if(!newParentId) newParentId = SM.slotData.slots[0].id;
            await slot._setParent(SM.getSlotById(newParentId));
            await SM.updateHierarchy(SM.selectedSlot);
        }

        if(data.startsWith("monobehavior_start")){
            let componentId = data.slice(19);
            let monobehavior = SM.getSlotComponentById(componentId);
            if(monobehavior){
                monobehavior._start();
            }
        }

        if(data.startsWith("monobehavior_stop")){
            let componentId = data.slice(18);
            let monobehavior = SM.getSlotComponentById(componentId);
            if(monobehavior){
                monobehavior._stop();
            }
        }

        if(data.startsWith("monobehavior_refresh")){
            let componentId = data.slice(21);
            let monobehavior = SM.getSlotComponentById(componentId);
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
        //console.log("sending one shot =>", data)
        let now = Date.now();
        let remote_message = `${now}:${SM.myName()}:${data}`
        SM.scene.OneShot(remote_message);
        await this.routeOneShot(data, now)
    }

}

export const networking = new Networking();
window.networking = networking;

// Debug function for testing Firebase Realtime Database
window.testFirebaseDB = async () => {
    console.log('Testing Firebase Realtime Database...');
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
        
        console.log('Adding test data...');
        const newRef = db.ref('test').push();
        await newRef.set(testData);
        console.log('✅ Data added with key:', newRef.key);
        
        // Test 2: Read it back
        console.log('Reading data...');
        const snapshot = await newRef.once('value');
        console.log('✅ Retrieved data:', snapshot.val());
        
        // Test 3: Update it
        console.log('Updating data...');
        await newRef.update({
            updated: true,
            updateTime: firebase.database.ServerValue.TIMESTAMP
        });
        console.log('✅ Data updated');
        
        // Test 4: List data
        console.log('Listing data...');
        const listSnapshot = await db.ref('test').limitToFirst(10).once('value');
        console.log('✅ Listed data:', listSnapshot.val());
        
        // Test 5: Delete
        console.log('Deleting data...');
        await newRef.remove();
        console.log('✅ Data deleted');
        
        return '✅ All Realtime Database tests passed!';
    } catch (error) {
        console.error('❌ Realtime Database test failed:', error);
        return error;
    }
};