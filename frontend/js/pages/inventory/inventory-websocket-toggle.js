/**
 * Utility functions to toggle WebSocket usage for inventory system
 * This provides an easy way to enable/disable WebSocket without UI changes
 */

/**
 * Enable WebSocket for inventory real-time updates
 */
window.enableInventoryWebSocket = async function() {
    // Reinitialize inventory firebase with WebSocket
    if (window.inventoryInstance && window.inventoryInstance.firebase) {
        await window.inventoryInstance.firebase.initWebSocket();

        // Re-setup listeners if inventory is active
        if (window.inventoryInstance.firebase.ws) {
            window.inventoryInstance.firebase.setupFirebaseListeners();
            console.log('✅ Inventory WebSocket enabled and listeners setup');
            showNotification('WebSocket enabled for real-time inventory updates');
        }
    } else {
        console.warn('Inventory not initialized yet');
    }
};

/**
 * Disable WebSocket and clear listeners
 */
window.disableInventoryWebSocket = function() {
    if (window.inventoryInstance && window.inventoryInstance.firebase) {
        const firebase = window.inventoryInstance.firebase;

        // Clear listeners
        firebase.clearFirebaseListeners();

        // Disconnect WebSocket
        if (firebase.ws) {
            firebase.ws.disconnect();
            firebase.ws = null;
            firebase.isInitialized = false;
        }

        console.log('❌ Inventory WebSocket disabled');
        showNotification('WebSocket disabled - real-time updates unavailable');
    }
};

/**
 * Check WebSocket status
 */
window.checkInventoryWebSocketStatus = function() {
    if (!window.inventoryInstance || !window.inventoryInstance.firebase) {
        console.log('Status: Inventory not initialized');
        return false;
    }

    const firebase = window.inventoryInstance.firebase;

    if (!firebase.ws) {
        console.log('Status: WebSocket not initialized');
        return false;
    }

    if (!firebase.ws.isConnected()) {
        console.log('Status: WebSocket initialized but not connected');
        return false;
    }

    console.log('Status: WebSocket connected and active');
    console.log(`Active listeners: ${firebase.wsListeners.size} paths`);

    // List active listener paths
    if (firebase.wsListeners.size > 0) {
        console.log('Listening to:');
        firebase.wsListeners.forEach((listeners, path) => {
            console.log(`  - ${path} (${listeners.length} events)`);
        });
    }

    return true;
};

// Auto-enable WebSocket if user has opted in (can be set via console)
if (localStorage.getItem('inventory_auto_websocket') === 'true') {
    // Wait for inventory to be initialized
    const checkInterval = setInterval(() => {
        if (window.inventoryInstance && window.inventoryInstance.firebase) {
            clearInterval(checkInterval);
            console.log('Auto-enabling WebSocket for inventory...');
            window.enableInventoryWebSocket();
        }
    }, 1000);
}

// Export for module usage
export {
    enableInventoryWebSocket,
    disableInventoryWebSocket,
    checkInventoryWebSocketStatus
};