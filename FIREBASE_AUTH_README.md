# Firebase Authentication with Custom Secrets

This document explains how to implement Firebase authentication using custom secrets for the inspector application.

## Overview

The system uses a simplified authentication mechanism where each user has a unique `secret` stored in localStorage. This secret acts as an authentication key for Firebase operations.

## Architecture

### Client-Side Components

1. **Secret Generation** (`networking.js`):
   - Auto-generates a unique secret on first use
   - Stores in localStorage for persistence
   - Used as a simplified auth token

2. **Authentication Helper** (`firebase-auth-helper.js`):
   - Handles Firebase authentication
   - Two authentication modes:
     - Anonymous auth (development)
     - Custom token auth (production)

### Server-Side Components (Production)

3. **Backend Service** (`firebase-backend-example.js`):
   - Validates secrets
   - Generates Firebase custom tokens
   - Manages user permissions

4. **Database Rules** (`firebase-database-rules.json`):
   - Enforces access control
   - Validates data structure
   - Implements permission levels

## Implementation Steps

### Step 1: Apply Firebase Database Rules

1. Go to Firebase Console → Realtime Database → Rules
2. Copy the contents of `firebase-database-rules.json`
3. Paste and publish the rules

### Step 2: Client-Side Integration

Add authentication to your networking module:

```javascript
// In your app initialization
import { attachAuthToDatabase } from './firebase-auth-helper.js';

// After networking is initialized
attachAuthToDatabase(networking);
```

### Step 3: Backend Setup (Production Only)

For production, set up the backend service:

```bash
# Install dependencies
npm install express firebase-admin crypto

# Set up service account
# Download from Firebase Console → Project Settings → Service Accounts

# Run the backend
node firebase-backend-example.js
```

## Authentication Flow

### Development Mode (Anonymous Auth)
1. Client generates/retrieves secret from localStorage
2. Client signs in anonymously to Firebase
3. Client uses anonymous UID for database operations
4. Rules check `auth != null` for basic access

### Production Mode (Custom Token Auth)
1. Client sends secret + username to backend
2. Backend validates secret
3. Backend generates custom Firebase token with claims
4. Client authenticates with custom token
5. Rules check custom claims for fine-grained access

## Security Considerations

### Current Implementation
- ✅ Secrets are hashed before storage
- ✅ Each user has unique authentication
- ✅ Rules enforce access control
- ⚠️ Anonymous auth is less secure

### Production Recommendations
1. **Use Custom Token Authentication**:
   - Implement backend service for token generation
   - Never expose Firebase Admin SDK to client

2. **Secure Secret Management**:
   - Generate secrets server-side
   - Use secure random generation
   - Implement secret rotation

3. **Enhanced Rules**:
   - Add rate limiting
   - Implement data validation
   - Add audit logging

4. **HTTPS Only**:
   - Always use HTTPS in production
   - Secure all API endpoints

## Database Structure

```
firebase-database/
├── inventory/
│   └── {username}/
│       └── {folder}/
│           ├── _folder_metadata
│           └── {items}
├── spaceState/
│   └── {spaceId}/
│       ├── public/
│       └── protected/
├── secrets/
│   └── {secretHash}/
│       ├── username
│       ├── created
│       └── isAdmin
└── feedback/
    └── {ticketId}/
```

## Testing

### Test Authentication
```javascript
// Test if authentication is working
if (networking.auth && networking.auth.isAuthenticated()) {
    console.log('Authenticated as:', networking.auth.getCurrentUser());
}
```

### Test Database Access
```javascript
// Test write operation
await networking.setData('test/auth-test', {
    message: 'Testing authenticated write',
    timestamp: Date.now()
});

// Test read operation
const data = await networking.getData('test/auth-test');
console.log('Read data:', data);
```

## Troubleshooting

### Common Issues

1. **"Permission Denied" errors**:
   - Check if user is authenticated
   - Verify Firebase rules are published
   - Check auth token is valid

2. **Secret not persisting**:
   - Check localStorage is enabled
   - Verify secret generation logic

3. **Custom token fails**:
   - Verify backend service is running
   - Check service account credentials
   - Validate secret format

### Debug Mode

Enable debug logging:
```javascript
// In firebase-auth-helper.js
const DEBUG = true;

// Will log authentication steps
```

## Migration Path

To migrate from no-auth to authenticated system:

1. **Phase 1**: Deploy with anonymous auth
   - Users auto-generate secrets
   - Basic access control

2. **Phase 2**: Add backend service
   - Implement token generation
   - Validate existing secrets

3. **Phase 3**: Full authentication
   - Require authentication for all operations
   - Implement admin roles
   - Add audit logging

## API Reference

### Networking Methods
All methods now automatically handle authentication:

- `networking.setData(path, data)` - Write data
- `networking.getData(path)` - Read data
- `networking.updateData(path, updates)` - Update data
- `networking.deleteData(path)` - Delete data
- `networking.addData(path, data)` - Add new data

### Auth Helper Methods
- `networking.auth.initializeAuth()` - Initialize authentication
- `networking.auth.isAuthenticated()` - Check auth status
- `networking.auth.getCurrentUser()` - Get current user
- `networking.auth.signOut()` - Sign out user

## Support

For issues or questions:
1. Check Firebase Console for rule errors
2. Review browser console for auth errors
3. Verify network connectivity to Firebase
4. Check secret is properly stored in localStorage