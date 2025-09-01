/**
 * Firebase Backend Example
 * 
 * This is an example of a backend service that would handle custom authentication
 * for the inspector. In production, this would run on a secure server.
 * 
 * Requirements:
 * - Node.js with Express
 * - Firebase Admin SDK
 * - A secrets database or configuration
 */

const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
// You need to download your service account key from Firebase Console
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://inspector-6bad1-default-rtdb.firebaseio.com'
});

const app = express();
app.use(express.json());

// In production, store these in a secure database
const VALID_SECRETS = new Map();
const ADMIN_SECRETS = new Set();

/**
 * Register a new user with their secret
 * This would be called when a user first gets their secret
 */
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, secret } = req.body;
        
        if (!username || !secret) {
            return res.status(400).json({ error: 'Username and secret required' });
        }

        // Hash the secret for storage
        const secretHash = crypto
            .createHash('sha256')
            .update(secret)
            .digest('hex');

        // Store the mapping
        VALID_SECRETS.set(secretHash, {
            username: username,
            created: Date.now(),
            isAdmin: false
        });

        // Also store in Firebase for persistence
        await admin.database()
            .ref(`secrets/${secretHash}`)
            .set({
                username: username,
                created: admin.database.ServerValue.TIMESTAMP,
                isAdmin: false
            });

        res.json({ success: true, message: 'User registered' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * Get a custom Firebase token for authentication
 */
app.post('/api/auth/getCustomToken', async (req, res) => {
    try {
        const { username, secret } = req.body;
        
        if (!username || !secret) {
            return res.status(400).json({ error: 'Username and secret required' });
        }

        // Hash the provided secret
        const secretHash = crypto
            .createHash('sha256')
            .update(secret)
            .digest('hex');

        // Validate the secret
        let userData = VALID_SECRETS.get(secretHash);
        
        // If not in memory, check database
        if (!userData) {
            const snapshot = await admin.database()
                .ref(`secrets/${secretHash}`)
                .once('value');
            
            userData = snapshot.val();
            if (userData) {
                VALID_SECRETS.set(secretHash, userData);
            }
        }

        if (!userData || userData.username !== username) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create custom claims for the user
        const customClaims = {
            username: username,
            isAdmin: userData.isAdmin || false,
            secretHash: secretHash
        };

        // Create a custom token
        const customToken = await admin.auth().createCustomToken(username, customClaims);

        res.json({ 
            customToken: customToken,
            username: username,
            isAdmin: customClaims.isAdmin
        });
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

/**
 * Validate a secret (for middleware use)
 */
async function validateSecret(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const secret = authHeader.substring(7);
    const secretHash = crypto
        .createHash('sha256')
        .update(secret)
        .digest('hex');

    // Check if valid secret
    let userData = VALID_SECRETS.get(secretHash);
    
    if (!userData) {
        const snapshot = await admin.database()
            .ref(`secrets/${secretHash}`)
            .once('value');
        
        userData = snapshot.val();
        if (userData) {
            VALID_SECRETS.set(secretHash, userData);
        }
    }

    if (!userData) {
        return res.status(401).json({ error: 'Invalid secret' });
    }

    req.user = userData;
    next();
}

/**
 * Protected endpoint example
 */
app.get('/api/protected/data', validateSecret, (req, res) => {
    res.json({
        message: 'This is protected data',
        user: req.user.username
    });
});

/**
 * Admin endpoint to manage secrets
 */
app.post('/api/admin/secrets/grant', validateSecret, async (req, res) => {
    try {
        // Check if requesting user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { username, isAdmin } = req.body;
        
        // Generate a new secret for the user
        const newSecret = crypto.randomBytes(32).toString('hex');
        const secretHash = crypto
            .createHash('sha256')
            .update(newSecret)
            .digest('hex');

        // Store the new secret
        const userData = {
            username: username,
            created: Date.now(),
            isAdmin: isAdmin || false
        };

        VALID_SECRETS.set(secretHash, userData);
        
        await admin.database()
            .ref(`secrets/${secretHash}`)
            .set({
                ...userData,
                created: admin.database.ServerValue.TIMESTAMP
            });

        res.json({
            success: true,
            username: username,
            secret: newSecret,
            isAdmin: userData.isAdmin
        });
    } catch (error) {
        console.error('Grant secret error:', error);
        res.status(500).json({ error: 'Failed to grant secret' });
    }
});

/**
 * Initialize some test secrets for development
 */
async function initializeTestSecrets() {
    const testSecrets = [
        { username: 'testuser1', secret: 'test-secret-123', isAdmin: false },
        { username: 'admin', secret: 'admin-secret-456', isAdmin: true }
    ];

    for (const user of testSecrets) {
        const secretHash = crypto
            .createHash('sha256')
            .update(user.secret)
            .digest('hex');

        VALID_SECRETS.set(secretHash, {
            username: user.username,
            created: Date.now(),
            isAdmin: user.isAdmin
        });

        await admin.database()
            .ref(`secrets/${secretHash}`)
            .set({
                username: user.username,
                created: admin.database.ServerValue.TIMESTAMP,
                isAdmin: user.isAdmin
            });
    }

    console.log('Test secrets initialized');
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Firebase auth backend running on port ${PORT}`);
    initializeTestSecrets();
});

module.exports = app;