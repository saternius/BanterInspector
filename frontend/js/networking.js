const { appendToShell, parseBest } = await import(`${window.repoUrl}/utils.js`);
const {attachAuthToDatabase} = await import(`${window.repoUrl}/firebase-auth-helper.js`);

export class Networking {
    constructor(){
        this.db = null;
        this.storage = null;
        this.secret = this.getSecret();
        this.logs = [];
        this.spaceId = window.location.host.split(".")[0];
        this.state = {};
        this.varsListeners = new Map(); // Track vars listeners for cleanup
    }

    get host(){
        return this.state.vars.hostUser;
    }

    get amHost(){
        return this.state.vars.hostUser === SM.myName();
    }

    claimHost(){
        this.setVar("hostUser", SM.myName());
    }

    // New listener management methods for space-props
    onVarsChange(callback) {
        const varsRef = this.db.ref(`space/${this.spaceId}/vars`);
        varsRef.on('value', callback);
        this.varsListeners.set(callback, varsRef);
        return callback; // Return for easy removal
    }

    offVarsChange(callback) {
        if (this.varsListeners.has(callback)) {
            const ref = this.varsListeners.get(callback);
            ref.off('value', callback);
            this.varsListeners.delete(callback);
        }
    }

    // Granular listeners for performance optimization
    onVarAdded(callback) {
        const varsRef = this.db.ref(`space/${this.spaceId}/vars`);
        varsRef.on('child_added', callback);
        return { ref: varsRef, callback, event: 'child_added' };
    }

    onVarChanged(callback) {
        const varsRef = this.db.ref(`space/${this.spaceId}/vars`);
        varsRef.on('child_changed', callback);
        return { ref: varsRef, callback, event: 'child_changed' };
    }

    onVarRemoved(callback) {
        const varsRef = this.db.ref(`space/${this.spaceId}/vars`);
        varsRef.on('child_removed', callback);
        return { ref: varsRef, callback, event: 'child_removed' };
    }

    // Remove a specific listener
    removeListener(listenerInfo) {
        if (listenerInfo && listenerInfo.ref) {
            listenerInfo.ref.off(listenerInfo.event, listenerInfo.callback);
        }
    }

    // Helper to categorize vars (public vs protected)
    categorizeVars(vars = this.state.vars) {
        const result = { public: {}, protected: {} };
        Object.entries(vars || {}).forEach(([key, value]) => {
            if (key.startsWith('_')) {
                result.protected[key.substring(1)] = value;
            } else {
                result.public[key] = value;
            }
        });
        return result;
    }

    // Get all vars (snapshot)
    async getAllVars() {
        const snapshot = await this.db.ref(`space/${this.spaceId}/vars`).once('value');
        return snapshot.val() || {};
    }

    // Cleanup all listeners
    cleanupListeners() {
        this.varsListeners.forEach((ref, callback) => {
            ref.off('value', callback);
        });
        this.varsListeners.clear();
    }

    getSecret(){
        let secret = localStorage.getItem("secret");
        if(!secret){
            secret = Math.random().toString(36).substring(2, 15);
            localStorage.setItem("secret", secret);
        }
        return secret;
    }
    
