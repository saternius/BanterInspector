const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();

// Import routers
const feedbackRouter = require('./routes/feedback');

// Enhanced CORS configuration
app.use(cors({
    origin: true,  // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.headers.origin || 'no origin'}`);
    next();
});

// Increase body size limit for comments and details
app.use(express.json({ limit: '10mb' }));

// Test endpoint
app.get('/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ status: 'ok', message: 'Auth server is running' });
});

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://inspector-6bad1-default-rtdb.firebaseio.com'
});

// Make admin available to routes
app.set('admin', admin);

// Mount feedback router
app.use('/api/feedback', feedbackRouter);

// Set custom claims for anonymous user
app.post('/setclaims', async (req, res) => {
    console.log("setclaims");
    try {
        const { uid, username, secret } = req.body;
        console.log(uid, username, secret);
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth server running on port ${PORT}`);
});