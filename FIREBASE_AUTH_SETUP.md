# Firebase Authentication Setup for Feedback System

## Overview
This guide explains how to set up Firebase Authentication with secret passwords for the feedback ticketing system.

## Architecture

### Client-Side Flow
1. Each client receives a secret password
2. Client sends password to your backend authentication service
3. Backend validates the password and creates a Firebase custom token
4. Client signs in with the custom token
5. Firestore rules validate the user's permissions

### Firestore Security Rules
The rules ensure:
- Any authenticated client can create feedback tickets
- Only the ticket creator or admins can update/delete tickets
- User ID is stored with each ticket for ownership tracking

## Implementation Steps

### 1. Enable Firebase Authentication
In Firebase Console:
1. Go to Authentication > Sign-in method
2. Enable Anonymous authentication (for development)
3. For production, enable Custom authentication

### 2. Set Up Backend Authentication Service
Create a backend service (Node.js example):

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

// Endpoint to validate client password and return custom token
app.post('/api/authenticate', async (req, res) => {
    const { clientPassword } = req.body;
    
    // Validate the client password
    if (!isValidClientPassword(clientPassword)) {
        return res.status(401).json({ error: 'Invalid password' });
    }
    
    try {
        // Create custom token with claims
        const uid = generateUniqueUserId();
        const customToken = await admin.auth().createCustomToken(uid, {
            clientPassword: hashPassword(clientPassword),
            role: 'client'
        });
        
        res.json({ token: customToken, uid });
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Admin authentication endpoint
app.post('/api/authenticate-admin', async (req, res) => {
    const { adminPassword } = req.body;
    
    if (!isValidAdminPassword(adminPassword)) {
        return res.status(401).json({ error: 'Invalid admin password' });
    }
    
    try {
        const uid = generateAdminUserId();
        const customToken = await admin.auth().createCustomToken(uid, {
            admin: true,
            role: 'admin'
        });
        
        res.json({ token: customToken, uid });
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});
```

### 3. Update Client Authentication
In the inspector, update the authentication flow:

```javascript
// In networking.js or auth-helper.js
async authenticateWithPassword(clientPassword) {
    try {
        // Call your backend authentication service
        const response = await fetch('YOUR_BACKEND_URL/api/authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientPassword })
        });
        
        if (!response.ok) throw new Error('Authentication failed');
        
        const { token } = await response.json();
        
        // Sign in with custom token
        await firebase.auth().signInWithCustomToken(token);
        
        return true;
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
}
```

### 4. Configure Firebase
1. Deploy the Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Set up Firebase Admin SDK on your backend:
   ```bash
   npm install firebase-admin
   ```

3. Initialize with service account credentials

### 5. Password Management
Options for distributing client passwords:

1. **Environment Variables**: Store in build configuration
   ```javascript
   window.CLIENT_PASSWORD = process.env.INSPECTOR_CLIENT_PASSWORD;
   ```

2. **Secure Distribution**: 
   - Email passwords to authorized users
   - Use a secure password manager
   - Rotate passwords regularly

3. **Per-User Passwords**: Generate unique passwords per user
   ```javascript
   function generateClientPassword(userId) {
       return crypto.createHash('sha256')
           .update(userId + SECRET_SALT)
           .digest('hex')
           .substring(0, 16);
   }
   ```

## Security Considerations

1. **Never expose passwords in client code**
   - Use environment variables
   - Authenticate through backend service

2. **Implement rate limiting** on authentication endpoints

3. **Use HTTPS** for all authentication requests

4. **Rotate passwords** regularly

5. **Monitor authentication logs** for suspicious activity

6. **Consider implementing**:
   - Password expiration
   - IP whitelisting for admin access
   - Two-factor authentication for admins

## Testing

1. Test creating feedback as different users
2. Verify ownership-based permissions
3. Test admin override capabilities
4. Ensure unauthorized users cannot modify tickets

## Production Checklist

- [ ] Backend authentication service deployed
- [ ] Firestore rules deployed
- [ ] Client passwords securely distributed
- [ ] Admin accounts configured
- [ ] Authentication monitoring in place
- [ ] Rate limiting implemented
- [ ] HTTPS enforced
- [ ] Password rotation schedule established