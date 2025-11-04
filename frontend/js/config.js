/**
 * TippyConfig - Central configuration management for Tippy
 * Part of Phase 1 Firebase Migration Plan
 */
export class TippyConfig {
    constructor(options = {}) {
        // Firebase configuration
        this.firebase = {
            projectId: options.firebaseProjectId || 'tippy-6bad1',
            databaseURL: options.firebaseDatabaseURL || 'https://tippy-6bad1-default-rtdb.firebaseio.com',
            apiKey: options.firebaseApiKey || 'AIzaSyBJl_TjFUzIMgOFWSqJMrAEeE4t-FFPx7w',
            authDomain: options.firebaseAuthDomain || 'inspector-6bad1.firebaseapp.com',
            storageBucket: options.firebaseStorageBucket || 'inspector-6bad1.appspot.com',
            messagingSenderId: options.firebaseMessagingSenderId || '1026522606803',
            appId: options.firebaseAppId || '1:1026522606803:web:5f95c93b3cdea4c616fbed'
        };

        // Feature flags
        this.features = {
            enableOfflineSupport: options.enableOfflineSupport || false, // Enable offline support
            useVirtualScrolling: options.useVirtualScrolling || false,   // Performance optimization
            debugMode: options.debugMode || false                   // Enable debug logging
        };

        // API configuration
        this.api = {
            baseUrl: options.apiBaseUrl || window.repoUrl || '',
            statementBlockService: options.statementBlockService || 'http://localhost:5000',
            fileServerOptions: ['stable', 'ngrok', 'local'],
            defaultFileServer: options.defaultFileServer || 'stable'
        };

        // UI configuration
        this.ui = {
            theme: options.theme || 'dark',
            autoSaveInterval: options.autoSaveInterval || 30000, // Auto-save interval in ms
            debounceDelay: options.debounceDelay || 300,        // Debounce delay for inputs
            maxPropertyListItems: options.maxPropertyListItems || 100, // Max items before virtualization
            enableAnimations: options.enableAnimations !== false
        };

        // Performance configuration
        this.performance = {
            templateCacheTimeout: options.templateCacheTimeout || 3600000, // 1 hour
            firebaseCacheTimeout: options.firebaseCacheTimeout || 5000,    // 5 seconds
            maxConcurrentRequests: options.maxConcurrentRequests || 5,
            enableRequestBatching: options.enableRequestBatching || true
        };

        // Development configuration
        this.dev = {
            logLevel: options.logLevel || 'info', // 'debug', 'info', 'warn', 'error'
            enableHotReload: options.enableHotReload || false,
            mockData: options.mockData || false,
            verboseErrors: options.verboseErrors || false
        };

        // Storage configuration
        this.storage = {
            localStorage: options.useLocalStorage !== false,
            sessionStorage: options.useSessionStorage || false,
            indexedDB: options.useIndexedDB || false,
            cachePrefix: options.cachePrefix || 'tippy-'
        };

        // Apply environment-specific overrides
        this.applyEnvironmentConfig();
    }

    /**
     * Apply environment-specific configuration
     */
    applyEnvironmentConfig() {
        const hostname = window.location.hostname;

        // Development environment
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this.dev.logLevel = 'debug';
            this.dev.verboseErrors = true;
            this.api.defaultFileServer = 'local';
        }

        // Staging environment
        if (hostname.includes('staging') || hostname.includes('test')) {
            this.features.debugMode = true;
            this.dev.logLevel = 'info';
        }

        // Production environment
        if (hostname.includes('banter.fun')) {
            this.dev.logLevel = 'error';
            this.features.debugMode = false;
            this.api.defaultFileServer = 'stable';
        }
    }

    /**
     * Get a specific configuration value
     * @param {string} path - Dot-notation path to config value
     * @returns {*} The configuration value
     */
    get(path) {
        const keys = path.split('.');
        let value = this;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Set a specific configuration value
     * @param {string} path - Dot-notation path to config value
     * @param {*} value - The value to set
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this;

        for (const key of keys) {
            if (!(key in target) || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }

        target[lastKey] = value;
    }

    /**
     * Check if a feature is enabled
     * @param {string} feature - Feature name
     * @returns {boolean} True if feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.features[feature] === true;
    }

    /**
     * Toggle a feature
     * @param {string} feature - Feature name
     * @param {boolean} enabled - Enable or disable
     */
    toggleFeature(feature, enabled) {
        if (feature in this.features) {
            this.features[feature] = enabled;
            console.log(`Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Get Firebase configuration object
     * @returns {Object} Firebase configuration
     */
    getFirebaseConfig() {
        return {
            apiKey: this.firebase.apiKey,
            authDomain: this.firebase.authDomain,
            databaseURL: this.firebase.databaseURL,
            projectId: this.firebase.projectId,
            storageBucket: this.firebase.storageBucket,
            messagingSenderId: this.firebase.messagingSenderId,
            appId: this.firebase.appId
        };
    }

    /**
     * Log a message based on configured log level
     * @param {string} level - Log level
     * @param {...*} args - Arguments to log
     */
    log(level, ...args) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevel = levels.indexOf(this.dev.logLevel);
        const messageLevel = levels.indexOf(level);

        if (messageLevel >= currentLevel) {
            console[level](...args);
        }
    }

    /**
     * Export configuration as JSON
     * @returns {string} JSON string of configuration
     */
    export() {
        return JSON.stringify({
            firebase: this.firebase,
            features: this.features,
            api: this.api,
            ui: this.ui,
            performance: this.performance,
            dev: this.dev,
            storage: this.storage
        }, null, 2);
    }

    /**
     * Import configuration from JSON
     * @param {string} json - JSON string of configuration
     */
    import(json) {
        try {
            const config = JSON.parse(json);
            Object.assign(this, config);
            console.log('Configuration imported successfully');
        } catch (error) {
            console.error('Failed to import configuration:', error);
        }
    }

    /**
     * Reset to default configuration
     */
    reset() {
        const defaultConfig = new TippyConfig();
        Object.assign(this, defaultConfig);
        console.log('Configuration reset to defaults');
    }
}

// Export singleton instance
export const config = new TippyConfig();

// Also export class for custom instances
export default TippyConfig;