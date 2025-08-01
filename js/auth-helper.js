/**
 * Authentication Helper for Firestore Access
 * 
 * This module handles client authentication using secret passwords
 * and manages user sessions for the feedback system.
 */

export class AuthHelper {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.clientPassword = null;
    }
    
    /**
     * Initialize authentication with client password
     * In production, this would authenticate against a backend service
     * that validates the password and returns a custom token
     */
    async initializeAuth(clientPassword) {
        if (!clientPassword) {
            throw new Error('Client password is required');
        }
        
        this.clientPassword = clientPassword;
        
        // In a production environment, you would:
        // 1. Send the client password to your backend
        // 2. Backend validates the password
        // 3. Backend creates a custom Firebase token with claims
        // 4. Return the token to the client
        // 5. Sign in with the custom token
        
        // For now, we'll use anonymous auth as a placeholder
        // You'll need to implement the actual authentication flow
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                this.auth = firebase.auth();
                
                // Check if already signed in
                if (this.auth.currentUser) {
                    this.currentUser = this.auth.currentUser;
                    return this.currentUser;
                }
                
                // Sign in anonymously (replace with custom token auth in production)
                const userCredential = await this.auth.signInAnonymously();
                this.currentUser = userCredential.user;
                
                // Store user info
                this.storeUserInfo();
                
                return this.currentUser;
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            throw error;
        }
    }
    
    /**
     * Get or create a persistent user ID
     */
    getUserId() {
        if (this.currentUser) {
            return this.currentUser.uid;
        }
        
        // Fallback to local storage ID
        let userId = localStorage.getItem('inspector_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('inspector_user_id', userId);
        }
        return userId;
    }
    
    /**
     * Store user information locally
     */
    storeUserInfo() {
        if (this.currentUser) {
            localStorage.setItem('inspector_user_auth', JSON.stringify({
                uid: this.currentUser.uid,
                isAnonymous: this.currentUser.isAnonymous,
                createdAt: new Date().toISOString()
            }));
        }
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    /**
     * Sign out the current user
     */
    async signOut() {
        if (this.auth) {
            await this.auth.signOut();
            this.currentUser = null;
            localStorage.removeItem('inspector_user_auth');
        }
    }
    
    /**
     * Set up authentication state listener
     */
    onAuthStateChanged(callback) {
        if (this.auth) {
            return this.auth.onAuthStateChanged(callback);
        }
    }
}

// Export singleton instance
export const authHelper = new AuthHelper();
window.authHelper = authHelper;