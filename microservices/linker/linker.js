const { initializeApp } = require('firebase/app');
const { getDatabase, ref, onValue, set, update } = require('firebase/database');
const { getAuth, signInAnonymously } = require('firebase/auth');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

// Helper for making HTTP requests (for Node versions without fetch)
async function makeRequest(url, options) {
    if (globalThis.fetch) {
        return globalThis.fetch(url, options);
    }
    
    // Fallback for older Node versions
    return new Promise((resolve, reject) => {
        const data = options.body;
        const req = http.request(url, {
            method: options.method,
            headers: options.headers
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ ok: res.statusCode === 200 }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

const config = require('./config.json');

const inventoryDirs = config.inventory_dirs;
const username = config.username;
const secret = config.secret;
const uid = config.uid || username; // Fallback to username if uid not provided

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
const auth = getAuth(app);

// Authentication state
let currentUser = null;
let isAuthenticated = false;

// Sanitize username for Firebase paths
function sanitizeUsername(str) {
    if (!str) return '';
    return str
        .trim()
        .replace(/[\.$#\[\]\/]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
}

// Authenticate with Firebase using anonymous auth
async function authenticate() {
    try {
        console.log('Authenticating with Firebase...');
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
        console.log(currentUser)
        isAuthenticated = true;
        console.log('✓ Authenticated successfully with UID:', currentUser.uid);
        console.log('✓ Using username:', username);
        console.log('✓ Secret configured:', secret ? 'Yes' : 'No');
        
        // Register custom claims with auth server
        await registerCustomClaims(currentUser.uid, username, secret);
        
        return currentUser;
    } catch (error) {
        console.error('✗ Authentication failed:', error.message);
        console.log('⚠ Running in read-only mode - writes will fail');
        return null;
    }
}

// Register custom claims with the auth server
async function registerCustomClaims(uid, username, secret) {
    try {
        console.log('Registering custom claims with auth server...');
        const response = await makeRequest(`${config.auth_server_url}/setclaims`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uid: uid,
                username: username,
                secret: secret
            })
        });

        if (response.ok) {
            console.log('✓ Custom claims registered for:', username);
        } else {
            console.log('⚠ Could not register custom claims (auth server may not be running)');
        }
    } catch (error) {
        console.log('⚠ Auth server not available - running without custom claims');
    }
}

// Initialize authentication before starting listeners
authenticate().then(() => {
    startListeners();
}).catch(err => {
    console.error('Failed to authenticate:', err);
    startListeners(); // Still start listeners for read operations
});



// Function to start all listeners after authentication
function startListeners() {
    console.log('Starting Firebase listeners...');
    
    // SCENE SYNC [TODO]
    // const sceneRef = ref(database, 'scenes/'+uid);
    // onValue(sceneRef, (snapshot) => {
    //     const data = snapshot.val();
    //     console.log('Scene updated:', data);
    // }, (error) => {
    //     console.error('Error listening to database:', error);
    // });


    // INVENTORY SYNC
    // Use sanitized username for inventory paths
    const sanitizedUsername = sanitizeUsername(username);
    
    inventoryDirs.forEach(dir => {
        let refPath = `inventory/${dir}`;
        console.log(`Listening to inventory: ${refPath}`);
        const inventoryRef = ref(database, refPath);
        console.log(refPath)
        onValue(inventoryRef, (snapshot) => {
            const data = snapshot.val();
            console.log(`Inventory updated: ${refPath}: ${data}`);
            if(!data) return;
            Object.values(data).forEach((update) => {
                console.log('update', update)
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

                if(update.itemType === "markdown"){
                    let content = update.data;
                    let dir = update.importedFrom || `inventory/${update.author}/${update.folder}`;
                    let name = update.name;
                    if(!name.endsWith(".md")){
                        name = name+".md";
                    }
                    const filePath = path.join('./', dir, name);
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`updated markdown (firebase)=>: ${filePath}: at ${new Date().toISOString()}`)
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
                console.log("\n\n\n")
            });
            
        }, (error) => {
            console.error('Error listening to database:', error);
        });
    });
} // End of startListeners function

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


console.log('Linker service started');
console.log('Configuration loaded:');
console.log('  - Username:', username || 'Not set');
console.log('  - Secret:', secret ? 'Configured' : 'Not configured');
console.log('  - Inventory dirs:', inventoryDirs.join(', '));

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

            // Check authentication before writing
            if (!isAuthenticated) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Not authenticated', 
                    message: 'Linker is not authenticated with Firebase. Check config.json for username/secret.'
                }));
                return;
            }

            // Read file content
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);

            // Build the correct Firebase path using authenticated username
            const sanitizedUsername = sanitizeUsername(username);
            const filePathParts = path.relative('./inventory', filePath).split(path.sep);
            const firebasePath = `inventory/${filePathParts.map(sanitizeFirebasePath).join('/')}`;

            // Determine item type based on file extension
            const fileExt = path.extname(filePath).toLowerCase();
            let itemType, icon;
            
            if (fileExt === '.json') {
                itemType = 'entity';
                icon = '📦';
            } else if (fileExt === '.md') {
                itemType = 'markdown';
                icon = '📝';
            } else {
                itemType = 'script';
                icon = '📜';
            }

            let updateData;
            let updateRef = ref(database, firebasePath);
           

            if (itemType === 'script' || itemType === 'markdown') {
                // For scripts and markdown, preserve item structure and update data
                updateData = {
                    author: username,
                    name: fileName,
                    last_used: Date.now(),
                    data: content,
                    itemType: itemType
                };
                
                // Use update() to merge only the provided fields
                update(updateRef, updateData)
                    .then((event) => {
                        const typeLabel = itemType === 'markdown' ? 'Markdown' : 'Script';
                        console.log(`${typeLabel} updated in Firebase: ${firebasePath}`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: `${typeLabel} updated in Firebase`,
                            itemType: itemType,
                            icon: icon,
                            firebasePath: firebasePath
                        }));
                    })
                    .catch((error) => {
                        const typeLabel = itemType === 'markdown' ? 'markdown' : 'script';
                        console.error(`Error updating ${typeLabel} in Firebase:`, error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: `Failed to update ${typeLabel} in Firebase`, details: error.message }));
                    });
            } else {
                // For entities, parse JSON and set the entire reference
                try {
                    const jsonData = JSON.parse(content);
                    updateData = jsonData;
                    
                    // Use update() to merge only the provided fields
                    update(updateRef, updateData)
                        .then(() => {
                            console.log(`Entity updated in Firebase: ${firebasePath}`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ 
                                success: true, 
                                message: 'Entity updated in Firebase',
                                itemType: itemType,
                                icon: icon,
                                firebasePath: firebasePath
                            }));
                        })
                        .catch((error) => {
                            console.error('Error updating entity in Firebase:', error);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to update entity in Firebase', details: error.message }));
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
