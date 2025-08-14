const { initializeApp } = require('firebase/app');
const { getDatabase, ref, onValue } = require('firebase/database');
const fs = require('fs');
const path = require('path');

const config = require('./config.json');

const inventoryDirs = config.inventory_dirs;
const uid = config.uid;
const password = config.password;

// Ensure all inventory directories exist
const inventoryBasePath = './inventory';
if (!fs.existsSync(inventoryBasePath)) {
    fs.mkdirSync(inventoryBasePath, { recursive: true });
    console.log(`Created base inventory directory: ${inventoryBasePath}`);
}

inventoryDirs.forEach(dir => {
    const fullPath = path.join(inventoryBasePath, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created inventory directory: ${fullPath}`);
    }
});

// --- CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyBrWGOkEJ6YjFmhXqvujbtDjWII3udLpWs",
    authDomain: "inspector-6bad1.firebaseapp.com",
    projectId: "inspector-6bad1",
    storageBucket: "inspector-6bad1.firebasestorage.app",
    messagingSenderId: "565892382854",
    appId: "1:565892382854:web:06cc45d58cc0f0e3205107",
    measurementId: "G-3S4G5E0GVK",
    databaseURL: "https://inspector-6bad1-default-rtdb.firebaseio.com"
};

// --- INIT ---
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);



// SCENE SYNC
const sceneRef = ref(database, 'scenes/'+uid);
onValue(sceneRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Scene updated:', data);
}, (error) => {
    console.error('Error listening to database:', error);
});


// INVENTORY SYNC
inventoryDirs.forEach(dir => {
    let refPath = 'inventory/'+dir;
    console.log(`Listening to inventory: ${refPath}`);
    const inventoryRef = ref(database, refPath);
    onValue(inventoryRef, (snapshot) => {
        const data = snapshot.val();
        console.log(`Inventory updated: ${refPath}: ${data}`);
        Object.values(data).forEach((update) => {
            //console.log(update)
            if(update.itemType === "script"){
                let content = update.data;
                let dir = update.importedFrom;
                let name = update.name;
                const filePath = path.join('./', dir, name);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`updated (firebase)=>: ${filePath}: at ${new Date().toISOString()}`)
            }

            if(update.itemType === "entity"){
                console.log(update)
            }
        });
        
    }, (error) => {
        console.error('Error listening to database:', error);
    });
});



console.log('Linker service started, listening for database changes...');
