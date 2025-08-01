let localhost = window.location.hostname === 'localhost'
let basePath = localhost ? '.' : `${window.repoUrl}/js`;

// Firestore REST API wrapper to bypass WebChannel issues
class FirestoreREST {
    constructor(projectId) {
        this.projectId = projectId;
        this.baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    }
    
    // Helper to convert JS object to Firestore document format
    toFirestoreDocument(data) {
        const doc = { fields: {} };
        
        for (const [key, value] of Object.entries(data)) {
            if (value === null) {
                doc.fields[key] = { nullValue: null };
            } else if (typeof value === 'boolean') {
                doc.fields[key] = { booleanValue: value };
            } else if (typeof value === 'number') {
                if (Number.isInteger(value)) {
                    doc.fields[key] = { integerValue: value.toString() };
                } else {
                    doc.fields[key] = { doubleValue: value };
                }
            } else if (typeof value === 'string') {
                doc.fields[key] = { stringValue: value };
            } else if (value instanceof Date) {
                doc.fields[key] = { timestampValue: value.toISOString() };
            } else if (Array.isArray(value)) {
                doc.fields[key] = { 
                    arrayValue: { 
                        values: value.map(v => this.toFirestoreValue(v)) 
                    } 
                };
            } else if (typeof value === 'object') {
                doc.fields[key] = { 
                    mapValue: { 
                        fields: this.toFirestoreDocument(value).fields 
                    } 
                };
            }
        }
        
        return doc;
    }
    
    // Helper to convert single value to Firestore format
    toFirestoreValue(value) {
        if (value === null) return { nullValue: null };
        if (typeof value === 'boolean') return { booleanValue: value };
        if (typeof value === 'number') {
            return Number.isInteger(value) 
                ? { integerValue: value.toString() }
                : { doubleValue: value };
        }
        if (typeof value === 'string') return { stringValue: value };
        if (value instanceof Date) return { timestampValue: value.toISOString() };
        if (Array.isArray(value)) {
            return { arrayValue: { values: value.map(v => this.toFirestoreValue(v)) } };
        }
        if (typeof value === 'object') {
            return { mapValue: { fields: this.toFirestoreDocument(value).fields } };
        }
        return { stringValue: String(value) };
    }
    
    // Helper to convert Firestore document to JS object
    fromFirestoreDocument(doc) {
        if (!doc.fields) return {};
        
        const result = {};
        for (const [key, value] of Object.entries(doc.fields)) {
            result[key] = this.fromFirestoreValue(value);
        }
        return result;
    }
    
    // Helper to convert Firestore value to JS
    fromFirestoreValue(value) {
        if ('nullValue' in value) return null;
        if ('booleanValue' in value) return value.booleanValue;
        if ('integerValue' in value) return parseInt(value.integerValue);
        if ('doubleValue' in value) return value.doubleValue;
        if ('stringValue' in value) return value.stringValue;
        if ('timestampValue' in value) return new Date(value.timestampValue);
        if ('arrayValue' in value) {
            return (value.arrayValue.values || []).map(v => this.fromFirestoreValue(v));
        }
        if ('mapValue' in value) {
            return this.fromFirestoreDocument({ fields: value.mapValue.fields });
        }
        return null;
    }
    
