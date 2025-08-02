/**
 * React Hook for Unity Bridge Integration
 * Provides seamless access to Unity scene and components
 */

const { useState, useEffect, useCallback, useRef } = window.React;

export function useUnityBridge() {
    const [scene, setScene] = useState(window.SM?.scene);
    const [connected, setConnected] = useState(false);
    const [slots, setSlots] = useState([]);
    const eventListenersRef = useRef(new Map());
    
    // Update scene reference
    useEffect(() => {
        const checkScene = () => {
            const currentScene = window.SM?.scene;
            setScene(currentScene);
            setConnected(!!currentScene);
            
            if (currentScene) {
                // Get root slots
                const rootSlots = currentScene.slots?.filter(slot => !slot.parent) || [];
                setSlots(rootSlots);
            }
        };
        
        checkScene();
        
        // Listen for scene updates
        const handleSceneUpdate = () => checkScene();
        window.addEventListener('scene-updated', handleSceneUpdate);
        window.addEventListener('unity-loaded', handleSceneUpdate);
        
        return () => {
            window.removeEventListener('scene-updated', handleSceneUpdate);
            window.removeEventListener('unity-loaded', handleSceneUpdate);
        };
    }, []);
    
    // Get slot by ID
    const getSlot = useCallback((slotId) => {
        if (!scene) return null;
        return scene.FindSlot(slotId);
    }, [scene]);
    
    // Get component by ID
    const getComponent = useCallback((componentId) => {
        if (!scene) return null;
        // Components are stored on slots
        for (const slot of scene.slots || []) {
            const component = slot.components?.find(c => c.id === componentId);
            if (component) return component;
        }
        return null;
    }, [scene]);
    
    // Execute Unity command
    const executeCommand = useCallback((command, ...args) => {
        if (!scene) {
            console.warn('Unity scene not connected');
            return null;
        }
        
        try {
            if (typeof scene[command] === 'function') {
                return scene[command](...args);
            } else {
                console.warn(`Unknown Unity command: ${command}`);
                return null;
            }
        } catch (error) {
            console.error(`Unity command error: ${command}`, error);
            return null;
        }
    }, [scene]);
    
    // Add Unity event listener
    const addEventListener = useCallback((eventName, handler) => {
        if (!scene) return;
        
        // Store the handler reference
        const listeners = eventListenersRef.current.get(eventName) || [];
        listeners.push(handler);
        eventListenersRef.current.set(eventName, listeners);
        
        // Add to Unity scene
        scene.On(eventName, handler);
        
        // Return cleanup function
        return () => {
            const currentListeners = eventListenersRef.current.get(eventName) || [];
            const index = currentListeners.indexOf(handler);
            if (index > -1) {
                currentListeners.splice(index, 1);
                eventListenersRef.current.set(eventName, currentListeners);
            }
            
            // Remove from Unity scene if it still exists
            if (window.SM?.scene) {
                window.SM.scene.Off(eventName, handler);
            }
        };
    }, [scene]);
    
    // Cleanup all event listeners on unmount
    useEffect(() => {
        return () => {
            eventListenersRef.current.forEach((handlers, eventName) => {
                handlers.forEach(handler => {
                    if (window.SM?.scene) {
                        window.SM.scene.Off(eventName, handler);
                    }
                });
            });
            eventListenersRef.current.clear();
        };
    }, []);
    
    // Get space properties
    const getSpaceProperties = useCallback(() => {
        if (!scene) return { public: {}, protected: {} };
        
        return {
            public: scene.publicSpaceProps || {},
            protected: scene.protectedSpaceProps || {}
        };
    }, [scene]);
    
    // Set space property
    const setSpaceProperty = useCallback((type, key, value) => {
        if (!scene) return;
        
        const propMap = type === 'public' ? scene.publicSpaceProps : scene.protectedSpaceProps;
        if (propMap) {
            propMap[key] = value;
            
            // Trigger update event
            window.dispatchEvent(new CustomEvent('space-property-changed', {
                detail: { type, key, value }
            }));
        }
    }, [scene]);
    
    return {
        scene,
        connected,
        slots,
        getSlot,
        getComponent,
        executeCommand,
        addEventListener,
        getSpaceProperties,
        setSpaceProperty,
        
        // Convenience methods
        createSlot: (name, parent = null) => executeCommand('CreateSlot', name, parent),
        deleteSlot: (slotId) => executeCommand('DeleteSlot', slotId),
        setSlotProperty: (slotId, property, value) => {
            const slot = getSlot(slotId);
            if (slot) {
                slot[property] = value;
                return true;
            }
            return false;
        },
        
        // Component operations
        addComponent: (slotId, componentType) => executeCommand('AddComponent', slotId, componentType),
        removeComponent: (componentId) => executeCommand('RemoveComponent', componentId),
        setComponentProperty: (componentId, property, value) => {
            const component = getComponent(componentId);
            if (component && component.properties) {
                component.properties[property] = value;
                return true;
            }
            return false;
        }
    };
}