    initFirebase(callback) {
        log("init", "initializing firebase")
        // Firebase configuration
        if(!window.FIREBASE_CONFIG){
            err("init", "Firebase configuration not found");
            return;
        }
        const firebaseConfig = window.FIREBASE_CONFIG;
        // Initialize Firebase only if not already initialized
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.database();
                this.storage = firebase.storage();

                let initFirebaseListeners = ()=>{
                    if(window.inventory && window.inventory.firebase){
                        window.inventory.firebase.setupFirebaseListeners()
                        attachAuthToDatabase(this)
                        const spaceRef = this.db.ref("space/"+this.spaceId);
                        spaceRef.once('value', (snapshot)=>{
                            let spaceState = snapshot.val();
                            if(!spaceState){
                                spaceState = {
                                    vars: {},
                                    People: {},
                                    components: {},
                                    scripts: {}
                                }
                                this.db.ref("space/"+this.spaceId).set(spaceState);
                            }else{
                                if(!spaceState.vars){
                                    spaceState.vars = {}
                                    this.db.ref("space/"+this.spaceId+"/vars").set({});
                                }
                                if(!spaceState.People){
                                    spaceState.People = {}
                                    this.db.ref("space/"+this.spaceId+"/People").set({});
                                }
                                if(!spaceState.components){
                                    spaceState.components = {}
                                    this.db.ref("space/"+this.spaceId+"/components").set({});
                                }
                                if(!spaceState.scripts){
                                    spaceState.scripts = {}
                                    this.db.ref("space/"+this.spaceId+"/scripts").set({});
                                }
                            }

                            this.state = spaceState;
                            callback(spaceState);
                        });
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



    async routeOneShot(data, timestamp, sender){
        let items = data.split("¶")

        if(items[0] === "runJS"){
            let code = items[1];
            log("runJS", code)
            new Function(code)();
            return;
        }

        if(data === "reset"){
            await SM._reset();
        }

        if(items[0] === "scriptrunner_start"){
            let componentId = items[1];
            let scriptrunner = SM.getEntityComponentById(componentId);
            if(scriptrunner){
                await scriptrunner._start();
            }
        }

        if(items[0] === "scriptrunner_stop"){
            let componentId = items[1];
            let scriptrunner = SM.getEntityComponentById(componentId);
            if(scriptrunner){
                await scriptrunner._stop();
            }
        }

        if(items[0] === "scriptrunner_refresh"){
            let componentId = items[1];
            let scriptrunner = SM.getEntityComponentById(componentId);
            if(scriptrunner){
                await scriptrunner._refresh();
            }
        }

        if(items[0] === "import"){
            let [path, minUpdateTime] = items.slice(1)
            await inventory.firebase.importFromFirebase(path, "", minUpdateTime);
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
        let firstColon = message.indexOf(":");
        let timestamp = parseInt(message.slice(0, firstColon));
        
        message = message.slice(firstColon+1);
        let secondColon = message.indexOf(":");
        let sender = message.slice(0, secondColon);
        
        if(sender === SM.myName()){
            return;
        }
      
        let data = message.slice(secondColon+1);
        appendToShell("oneShot", sender, data);
        await this.routeOneShot(data, timestamp, sender)
    }


    convertKeyToFirebaseKey(key){
        key = key.replace("$", "");
        key = key.replace(":", "/");
        if(key.startsWith("__")){
            key = "components/"+key.slice(2);
        }
        return key;
    }

    clearSpaceState(){
        this.state = {};
        this.db.ref("space/"+this.spaceId).remove();
    }

   
    getVar(key){
        return this.state.vars[key];
    }

    setVar(key, value, hostOnly){
        if(hostOnly && !this.amHost) return;
        this.state.vars[key] = value;
        let ref = this.db.ref("space/"+this.spaceId+"/vars/"+key);
        ref.set(value);
    }

    setScript(scriptName, scriptContent){
        // let ref = this.db.ref("space/"+this.spaceId+"/scripts/"+scriptName);
        // ref.set(scriptContent);
    }

    async SetScript(scriptName, scriptContent){
        // let ref = this.db.ref("space/"+this.spaceId+"/scripts/"+scriptName);
        // await ref.set(scriptContent);
    }

    async SetVar(key, value, hostOnly){ 
        if(hostOnly && !this.amHost) return;
        let ref = this.db.ref("space/"+this.spaceId+"/vars/"+key);
        await ref.set(value);
    }

    delVar(key, hostOnly){
        if(hostOnly && !this.amHost) return;
        delete this.state.vars[key];
        let ref = this.db.ref("space/"+this.spaceId+"/vars/"+key);
        ref.remove();
    }
    
    async DelVar(key, hostOnly){
        if(hostOnly && !this.amHost) return;
        let ref = this.db.ref("space/"+this.spaceId+"/vars/"+key);
        await ref.remove();
    }
  

    async sendOneShot(data){
        let now = Date.now();
        let name = SM.myName();
        let remote_message = `${now}:${name}:${data}`
        SM.scene.OneShot(remote_message);
        appendToShell("oneShot", name, data);
        await this.routeOneShot(data, now, name)
    }

    runJS(code){
        this.sendOneShot(`runJS¶${code}`);
    }
}

export const net = new Networking();
window.net = net;


// Debug function for testing Firebase Realtime Database
window.testFirebaseDB = async () => {
    log('net', 'Testing Firebase Realtime Database...');
    try {
        const db = net.getDatabase();
        
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