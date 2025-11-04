/**
 * InventoryAPI - Client-side API for inventory operations
 * Proxies all write operations through the auth server
 * Following the same pattern as feedback-api.js
 */
export class InventoryAPI {
    constructor(baseUrl) {
        // Auto-detect environment
        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';

        if (baseUrl) {
            this.baseUrl = baseUrl;
        } else if (isLocalhost) {
            // Development environment
            this.baseUrl = 'http://localhost:3303';
        } else {
            // Production environment
            this.baseUrl = 'https://auth.tippy.dev';
        }

        this.apiPath = '/api/inventory';
        console.log('InventoryAPI initialized with base URL:', this.baseUrl);
    }

    /**
     * Generic request method with error handling
     */
    async _request(endpoint, options = {}) {
        const url = `${this.baseUrl}${this.apiPath}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            if (data.success === false) {
                throw new Error(data.error || 'Operation failed');
            }

            return data;
        } catch (error) {
            console.error('InventoryAPI request failed:', error);
            throw error;
        }
    }

    /**
     * Item operations
     */
    async createItem(item) {
        return this._request('/items', {
            method: 'POST',
            body: JSON.stringify({
                item,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    async updateItem(itemName, updates) {
        return this._request(`/items/${encodeURIComponent(itemName)}`, {
            method: 'PUT',
            body: JSON.stringify({
                updates,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    async deleteItem(itemName) {
        return this._request(`/items/${encodeURIComponent(itemName)}`, {
            method: 'DELETE',
            body: JSON.stringify({
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    /**
     * Folder operations
     */
    async createFolder(folderData) {
        return this._request('/folders', {
            method: 'POST',
            body: JSON.stringify({
                folder: folderData,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    async updateFolder(folderKey, updates) {
        return this._request(`/folders/${encodeURIComponent(folderKey)}`, {
            method: 'PUT',
            body: JSON.stringify({
                updates,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    async deleteFolder(folderKey) {
        return this._request(`/folders/${encodeURIComponent(folderKey)}`, {
            method: 'DELETE',
            body: JSON.stringify({
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    /**
     * Bulk operations
     */
    async bulkUpload(contents) {
        return this._request('/bulk', {
            method: 'POST',
            body: JSON.stringify({
                contents,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    /**
     * Image upload operation
     */
    async uploadImage(file, metadata) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('metadata', JSON.stringify({
            ...metadata,
            userName: SM.myName(),
            secret: net.secret,
            folder: metadata.folder || null
        }));

        const url = `${this.baseUrl}${this.apiPath}/images`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(data.error || 'Image upload failed');
            }

            return data;
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }

    /**
     * Public folder discovery
     */
    async getPublicFolders(username) {
        return this._request(`/public/${encodeURIComponent(username)}`, {
            method: 'GET'
        });
    }

    /**
     * Get user's inventory structure (folders and items)
     */
    async getUserInventory(userName = null) {
        const user = userName || SM.myName();
        return this._request(`/users/${encodeURIComponent(user)}`, {
            method: 'GET'
        });
    }

    /**
     * Sync item to Firebase (write operation)
     */
    async syncItem(itemName, item) {
        // For items in folders, we need to include the full path
        const path = item.folder ? `${item.folder}/${itemName}` : itemName;

        return this._request('/sync/item', {
            method: 'POST',
            body: JSON.stringify({
                path,
                item,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    /**
     * Sync folder metadata to Firebase
     */
    async syncFolder(folderKey, folder) {
        return this._request('/sync/folder', {
            method: 'POST',
            body: JSON.stringify({
                folderKey,
                folder,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    /**
     * Delete item from Firebase
     */
    async removeFromFirebase(itemPath) {
        return this._request('/sync/remove', {
            method: 'DELETE',
            body: JSON.stringify({
                path: itemPath,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    /**
     * Import data from a Firebase reference
     */
    async importFromFirebase(firebaseRef, parentFolder = null, minUpdateTime = null) {
        return this._request('/import/firebase', {
            method: 'POST',
            body: JSON.stringify({
                firebaseRef,
                parentFolder,
                minUpdateTime,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    /**
     * Import public folders from a user
     */
    async importPublicUserFolders(targetUsername) {
        return this._request('/import/user-public', {
            method: 'POST',
            body: JSON.stringify({
                targetUsername,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    /**
     * Import folder contents
     */
    async importFolderContents(folderPath) {
        return this._request('/import/folder', {
            method: 'POST',
            body: JSON.stringify({
                folderPath,
                userName: SM.myName(),
                secret: net.secret
            })
        });
    }

    /**
     * Check if API is available (health check)
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}${this.apiPath}/health`, {
                method: 'GET',
                credentials: 'include'
            });
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    /**
     * Offline queue management (for future implementation)
     */
    queueOfflineOperation(operation) {
        // Store operation in localStorage for later retry
        const queue = JSON.parse(localStorage.getItem('inventory_offline_queue') || '[]');
        queue.push({
            ...operation,
            timestamp: Date.now()
        });
        localStorage.setItem('inventory_offline_queue', JSON.stringify(queue));
    }

    async processOfflineQueue() {
        const queue = JSON.parse(localStorage.getItem('inventory_offline_queue') || '[]');
        const failed = [];

        for (const operation of queue) {
            try {
                await this[operation.method](...operation.args);
            } catch (error) {
                failed.push(operation);
            }
        }

        // Save failed operations back to queue
        localStorage.setItem('inventory_offline_queue', JSON.stringify(failed));
        return { processed: queue.length - failed.length, failed: failed.length };
    }
}