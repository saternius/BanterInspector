const { initializeApp } = require('firebase/app');
const { getDatabase, ref, onValue, set, update } = require('firebase/database');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

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
                let dir = update.importedFrom || `inventory/${update.author}/${update.folder}`;
                let name = update.name;
                if(!name.endsWith(".js")){
                    name = name+".js";
                }
                const filePath = path.join('./', dir, name);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`updated script (firebase)=>: ${filePath}: at ${new Date().toISOString()}`)
            }

            if(update.itemType === "entity"){
                console.log(update)
                let content = update;
                let dir = update.importedFrom || `inventory/${update.author}/${update.folder}`;
                let name = update.name;
                if(!name.endsWith(".json")){
                    name = name+".json";
                }
                const filePath = path.join('./', dir, name);
                fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
                console.log(`updated entity (firebase)=>: ${filePath}: at ${new Date().toISOString()}`)
            }
        });
        
    }, (error) => {
        console.error('Error listening to database:', error);
    });
});


function sanitizeFirebasePath(str) {
    if (!str) return '';
    
    // Replace invalid characters with underscores
    return str
        .trim()
        .replace(/[\.\$#\[\]\/]/g, '_')
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}


console.log('Linker service started, listening for database changes...');

// --- WEBSERVER ---
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    if (req.method === 'GET' && pathname === '/save') {
        const filePath = query.file;
        
        if (!filePath) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing file parameter' }));
            return;
        }

        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'File not found', file: filePath }));
                return;
            }

            // Read file content
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            const dirName = path.dirname(filePath);

            // Determine the inventory directory this file belongs to
            const relativePath = path.relative('./', filePath).split("/").map(sanitizeFirebasePath).join("/");

            // Determine item type based on file extension
            const isJsonFile = path.extname(filePath).toLowerCase() === '.json';
            const itemType = isJsonFile ? 'entity' : 'script';
            const icon = isJsonFile ? '📦' : '📜';

            let updateData;
            let updateRef = ref(database, relativePath);
           

            if (itemType === 'script') {
                // For scripts, update last_used timestamp and data
                updateData = {
                    last_used: Date.now(),
                    data: content
                };
                
                // Use update() to preserve existing fields
                update(updateRef, updateData)
                    .then(() => {
                        console.log(`Script updated in Firebase: ${relativePath}`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: 'Script updated in Firebase',
                            itemType: itemType,
                            icon: icon,
                            firebasePath: relativePath
                        }));
                    })
                    .catch((error) => {
                        console.error('Error updating script in Firebase:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to update script in Firebase', details: error.message }));
                    });
            } else {
                // For entities, parse JSON and set the entire reference
                try {
                    const jsonData = JSON.parse(content);
                    updateData = jsonData;
                    
                    // Use set() to completely replace the reference
                    set(updateRef, updateData)
                        .then(() => {
                            console.log(`Entity set in Firebase: ${relativePath}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ 
                                success: true, 
                                message: 'Entity set in Firebase',
                                itemType: itemType,
                                icon: icon,
                                firebasePath: relativePath
                            }));
                        })
                        .catch((error) => {
                            console.error('Error setting entity in Firebase:', error);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to set entity in Firebase', details: error.message }));
                        });
                } catch (jsonError) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON file', details: jsonError.message }));
                    return;
                }
            }

        } catch (error) {
            console.error('Error processing file:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
    console.log(`Webserver started on port ${PORT}`);
    console.log(`Save endpoint available at: http://localhost:${PORT}/save?file=<filepath>`);
});
