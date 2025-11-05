const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

/**
 * Sanitize Firebase path component
 * Firebase keys cannot contain . $ # [ ] /
 */
function sanitizeFirebasePath(str) {
    if (!str) return '';
    const clean = (s) => {
        return s
            .trim()
            .replace(/[\.\$#\[\]\/]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '');
    };
    // Handle paths with slashes by sanitizing each component
    return str.split('/').map(clean).join('/');
}

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

/**
 * Middleware to validate user credentials
 */
async function validateUser(req, res, next) {
    // For DELETE requests with body, we need to ensure body is parsed
    const { userName, secret } = req.body || {};

    if (!userName) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }

    // Store for use in route handlers
    req.userName = userName;
    req.userSecret = secret;

    next();
}

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({ success: true, status: 'ok' });
});

/**
 * Create a new inventory item
 */
router.post('/items', validateUser, async (req, res) => {
    try {
        const { item } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!item || !item.name) {
            return res.status(400).json({ success: false, error: 'Item name is required' });
        }

        // Add server timestamp
        item.createdAt = admin.database.ServerValue.TIMESTAMP;
        if (!item.created) {
            item.created = Date.now();
        }

        // Construct Firebase path with sanitization
        const sanitizedFolder = item.folder ? sanitizeFirebasePath(item.folder) : null;
        const sanitizedItemName = sanitizeFirebasePath(item.name);
        const itemPath = sanitizedFolder
            ? `inventory/${req.userName}/${sanitizedFolder}/${sanitizedItemName}`
            : `inventory/${req.userName}/${sanitizedItemName}`;

        // Save to Firebase
        await db.ref(itemPath).set(item);

        console.log(`Created item: ${itemPath}`);
        res.json({ success: true, path: itemPath, item });

    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Update an existing inventory item
 */
router.put('/items/:name', validateUser, async (req, res) => {
    try {
        const { updates } = req.body;
        const itemName = req.params.name;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!updates) {
            return res.status(400).json({ success: false, error: 'Updates are required' });
        }

        // Add update timestamp
        updates.updatedAt = admin.database.ServerValue.TIMESTAMP;

        // Construct Firebase path (check if item has folder) with sanitization
        const sanitizedFolder = updates.folder ? sanitizeFirebasePath(updates.folder) : null;
        const sanitizedItemName = sanitizeFirebasePath(itemName);
        const itemPath = sanitizedFolder
            ? `inventory/${req.userName}/${sanitizedFolder}/${sanitizedItemName}`
            : `inventory/${req.userName}/${sanitizedItemName}`;

        // Update in Firebase
        await db.ref(itemPath).update(updates);

        console.log(`Updated item: ${itemPath}`);
        res.json({ success: true, path: itemPath, updates });

    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Delete an inventory item
 */
router.delete('/items/:name', validateUser, async (req, res) => {
    try {
        const itemName = req.params.name;
        const { folder } = req.body; // Folder path might be in body
        const admin = req.app.get('admin');
        const db = admin.database();

        // Construct Firebase path with sanitization
        const sanitizedFolder = folder ? sanitizeFirebasePath(folder) : null;
        const sanitizedItemName = sanitizeFirebasePath(itemName);
        const itemPath = sanitizedFolder
            ? `inventory/${req.userName}/${sanitizedFolder}/${sanitizedItemName}`
            : `inventory/${req.userName}/${sanitizedItemName}`;

        // Remove from Firebase
        await db.ref(itemPath).remove();

        console.log(`Deleted item: ${itemPath}`);
        res.json({ success: true, path: itemPath });

    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Create a new folder
 */
router.post('/folders', validateUser, async (req, res) => {
    try {
        const { folder } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!folder || !folder.name) {
            return res.status(400).json({ success: false, error: 'Folder name is required' });
        }

        // Add server timestamp
        folder.createdAt = admin.database.ServerValue.TIMESTAMP;
        if (!folder.created) {
            folder.created = Date.now();
        }

        // Set author
        folder.author = req.userName;

        // Construct Firebase path for folder metadata with sanitization
        const sanitizedParent = folder.parent ? sanitizeFirebasePath(folder.parent) : null;
        const sanitizedFolderName = sanitizeFirebasePath(folder.name);
        const folderPath = sanitizedParent
            ? `inventory/${req.userName}/${sanitizedParent}/${sanitizedFolderName}/_folder_metadata`
            : `inventory/${req.userName}/${sanitizedFolderName}/_folder_metadata`;

        // Save folder metadata
        await db.ref(folderPath).set(folder);

        console.log(`Created folder: ${folderPath}`);
        res.json({ success: true, path: folderPath, folder });

    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Update a folder
 */
router.put('/folders/:key', validateUser, async (req, res) => {
    try {
        const { updates } = req.body;
        const folderKey = req.params.key;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!updates) {
            return res.status(400).json({ success: false, error: 'Updates are required' });
        }

        // Add update timestamp
        updates.updatedAt = admin.database.ServerValue.TIMESTAMP;

        // Construct Firebase path for folder metadata with sanitization
        const sanitizedParent = updates.parent ? sanitizeFirebasePath(updates.parent) : null;
        const sanitizedFolderKey = sanitizeFirebasePath(folderKey);
        const folderPath = sanitizedParent
            ? `inventory/${req.userName}/${sanitizedParent}/${sanitizedFolderKey}/_folder_metadata`
            : `inventory/${req.userName}/${sanitizedFolderKey}/_folder_metadata`;

        // Update folder metadata
        await db.ref(folderPath).update(updates);

        console.log(`Updated folder: ${folderPath}`);
        res.json({ success: true, path: folderPath, updates });

    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Delete a folder (and optionally its contents)
 */
router.delete('/folders/:key', validateUser, async (req, res) => {
    try {
        const folderKey = req.params.key;
        const { parent, recursive } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        // Construct Firebase path with sanitization
        const sanitizedParent = parent ? sanitizeFirebasePath(parent) : null;
        const sanitizedFolderKey = sanitizeFirebasePath(folderKey);
        const folderPath = sanitizedParent
            ? `inventory/${req.userName}/${sanitizedParent}/${sanitizedFolderKey}`
            : `inventory/${req.userName}/${sanitizedFolderKey}`;

        if (recursive) {
            // Delete entire folder and contents
            await db.ref(folderPath).remove();
            console.log(`Deleted folder recursively: ${folderPath}`);
        } else {
            // Just delete the folder metadata
            await db.ref(`${folderPath}/_folder_metadata`).remove();
            console.log(`Deleted folder metadata: ${folderPath}/_folder_metadata`);
        }

        res.json({ success: true, path: folderPath });

    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Bulk upload items and folders
 */
router.post('/bulk', validateUser, async (req, res) => {
    try {
        const { contents } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!contents) {
            return res.status(400).json({ success: false, error: 'Contents are required' });
        }

        const updates = {};
        const timestamp = admin.database.ServerValue.TIMESTAMP;

        // Process folders (support both array and object format)
        if (contents.folders) {
            if (Array.isArray(contents.folders)) {
                // Handle array format
                for (const folder of contents.folders) {
                    const key = folder.name || `folder_${Date.now()}_${Math.random()}`;
                    const folderPath = `inventory/${req.userName}/${key}/_folder_metadata`;
                    updates[folderPath] = {
                        ...folder,
                        author: req.userName,
                        createdAt: timestamp
                    };
                }
            } else {
                // Handle object format
                for (const [key, folder] of Object.entries(contents.folders)) {
                    const sanitizedKey = sanitizeFirebasePath(key);
                    const folderPath = `inventory/${req.userName}/${sanitizedKey}/_folder_metadata`;
                    updates[folderPath] = {
                        ...folder,
                        author: req.userName,
                        createdAt: timestamp
                    };
                }
            }
        }

        // Process items (support both array and object format)
        if (contents.items) {
            if (Array.isArray(contents.items)) {
                // Handle array format
                for (const item of contents.items) {
                    const key = item.name || `item_${Date.now()}_${Math.random()}`;
                    const itemPath = item.folder
                        ? `inventory/${req.userName}/${item.folder}/${key}`
                        : `inventory/${req.userName}/${key}`;
                    updates[itemPath] = {
                        ...item,
                        createdAt: timestamp
                    };
                }
            } else {
                // Handle object format
                for (const [key, item] of Object.entries(contents.items)) {
                    const sanitizedKey = sanitizeFirebasePath(key);
                    const sanitizedFolder = item.folder ? sanitizeFirebasePath(item.folder) : null;
                    const itemPath = sanitizedFolder
                        ? `inventory/${req.userName}/${sanitizedFolder}/${sanitizedKey}`
                        : `inventory/${req.userName}/${sanitizedKey}`;
                    updates[itemPath] = {
                        ...item,
                        createdAt: timestamp
                    };
                }
            }
        }

        // Perform multi-location update
        await db.ref().update(updates);

        // Count items and folders separately
        let itemsCreated = 0;
        let foldersCreated = 0;

        for (const path of Object.keys(updates)) {
            if (path.endsWith('_folder_metadata')) {
                foldersCreated++;
            } else {
                itemsCreated++;
            }
        }

        console.log(`Bulk uploaded: ${itemsCreated} items, ${foldersCreated} folders for ${req.userName}`);
        res.json({
            success: true,
            count: Object.keys(updates).length,
            itemsCreated,
            foldersCreated
        });

    } catch (error) {
        console.error('Error in bulk upload:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Upload an image to Firebase Storage
 */
router.post('/images', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image provided' });
        }

        const metadata = JSON.parse(req.body.metadata || '{}');
        const admin = req.app.get('admin');
        const bucket = admin.storage().bucket();

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${timestamp}_${req.file.originalname}`;
        const filePath = metadata.folder
            ? `inventory/${metadata.userName}/${metadata.folder}/${fileName}`
            : `inventory/${metadata.userName}/${fileName}`;

        // Create file reference in Firebase Storage
        const file = bucket.file(filePath);

        // Upload file
        await file.save(req.file.buffer, {
            metadata: {
                contentType: req.file.mimetype,
                metadata: {
                    uploadedBy: metadata.userName,
                    originalName: req.file.originalname
                }
            }
        });

        // Make file publicly readable
        await file.makePublic();

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        console.log(`Uploaded image: ${publicUrl}`);
        res.json({
            success: true,
            url: publicUrl,
            path: filePath,
            fileName: fileName
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get public folders for a user
 */
router.get('/public/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const admin = req.app.get('admin');
        const db = admin.database();

        // Get all folders for the user
        const snapshot = await db.ref(`inventory/${username}`).once('value');
        const data = snapshot.val() || {};

        const publicFolders = {};

        // Filter for public folders
        function findPublicFolders(obj, path = '') {
            for (const [key, value] of Object.entries(obj)) {
                if (key === '_folder_metadata' && value.public === true) {
                    // Found a public folder
                    const folderPath = path.replace('/_folder_metadata', '');
                    publicFolders[folderPath] = value;
                } else if (typeof value === 'object' && value !== null) {
                    // Recursively search
                    findPublicFolders(value, path ? `${path}/${key}` : key);
                }
            }
        }

        findPublicFolders(data);

        console.log(`Found ${Object.keys(publicFolders).length} public folders for ${username}`);
        res.json({ success: true, folders: publicFolders });

    } catch (error) {
        console.error('Error getting public folders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get user's full inventory structure
 */
router.get('/users/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const admin = req.app.get('admin');
        const db = admin.database();

        // Get all data for the user
        const snapshot = await db.ref(`inventory/${username}`).once('value');
        const data = snapshot.val() || {};

        console.log(`Retrieved inventory for ${username}`);
        res.json({ success: true, data });

    } catch (error) {
        console.error('Error getting user inventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Sync a single item to Firebase
 */
router.post('/sync/item', validateUser, async (req, res) => {
    try {
        const { path, item } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!path || !item) {
            return res.status(400).json({ success: false, error: 'Path and item are required' });
        }

        // Add timestamp
        item.syncedAt = admin.database.ServerValue.TIMESTAMP;

        // Construct full Firebase path with sanitization
        const sanitizedPath = sanitizeFirebasePath(path);
        const fullPath = `inventory/${req.userName}/${sanitizedPath}`;

        // Save to Firebase
        await db.ref(fullPath).set(item);

        console.log(`Synced item: ${fullPath}`);
        res.json({ success: true, path: fullPath });

    } catch (error) {
        console.error('Error syncing item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Sync folder metadata to Firebase
 */
router.post('/sync/folder', validateUser, async (req, res) => {
    try {
        const { folderKey, folder } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!folderKey || !folder) {
            return res.status(400).json({ success: false, error: 'Folder key and data are required' });
        }

        // Add timestamp
        folder.syncedAt = admin.database.ServerValue.TIMESTAMP;

        // Construct Firebase path with sanitization
        const sanitizedFolderKey = sanitizeFirebasePath(folderKey);
        const folderPath = `inventory/${req.userName}/${sanitizedFolderKey}/_folder_metadata`;

        // Save to Firebase
        await db.ref(folderPath).set(folder);

        console.log(`Synced folder: ${folderPath}`);
        res.json({ success: true, path: folderPath });

    } catch (error) {
        console.error('Error syncing folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Remove item or folder from Firebase
 */
router.delete('/sync/remove', validateUser, async (req, res) => {
    try {
        const { path } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!path) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }

        // Construct full Firebase path with sanitization
        const sanitizedPath = sanitizeFirebasePath(path);
        const fullPath = `inventory/${req.userName}/${sanitizedPath}`;

        // Remove from Firebase
        await db.ref(fullPath).remove();

        console.log(`Removed from Firebase: ${fullPath}`);
        res.json({ success: true, path: fullPath });

    } catch (error) {
        console.error('Error removing from Firebase:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Import data from a Firebase reference path
 */
router.post('/import/firebase', validateUser, async (req, res) => {
    try {
        const { firebaseRef, parentFolder, minUpdateTime } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!firebaseRef) {
            return res.status(400).json({ success: false, error: 'Firebase reference is required' });
        }

        // Get data from the Firebase reference
        const snapshot = await db.ref(firebaseRef).once('value');
        const data = snapshot.val();

        if (!data) {
            return res.status(404).json({ success: false, error: 'No data found at the specified reference' });
        }

        // Process and structure the data for client
        const result = {
            data: data,
            firebaseRef: firebaseRef,
            parentFolder: parentFolder || null,
            minUpdateTime: minUpdateTime || null
        };

        console.log(`Imported data from: ${firebaseRef}`);
        res.json({ success: true, ...result });

    } catch (error) {
        console.error('Error importing from Firebase:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Import public folders from a specific user
 */
router.post('/import/user-public', validateUser, async (req, res) => {
    try {
        const { targetUsername } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!targetUsername) {
            return res.status(400).json({ success: false, error: 'Target username is required' });
        }

        // Get all data for the target user
        const userInventoryRef = `inventory/${targetUsername}`;
        const snapshot = await db.ref(userInventoryRef).once('value');
        const userData = snapshot.val();

        if (!userData) {
            return res.status(404).json({ success: false, error: 'User not found or has no inventory' });
        }

        // Find all public folders
        const publicFolders = {};

        for (const [folderKey, folderData] of Object.entries(userData)) {
            if (folderData && typeof folderData === 'object') {
                // Check for folder metadata
                const metadata = folderData._folder_metadata || folderData._folder;

                if (metadata && metadata.public === true) {
                    publicFolders[folderKey] = {
                        name: folderKey,
                        metadata: metadata,
                        path: `${userInventoryRef}/${folderKey}`
                    };
                }

                // Also check if the folder has a _folder_metadata child
                if (folderData._folder_metadata && folderData._folder_metadata.public === true) {
                    publicFolders[folderKey] = {
                        name: folderKey,
                        metadata: folderData._folder_metadata,
                        path: `${userInventoryRef}/${folderKey}`
                    };
                }
            }
        }

        console.log(`Found ${Object.keys(publicFolders).length} public folders for user ${targetUsername}`);
        res.json({
            success: true,
            username: targetUsername,
            userPath: userInventoryRef,
            publicFolders: publicFolders,
            userData: userData // Include full data for client-side processing
        });

    } catch (error) {
        console.error('Error importing public user folders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get folder contents from a Firebase path
 */
router.post('/import/folder', validateUser, async (req, res) => {
    try {
        const { folderPath } = req.body;
        const admin = req.app.get('admin');
        const db = admin.database();

        if (!folderPath) {
            return res.status(400).json({ success: false, error: 'Folder path is required' });
        }

        // Get folder contents
        const snapshot = await db.ref(folderPath).once('value');
        const folderData = snapshot.val();

        if (!folderData) {
            return res.status(404).json({ success: false, error: 'Folder not found' });
        }

        // Structure the response
        const contents = {
            items: {},
            folders: {},
            metadata: null
        };

        // Process folder contents
        for (const [key, value] of Object.entries(folderData)) {
            if (key === '_folder_metadata' || key === '_folder') {
                contents.metadata = value;
            } else if (value && typeof value === 'object') {
                if (value.itemType) {
                    // It's an item
                    contents.items[key] = value;
                } else if (value._folder || value._folder_metadata) {
                    // It's a subfolder
                    contents.folders[key] = {
                        name: key,
                        metadata: value._folder || value._folder_metadata,
                        hasContent: Object.keys(value).length > 1
                    };
                }
            }
        }

        console.log(`Retrieved folder contents from: ${folderPath}`);
        res.json({
            success: true,
            path: folderPath,
            contents: contents
        });

    } catch (error) {
        console.error('Error getting folder contents:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;