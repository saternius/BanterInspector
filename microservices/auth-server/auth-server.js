const express = require('express');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://inspector-6bad1-default-rtdb.firebaseio.com'
});

// Set custom claims for anonymous user
app.post('/setclaims', async (req, res) => {
    try {
        const { uid, username, secret } = req.body;
        
        // Set custom claims
        await admin.auth().setCustomUserClaims(uid, {
            username: username,
            secret: secret
        });

        // Store secret in database
        await admin.database().ref(`secrets/${username}`).set(secret);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3303;
app.listen(PORT, () => {
    console.log(`Auth server running on port ${PORT}`);
});