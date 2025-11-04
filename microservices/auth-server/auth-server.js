const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const http = require('http');
const WebSocketManager = require('./websocket-manager');

const app = express();

// Import routers
const feedbackRouter = require('./routes/feedback');
const inventoryRouter = require('./routes/inventory');

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

// Mount routers
app.use('/api/feedback', feedbackRouter);
app.use('/api/inventory', inventoryRouter);

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

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket manager
const wsManager = new WebSocketManager(server, admin);

// Make WebSocket manager available to routes if needed
app.set('wsManager', wsManager);

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth server running on port ${PORT}`);
    console.log(`WebSocket server ready on ws://localhost:${PORT}`);
});