/**
 * Firebase Authentication Helper
 * 
 * This module provides custom authentication for Firebase using a secret-based system.
 * Since Firebase Realtime Database rules require proper authentication, we need to
 * implement a custom authentication flow.
 * 
 * Note: For production use, you should implement this on a secure backend server
 * that validates secrets and creates Firebase custom tokens.
 */

export class FirebaseAuthHelper {
    constructor(networking) {
        this.networking = networking;
        this.currentUser = null;
        this.authStateListeners = [];
    }

    /**
     * Initialize Firebase Auth and authenticate with secret
     */
    async initializeAuth() {
        if (!firebase.auth) {
            console.error('Firebase Auth not available');
            return false;
        }

        try {
            // Check if already authenticated
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                this.currentUser = currentUser;
                return true;
            }

            // Get the user's secret
            const secret = this.networking.secret;
            const username = this.sanitizeUsername(SM.scene?.localUser?.name || 'anonymous');
            await this.authenticateAnonymously(username, secret);
            return true;
        } catch (error) {
            console.error('Failed to initialize Firebase Auth:', error);
            return false;
        }
    }

    /**
     * Authenticate anonymously and store secret/username in database
     * This is a simplified approach for development
     */
    async authenticateAnonymously(username, secret) {
        try {
            // Sign in anonymously
            const credential = await firebase.auth().signInAnonymously();
            this.currentUser = credential.user;
            //await this.registerUserSecret(this.currentUser.uid, username, secret);
            console.log('Authenticated anonymously as:', username);
            return this.currentUser;
        } catch (error) {
            console.error('Anonymous authentication failed:', error);
            throw error;
        }
    }


    /**
     * Register user secret mapping (for development only)
     * In production, this should be handled server-side
     */
    async registerUserSecret(uid, username, secret) {
        try {
            // Call auth server to set custom claims
            const response = await fetch(`${window.repoUrl.slice(0,-3)}/setclaims`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    uid: uid,
                    username: username,
                    secret: secret
                })
            });

            if (response.ok) {
                console.log('Custom claims set for:', username);
                // Force token refresh to get new claims
                await this.currentUser.getIdToken(true);
            } else {
                console.log('Could not set custom claims (server may not be running)');
            }
        } catch (error) {
            console.log('Auth server not available - running without custom claims');
        }
    }

    /**
     * Sanitize username for use as Firebase path
     */
    sanitizeUsername(username) {
        return username.replace(/[.#$[\]]/g, '_');
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            await firebase.auth().signOut();
            this.currentUser = null;
            console.log('Signed out successfully');
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.currentUser || firebase.auth().currentUser;
    }

    /**
     * Add auth state listener
     */
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        return firebase.auth().onAuthStateChanged(callback);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getCurrentUser();
    }

    /**
     * Get ID token for API calls
     */
    async getIdToken() {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('No authenticated user');
        }
        return await user.getIdToken();
    }
}

// Helper function to attach auth to database operations
export function attachAuthToDatabase(networking) {
    const authHelper = new FirebaseAuthHelper(networking);
    
    // Initialize auth when Firebase is ready
    const initAuth = async () => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            await authHelper.initializeAuth();
            
            // Monkey-patch networking methods to include auth
            const originalMethods = {
                setData: networking.setData.bind(networking),
                getData: networking.getData.bind(networking),
                updateData: networking.updateData.bind(networking),
                deleteData: networking.deleteData.bind(networking),
                addData: networking.addData.bind(networking)
            };

            // Wrap methods to ensure authentication
            networking.setData = async function(path, data) {
                if (!authHelper.isAuthenticated()) {
                    await authHelper.initializeAuth();
                }
                return originalMethods.setData(path, data);
            };

            networking.getData = async function(path) {
                if (!authHelper.isAuthenticated()) {
                    await authHelper.initializeAuth();
                }
                return originalMethods.getData(path);
            };

            networking.updateData = async function(path, updates) {
                if (!authHelper.isAuthenticated()) {
                    await authHelper.initializeAuth();
                }
                return originalMethods.updateData(path, updates);
            };

            networking.deleteData = async function(path) {
                if (!authHelper.isAuthenticated()) {
                    await authHelper.initializeAuth();
                }
                return originalMethods.deleteData(path);
            };

            networking.addData = async function(path, data) {
                if (!authHelper.isAuthenticated()) {
                    await authHelper.initializeAuth();
                }
                return originalMethods.addData(path, data);
            };

            // Add auth helper to networking object
            networking.auth = authHelper;

            window.loadInventoryDeps()
        } else {
            // Retry if Firebase isn't ready yet
            setTimeout(initAuth, 1000);
        }
    };

    initAuth();
    return authHelper;
}