    // Create or update a document
    async setDocument(collectionPath, documentId, data) {
        const url = `${this.baseUrl}/${collectionPath}/${documentId}`;
        const firestoreDoc = this.toFirestoreDocument({
            ...data,
            updatedAt: new Date().toISOString()
        });
        
        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(firestoreDoc)
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Firestore REST error: ${response.status} - ${error}`);
            }
            
            const result = await response.json();
            return {
                id: documentId,
                ...this.fromFirestoreDocument(result)
            };
        } catch (error) {
            console.error('REST API setDocument error:', error);
            throw error;
        }
    }
    
    // Get a document
    async getDocument(collectionPath, documentId) {
        const url = `${this.baseUrl}/${collectionPath}/${documentId}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.status === 404) {
                return null;
            }
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Firestore REST error: ${response.status} - ${error}`);
            }
            
            const result = await response.json();
            return {
                id: documentId,
                ...this.fromFirestoreDocument(result)
            };
        } catch (error) {
            console.error('REST API getDocument error:', error);
            throw error;
        }
    }
    
    // Delete a document
    async deleteDocument(collectionPath, documentId) {
        const url = `${this.baseUrl}/${collectionPath}/${documentId}`;
        
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok && response.status !== 404) {
                const error = await response.text();
                throw new Error(`Firestore REST error: ${response.status} - ${error}`);
            }
            
            return true;
        } catch (error) {
            console.error('REST API deleteDocument error:', error);
            throw error;
        }
    }
    
    // List documents in a collection
    async listDocuments(collectionPath, options = {}) {
        const { limit = 50, orderBy, startAfter } = options;
        let url = `${this.baseUrl}/${collectionPath}`;
        
        const params = new URLSearchParams();
        if (limit) params.append('pageSize', limit.toString());
        if (orderBy) params.append('orderBy', orderBy);
        if (startAfter) params.append('pageToken', startAfter);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Firestore REST error: ${response.status} - ${error}`);
            }
            
            const result = await response.json();
            const documents = (result.documents || []).map(doc => {
                const pathParts = doc.name.split('/');
                const id = pathParts[pathParts.length - 1];
                return {
                    id,
                    ...this.fromFirestoreDocument(doc)
                };
            });
            
            return {
                documents,
                nextPageToken: result.nextPageToken
            };
        } catch (error) {
            console.error('REST API listDocuments error:', error);
            throw error;
        }
    }
    
    // List all subcollections across multiple parent documents
    async listAllSubcollections(parentPath, subcollectionName, options = {}) {
        const { limit = 50 } = options;
        const allDocuments = [];
        
        try {
            // First, get all parent documents
            const parentResult = await this.listDocuments(parentPath, { limit: 1000 });
            
            // Then, for each parent, get its subcollection documents
            for (const parent of parentResult.documents) {
                const subcollectionPath = `${parentPath}/${parent.id}/${subcollectionName}`;
                const subResult = await this.listDocuments(subcollectionPath, { limit });
                
                // Add parent reference to each document
                subResult.documents.forEach(doc => {
                    doc.parentId = parent.id;
                });
                
                allDocuments.push(...subResult.documents);
            }
            
            // Sort by creation date (newest first)
            allDocuments.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.timestamp);
                const dateB = new Date(b.createdAt || b.timestamp);
                return dateB - dateA;
            });
            
            return allDocuments;
        } catch (error) {
            console.error('REST API listAllSubcollections error:', error);
            throw error;
        }
    }
    
    // Create a document with auto-generated ID
    async addDocument(collectionPath, data) {
        // Generate a client-side ID
        const documentId = this.generateDocumentId();
        return await this.setDocument(collectionPath, documentId, data);
    }
    
    // Generate a Firestore-like document ID
    generateDocumentId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 20; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
}

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
        this.restClient = null;
        // Delay Firebase initialization to ensure all dependencies are loaded
        setTimeout(() => this.initFirebase(), 1000);
    }
    
    initFirebase() {
        // Firebase configuration
        const firebaseConfig = window.FIREBASE_CONFIG || {
            apiKey: "AIzaSyBrWGOkEJ6YjFmhXqvujbtDjWII3udLpWs",
            authDomain: "inspector-6bad1.firebaseapp.com",
            projectId: "inspector-6bad1",
            storageBucket: "inspector-6bad1.firebasestorage.app",
            messagingSenderId: "565892382854",
            appId: "1:565892382854:web:06cc45d58cc0f0e3205107",
            measurementId: "G-3S4G5E0GVK"
        };
        
        // Initialize REST client
        this.restClient = new FirestoreREST(firebaseConfig.projectId);
        console.log('Firestore REST client initialized');
        
        // Initialize Firebase only if not already initialized
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.firestore();
                
                // Enable offline persistence for better reliability
                this.db.enablePersistence({ synchronizeTabs: true })
                    .catch((err) => {
                        if (err.code === 'failed-precondition') {
                            console.warn('Firestore persistence failed: Multiple tabs open');
                        } else if (err.code === 'unimplemented') {
                            console.warn('Firestore persistence not available');
                        }
                    });
                
                console.log('Firebase SDK initialized (but using REST API instead)');
                
                // Test the REST connection instead
                this.testRestConnection();
            } catch (error) {
                console.error('Failed to initialize Firebase:', error);
            }
        }
    }
    
    async testRestConnection() {
        try {
            console.log('Testing Firestore REST API connection...');
            
            // Try a simple operation with REST API
            const testDoc = await this.restClient.setDocument('test', 'connection-test', {
                timestamp: new Date().toISOString(),
                test: true,
                message: 'REST API connection test'
            });
            
            console.log('REST API write successful:', testDoc);
            
            // Try to read it back
            const readDoc = await this.restClient.getDocument('test', 'connection-test');
            console.log('REST API read successful:', readDoc);
            
            // Clean up
            await this.restClient.deleteDocument('test', 'connection-test');
            console.log('REST API delete successful');
            
            console.log('✅ Firestore REST API is working correctly!');
            
        } catch (error) {
            console.error('REST API connection test failed:', error);
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
    
    getFirestore() {
        if (!this.db && typeof firebase !== 'undefined') {
            this.db = firebase.firestore();
        }
        return this.db;
    }
    
    // Get the REST client instead of SDK
    getFirestoreREST() {
        if (!this.restClient) {
            const projectId = window.FIREBASE_CONFIG?.projectId || 'inspector-6bad1';
            this.restClient = new FirestoreREST(projectId);
        }
        return this.restClient;
    }
    
    // Generic Firestore operations for future use
    async addDocument(collection, data) {
        if (!this.db) {
            console.error('Firestore not initialized when calling addDocument');
            throw new Error('Firestore not initialized');
        }
        
        try {
            console.log(`Adding document to collection: ${collection}`, data);
            const docRef = await this.db.collection(collection).add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Document added successfully with ID:', docRef.id);
            return docRef;
        } catch (error) {
            console.error(`Failed to add document to ${collection}:`, error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            throw error;
        }
    }
    
    async setDocument(collection, docId, data) {
        if (!this.db) throw new Error('Firestore not initialized');
        return await this.db.collection(collection).doc(docId).set(data);
    }
    
    async getDocument(collection, docId) {
        if (!this.db) throw new Error('Firestore not initialized');
        const doc = await this.db.collection(collection).doc(docId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    
    async queryDocuments(collection, queries = [], orderBy = null, limit = 50) {
        if (!this.db) throw new Error('Firestore not initialized');
        let query = this.db.collection(collection);
        
        // Apply query conditions
        queries.forEach(q => {
            query = query.where(q.field, q.operator, q.value);
        });
        
        // Apply ordering
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
        }
        
        // Apply limit
        if (limit) {
            query = query.limit(limit);
        }
        
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    async updateDocument(collection, docId, updates) {
        if (!this.db) throw new Error('Firestore not initialized');
        return await this.db.collection(collection).doc(docId).update(updates);
    }
    
    async deleteDocument(collection, docId) {
        if (!this.db) throw new Error('Firestore not initialized');
        return await this.db.collection(collection).doc(docId).delete();
    }

    handleSpaceStateChange(event) {
        const { changes } = event.detail;
        changes.forEach(async (change) => {
            let { property, newValue, isProtected } = change;
            newValue = JSON.parse(newValue);
            if (isProtected) {
                SM.scene.spaceState.protected[property] = newValue;
            } else {
                SM.scene.spaceState.public[property] = newValue;
            }
        });
    }

    async routeOneShot(data, timestamp){

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
            window.location.reload();
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

        if(SM.saveMethod === "aggressive"){
            SM.saveScene();
        }
    }

    async handleOneShot(event){
        //console.log("handleOneShot =>", event)
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
        await this.routeOneShot(data, timestamp)
    }


    async setSpaceProperty(key, value, isProtected) {
        if (!SM.scene) return;
        value = JSON.stringify(value);

        if (isProtected) {
            SM.scene.SetProtectedSpaceProps({ [key]: value });
            SM.scene.spaceState.protected[key] = value;
        } else {
            SM.scene.SetPublicSpaceProps({ [key]: value });
            SM.scene.spaceState.public[key] = value;
        }
        
        if(localhost){
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
        // if(localhost){
        //     localStorage.setItem('lastSpaceState', JSON.stringify(this.scene.spaceState));
        // }
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

// Debug function for testing Firestore REST API
window.testFirestoreREST = async () => {
    console.log('Testing Firestore REST API...');
    try {
        const rest = networking.getFirestoreREST();
        
        // Test 1: Add a document
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Test document from REST API',
            number: 42,
            boolean: true,
            array: ['item1', 'item2'],
            nested: { key: 'value' }
        };
        
        console.log('Adding test document...');
        const result = await rest.addDocument('test', testData);
        console.log('✅ Document added:', result);
        
        // Test 2: Read it back
        console.log('Reading document...');
        const doc = await rest.getDocument('test', result.id);
        console.log('✅ Retrieved document:', doc);
        
        // Test 3: Update it
        console.log('Updating document...');
        const updated = await rest.setDocument('test', result.id, {
            ...doc,
            updated: true,
            updateTime: new Date().toISOString()
        });
        console.log('✅ Updated document:', updated);
        
        // Test 4: List documents
        console.log('Listing documents...');
        const list = await rest.listDocuments('test', { limit: 10 });
        console.log('✅ Listed documents:', list);
        
        // Test 5: Delete
        console.log('Deleting document...');
        await rest.deleteDocument('test', result.id);
        console.log('✅ Document deleted');
        
        return '✅ All REST API tests passed!';
    } catch (error) {
        console.error('❌ REST API test failed:', error);
        return error;
    }
};