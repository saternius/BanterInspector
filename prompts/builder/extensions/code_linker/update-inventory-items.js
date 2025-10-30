const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update } = require('firebase/database');
const { getAuth, signInAnonymously } = require('firebase/auth');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Helper for making HTTP requests
async function makeRequest(url, options) {
    if (globalThis.fetch) {
        return globalThis.fetch(url, options);
    }

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

// Load config
const config = require('./config.json');
const inventoryDirs = config.inventory_dirs;
const username = config.username;
const secret = config.secret;

// Firebase config
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

let isAuthenticated = false;
let currentUser = null;

// Sanitize functions
function sanitizeUsername(str) {
    if (!str) return '';
    return str
        .trim()
        .replace(/[\.$#\[\]\/]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
}

function sanitizeFirebasePath(str) {
    if (!str) return '';
    return str
        .trim()
        .replace(/[\.$#\[\]\/]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
}

// Register custom claims with auth server
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

// Authenticate with Firebase
async function authenticate() {
    try {
        console.log('Authenticating with Firebase...');
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
        isAuthenticated = true;
        console.log('✓ Authenticated successfully with UID:', currentUser.uid);
        console.log('✓ Using username:', username);

        await registerCustomClaims(currentUser.uid, username, secret);

        return currentUser;
    } catch (error) {
        console.error('✗ Authentication failed:', error.message);
        console.log('⚠ Running in read-only mode - writes will fail');
        return null;
    }
}

// Component name mapping (BanterX -> simplified)
const componentNameMap = {
    'BanterGeometry': 'Geometry',
    'BanterMaterial': 'Material',
    'BanterRigidbody': 'Rigidbody',
    'BanterAudioSource': 'AudioSource',
    'BanterVideoPlayer': 'VideoPlayer',
    'BanterText': 'Text',
    'BanterBillboard': 'Billboard',
    'BanterGrabHandle': 'GrabHandle',
    'BanterSyncedObject': 'SyncedObject',
    'BanterPhysicMaterial': 'PhysicMaterial',
    'BanterMirror': 'Mirror',
    'BanterBrowser': 'Browser',
    'BanterHeldEvents': 'HeldEvents',
    'BanterAttachedObject': 'AttachedObject',
    'BanterGLTF': 'GLTF',
    'BanterAssetBundle': 'AssetBundle',
    'BanterPortal': 'Portal',
    'BanterColliderEvents': 'ColliderEvents',
    'BanterBox': 'Box',
    'BanterCircle': 'Circle',
    'BanterCone': 'Cone',
    'BanterCylinder': 'Cylinder',
    'BanterPlane': 'Plane',
    'BanterRing': 'Ring',
    'BanterSphere': 'Sphere',
    'BanterTorus': 'Torus',
    'BanterInvertedMesh': 'InvertedMesh',
    'BanterKitItem': 'KitItem',
    'BanterStreetView': 'StreetView',
    'BanterWorldObject': 'WorldObject',
    'BanterGrabbable': 'Grabbable',
    'BanterUIPanel': 'UIPanel',
    'BanterAvatarPedestal': 'AvatarPedestal',
    'BanterTorusKnot': 'TorusKnot',
    'BanterApple': 'Apple',
    'BanterCatenoid': 'Catenoid',
    'BanterFermet': 'Fermet',
    'BanterHelicoid': 'Helicoid',
    'BanterHorn': 'Horn',
    'BanterKlein': 'Klein',
    'BanterMobius': 'Mobius',
    'BanterMobius3d': 'Mobius3d',
    'BanterNatica': 'Natica',
    'BanterPillow': 'Pillow',
    'BanterScherk': 'Scherk',
    'BanterSnail': 'Snail',
    'BanterSpiral': 'Spiral',
    'BanterSpring': 'Spring'
};

// Check if entity has old format (Transform as component with options)
function hasOldFormat(entityData) {
    if (!entityData) return false;
    const checkEntity = (entity) => {
        if (entity.components && entity.components.some(c =>
            c.options !== undefined || c.type === 'Transform'
        )) {
            return true;
        }
        if (entity.children && entity.children.some(child => checkEntity(child))) {
            return true;
        }
        return false;
    };
    return checkEntity(entityData);
}

// Check if entity has BanterX component names
function hasBanterNames(entityData) {
    if (!entityData || !entityData.components) return false;
    const checkEntity = (entity) => {
        if (entity.components && entity.components.some(c => c.type && c.type.startsWith('Banter'))) {
            return true;
        }
        if (entity.children && entity.children.some(child => checkEntity(child))) {
            return true;
        }
        return false;
    };
    return checkEntity(entityData);
}

// Check if entity has spaceProps (at entity level or component level)
function hasSpaceProps(entityData) {
    if (!entityData) return false;
    const checkEntity = (entity) => {
        // Check at entity level
        if (entity.spaceProps !== undefined) {
            return true;
        }
        // Check in components
        if (entity.components && entity.components.some(c => c.spaceProps !== undefined)) {
            return true;
        }
        // Check in children
        if (entity.children && entity.children.some(child => checkEntity(child))) {
            return true;
        }
        return false;
    };
    return checkEntity(entityData);
}

// Convert entity from old format to new format
function convertEntityToNewFormat(entityData) {
    if (!entityData) return null;

    const convertEntity = (entity) => {
        // Check if this specific entity node needs conversion
        const entityHasOldFormat = entity.components && entity.components.some(c =>
            c.options !== undefined || c.type === 'Transform'
        );

        if (entityHasOldFormat && entity.components) {
            // Find and extract Transform component data
            let transformComponent = entity.components.find(c => c.type === 'Transform');
            let transformData = null;

            if (transformComponent) {
                transformData = {
                    localPosition: transformComponent.properties?.localPosition || { x: 0, y: 0, z: 0 },
                    localRotation: transformComponent.properties?.localRotation || { x: 0, y: 0, z: 0, w: 1 },
                    localScale: transformComponent.properties?.localScale || { x: 1, y: 1, z: 1 }
                };
            }

            // Remove Transform from components
            entity.components = entity.components.filter(comp => comp.type !== 'Transform');

            // Add transform data at entity level
            if (transformData) {
                entity.transform = transformData;
            }
        }

        // Recursively convert children
        if (entity.children && Array.isArray(entity.children)) {
            entity.children = entity.children.map(child => convertEntity(child));
        }

        return entity;
    };

    return convertEntity(JSON.parse(JSON.stringify(entityData)));
}

// Update component names from BanterX to simplified
function updateComponentNames(entityData) {
    if (!entityData) return null;

    const updateEntity = (entity) => {
        let needsUpdate = false;

        // Update component type names
        if (entity.components && Array.isArray(entity.components)) {
            entity.components = entity.components.map(comp => {
                if (componentNameMap[comp.type]) {
                    comp.type = componentNameMap[comp.type];
                    needsUpdate = true;
                }
                return comp;
            });
        }

        // Recursively update children
        if (entity.children && Array.isArray(entity.children)) {
            entity.children = entity.children.map(child => updateEntity(child));
        }

        return entity;
    };

    return updateEntity(JSON.parse(JSON.stringify(entityData)));
}

// Remove spaceProps from entity tree (both entity level and component level)
function removeSpaceProps(entityData) {
    if (!entityData) return entityData;

    const cleanEntity = (entity) => {
        // Remove spaceProps property at entity level
        if (entity.spaceProps !== undefined) {
            delete entity.spaceProps;
        }

        // Remove spaceProps from components
        if (entity.components && Array.isArray(entity.components)) {
            entity.components = entity.components.map(comp => {
                if (comp.spaceProps !== undefined) {
                    delete comp.spaceProps;
                }
                return comp;
            });
        }

        // Recursively clean children
        if (entity.children && Array.isArray(entity.children)) {
            entity.children = entity.children.map(child => cleanEntity(child));
        }

        return entity;
    };

    return cleanEntity(JSON.parse(JSON.stringify(entityData)));
}

// Process a single JSON file
async function processJsonFile(filePath, dryRun = false) {
    try {
        // Read file
        const content = fs.readFileSync(filePath, 'utf8');
        const item = JSON.parse(content);

        // Only process entity items
        if (item.itemType !== 'entity') {
            return { processed: false, reason: 'Not an entity item' };
        }

        let needsUpdate = false;
        let updates = [];

        // Check and apply transformations
        if (hasOldFormat(item.data)) {
            item.data = convertEntityToNewFormat(item.data);
            needsUpdate = true;
            updates.push('converted old format');
        }

        if (hasBanterNames(item.data)) {
            item.data = updateComponentNames(item.data);
            needsUpdate = true;
            updates.push('updated component names');
        }

        if (hasSpaceProps(item.data)) {
            item.data = removeSpaceProps(item.data);
            needsUpdate = true;
            updates.push('removed spaceProps');
        }

        if (!needsUpdate) {
            return { processed: false, reason: 'Already up to date' };
        }

        if (dryRun) {
            return {
                processed: true,
                dryRun: true,
                updates: updates,
                filePath: filePath
            };
        }

        // Write updated file
        fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf8');

        // Sync to Firebase if authenticated
        if (isAuthenticated) {
            const relativePath = path.relative('./inventory', filePath);
            const pathParts = relativePath.split(path.sep);

            // Remove .json extension from the last part (filename) for Firebase path
            const fileNameWithoutExt = path.basename(filePath, '.json');
            const dirParts = pathParts.slice(0, -1);

            // Build Firebase path: inventory/author/folder/filename (without .json)
            const firebasePath = `inventory/${[...dirParts, fileNameWithoutExt].map(sanitizeFirebasePath).join('/')}`;

            const updateRef = ref(database, firebasePath);
            await update(updateRef, item);

            return {
                processed: true,
                updates: updates,
                filePath: filePath,
                firebasePath: firebasePath,
                synced: true
            };
        }

        return {
            processed: true,
            updates: updates,
            filePath: filePath,
            synced: false,
            reason: 'Not authenticated'
        };

    } catch (error) {
        return {
            processed: false,
            error: error.message,
            filePath: filePath
        };
    }
}

// Recursively find all .json files in a directory
function findJsonFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            results = results.concat(findJsonFiles(filePath));
        } else if (path.extname(file).toLowerCase() === '.json') {
            results.push(filePath);
        }
    });

    return results;
}

// Main function
async function main() {
    console.log('='.repeat(60));
    console.log('Inventory Items Update Script');
    console.log('='.repeat(60));
    console.log('');

    // Check for dry-run flag
    const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made');
        console.log('');
    }

    // Check for force-sync flag
    const forceSync = process.argv.includes('--force-sync') || process.argv.includes('-f');
    if (forceSync) {
        console.log('🔄 FORCE SYNC MODE - All entity files will be synced to Firebase');
        console.log('');
    }

    // Authenticate
    await authenticate();
    console.log('');

    // Find all JSON files
    const inventoryBasePath = './inventory';
    console.log('Scanning for JSON files...');
    const jsonFiles = findJsonFiles(inventoryBasePath);
    console.log(`Found ${jsonFiles.length} JSON files`);
    console.log('');

    // Process each file
    const results = {
        total: jsonFiles.length,
        processed: 0,
        skipped: 0,
        errors: 0,
        synced: 0
    };

    console.log('Processing files...');
    console.log('-'.repeat(60));

    for (const filePath of jsonFiles) {
        const relativePath = path.relative(inventoryBasePath, filePath);
        process.stdout.write(`Processing ${relativePath}... `);

        const result = await processJsonFile(filePath, dryRun);

        // Force sync even if file didn't need updates
        if (forceSync && !result.processed && result.reason === 'Already up to date' && !dryRun) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const item = JSON.parse(content);

                if (item.itemType === 'entity' && isAuthenticated) {
                    const relPath = path.relative('./inventory', filePath);
                    const pathParts = relPath.split(path.sep);
                    const fileNameWithoutExt = path.basename(filePath, '.json');
                    const dirParts = pathParts.slice(0, -1);
                    const firebasePath = `inventory/${[...dirParts, fileNameWithoutExt].map(sanitizeFirebasePath).join('/')}`;

                    const updateRef = ref(database, firebasePath);
                    await update(updateRef, item);

                    results.synced++;
                    console.log(`✓ Force synced to Firebase`);
                    console.log(`  → Synced to: ${firebasePath}`);
                    continue;
                }
            } catch (error) {
                console.log(`✗ Force sync failed: ${error.message}`);
                results.errors++;
                continue;
            }
        }

        if (result.processed) {
            results.processed++;
            if (result.synced) {
                results.synced++;
            }
            console.log(`✓ ${result.updates.join(', ')}`);
            if (result.firebasePath) {
                console.log(`  → Synced to: ${result.firebasePath}`);
            }
        } else if (result.error) {
            results.errors++;
            console.log(`✗ Error: ${result.error}`);
        } else {
            results.skipped++;
            console.log(`○ ${result.reason}`);
        }
    }

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Total files:      ${results.total}`);
    console.log(`Processed:        ${results.processed} (${dryRun ? 'would be updated' : 'updated'})`);
    console.log(`Skipped:          ${results.skipped}`);
    console.log(`Errors:           ${results.errors}`);
    if (isAuthenticated && !dryRun) {
        console.log(`Synced to Firebase: ${results.synced}`);
    }
    console.log('');

    if (dryRun) {
        console.log('To apply these changes, run without --dry-run flag');
    }

    process.exit(0);
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
