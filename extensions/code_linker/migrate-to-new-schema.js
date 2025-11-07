#!/usr/bin/env node

/**
 * Migrate Inventory Items to New Firebase-Optimized Schema
 *
 * Transforms from nested component structure to:
 * - Entities as nested hierarchy with __meta
 * - Components as flat lookup table by ID
 * - References via component IDs in entity.__meta.components
 *
 * Usage:
 *   node migrate-to-new-schema.js [--dry-run] [--force-sync]
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getDatabase, ref, update } = require('firebase/database');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const forceSync = args.includes('--force-sync');

// Load config
const config = require('./config.json');
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

async function authenticateFirebase() {
    try {
        console.log('\nAuthenticating with Firebase...');

        // Sign in anonymously
        const userCredential = await signInAnonymously(auth);
        const currentUser = userCredential.user;

        // Register custom claims
        const response = await fetch(`${config.auth_server_url}/setclaims`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: currentUser.uid,
                username: username,
                secret: secret
            })
        });

        if (!response.ok) {
            throw new Error(`Auth server returned ${response.status}`);
        }

        console.log('✓ Authenticated successfully');
        console.log(`✓ Using username: ${username}`);
        isAuthenticated = true;

    } catch (error) {
        console.error('✗ Authentication failed:', error.message);
        console.log('  → Will update local files only (no Firebase sync)');
        isAuthenticated = false;
    }
}

function sanitizeFirebasePath(part) {
    return part.replace(/[.#$\[\]\/]/g, '_');
}

/**
 * Generate a unique component ID based on type and index
 */
function generateComponentId(type, existingIds) {
    let id;
    let counter = Math.floor(Math.random() * 10000);
    do {
        id = `${type}_${counter}`;
        counter++;
    } while (existingIds.has(id));
    return id;
}

/**
 * Convert old schema entity to new schema
 *
 * Old: {
 *   name: "Entity",
 *   children: [{...}],
 *   components: [{type, properties}],
 *   transform: {...}
 * }
 *
 * New: {
 *   Entity: {
 *     ChildName: {...},
 *     __meta: {
 *       components: {componentId: true},
 *       localPosition, localRotation, etc
 *     }
 *   },
 *   Components: {
 *     componentId: {properties}
 *   }
 * }
 */
function migrateEntityToNewSchema(entityData) {
    const componentIds = new Set();
    const componentsLookup = {};

    // Recursive function to build entity hierarchy
    function buildEntityNode(entity, allComponents) {
        const node = {};

        // Build __meta for this entity
        const meta = {
            active: entity.active !== undefined ? entity.active : true,
            layer: entity.layer !== undefined ? entity.layer : 0,
            uuid: entity.uuid
        };

        // Add transform properties
        if (entity.transform) {
            meta.localPosition = entity.transform.localPosition || { x: 0, y: 0, z: 0 };
            meta.localRotation = entity.transform.localRotation || { x: 0, y: 0, z: 0, w: 1 };
            meta.localScale = entity.transform.localScale || { x: 1, y: 1, z: 1 };

            // Add world transform (initially same as local for root)
            meta.position = entity.transform.localPosition || { x: 0, y: 0, z: 0 };
            meta.rotation = entity.transform.localRotation || { x: 0, y: 0, z: 0, w: 1 };
        }

        // Process components - extract and create references
        if (entity.components && Array.isArray(entity.components)) {
            meta.components = {};

            entity.components.forEach(comp => {
                // Generate or use existing component ID
                let componentId = comp.id;
                if (!componentId) {
                    componentId = generateComponentId(comp.type, componentIds);
                }
                componentIds.add(componentId);

                // Add reference in entity
                meta.components[componentId] = true;

                // Store component data separately
                allComponents[componentId] = {
                    type: comp.type,
                    ...comp.properties
                };

                // Add special fields if they exist
                if (comp.inventoryItem) {
                    allComponents[componentId].inventoryItem = comp.inventoryItem;
                }
                if (comp.options && comp.options.cmdUser) {
                    allComponents[componentId]._owner = comp.options.cmdUser;
                }
            });
        }

        // Process children recursively
        if (entity.children && Array.isArray(entity.children)) {
            entity.children.forEach(child => {
                const childNode = buildEntityNode(child, allComponents);
                node[child.name] = childNode;
            });
        }

        // Add __meta last
        node.__meta = meta;

        return node;
    }

    // Start building from root
    const entityTree = buildEntityNode(entityData, componentsLookup);

    // Wrap in root entity name
    const result = {
        Entity: {
            [entityData.name]: entityTree
        },
        Components: componentsLookup
    };

    return result;
}

/**
 * Check if item data is in old schema format
 */
function isOldSchema(data) {
    // Old schema has components array at entity level
    // New schema has Entity/Components structure at root
    return data.components !== undefined ||
           (data.Entity === undefined && data.Components === undefined);
}

/**
 * Process a single JSON file
 */
async function processJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const item = JSON.parse(content);

        // Only process entity items
        if (item.itemType !== 'entity') {
            return { processed: false, reason: 'Not an entity item' };
        }

        // Check if already in new schema
        if (!isOldSchema(item.data)) {
            return { processed: false, reason: 'Already in new schema' };
        }

        // Migrate to new schema
        const newData = migrateEntityToNewSchema(item.data);
        item.data = newData;

        // Write back to file (unless dry run)
        if (!dryRun) {
            fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
        }

        // Sync to Firebase if authenticated
        if (isAuthenticated && !dryRun) {
            const relativePath = path.relative('./inventory', filePath);
            const pathParts = relativePath.split(path.sep);

            // Remove .json extension from filename
            const fileNameWithoutExt = path.basename(filePath, '.json');
            const dirParts = pathParts.slice(0, -1);

            // Build Firebase path
            const firebasePath = `inventory/${[...dirParts, fileNameWithoutExt].map(sanitizeFirebasePath).join('/')}`;

            const updateRef = ref(database, firebasePath);
            await update(updateRef, item);

            return { processed: true, synced: true, firebasePath };
        }

        return { processed: true, synced: false };

    } catch (error) {
        return { processed: false, error: error.message };
    }
}

/**
 * Find all JSON files in inventory directory
 */
function findJsonFiles(dir) {
    let results = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            results = results.concat(findJsonFiles(filePath));
        } else if (file.endsWith('.json')) {
            results.push(filePath);
        }
    }

    return results;
}

/**
 * Main execution
 */
async function main() {
    console.log('============================================================');
    console.log('Migrate to New Firebase-Optimized Schema');
    console.log('============================================================\n');

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }
    if (forceSync) {
        console.log('🔄 FORCE SYNC MODE - Will re-sync all files\n');
    }

    // Authenticate with Firebase
    await authenticateFirebase();

    // Find all JSON files
    console.log('\nScanning for JSON files...');
    const jsonFiles = findJsonFiles('./inventory');
    console.log(`Found ${jsonFiles.length} JSON files\n`);

    // Process each file
    console.log('Processing files...');
    console.log('------------------------------------------------------------');

    const results = {
        total: jsonFiles.length,
        processed: 0,
        synced: 0,
        skipped: 0,
        errors: 0
    };

    for (const filePath of jsonFiles) {
        const relativePath = path.relative('./inventory', filePath);
        process.stdout.write(`Processing ${relativePath}... `);

        const result = await processJsonFile(filePath);

        if (result.processed) {
            results.processed++;
            if (result.synced) {
                results.synced++;
                console.log('✓ migrated and synced to Firebase');
                if (result.firebasePath) {
                    console.log(`  → Synced to: ${result.firebasePath}`);
                }
            } else {
                console.log('✓ migrated (local only)');
            }
        } else if (result.error) {
            results.errors++;
            console.log(`✗ error: ${result.error}`);
        } else {
            results.skipped++;
            console.log(`○ ${result.reason}`);
        }

        // Force sync if requested and file was skipped
        if (forceSync && !result.processed && result.reason === 'Already in new schema' && !dryRun) {
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
    }

    // Print summary
    console.log('\n============================================================');
    console.log('Summary');
    console.log('============================================================');
    console.log(`Total files:      ${results.total}`);
    console.log(`Processed:        ${results.processed} (${dryRun ? 'would be ' : ''}migrated)`);
    console.log(`Skipped:          ${results.skipped}`);
    console.log(`Errors:           ${results.errors}`);

    if (isAuthenticated) {
        console.log(`Synced to FB:     ${results.synced}`);
    }

    if (dryRun) {
        console.log('\nTo apply these changes, run without --dry-run flag');
    }
    console.log('');
}

// Run
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
