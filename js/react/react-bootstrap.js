/**
 * React Bootstrap Module
 * Initializes React and provides utilities for gradual migration
 */

import { loadReactDependencies } from '../react-loader.js';

let reactInitialized = false;
let reactRoots = new Map();

/**
 * Initializes React in the application
 */
export async function initializeReact() {
    if (reactInitialized) {
        console.warn('React is already initialized');
        return;
    }
    
    try {
        // Load React dependencies
        const { React, ReactDOM } = await loadReactDependencies();
        
        // Store globals for easy access
        window.React = React;
        window.ReactDOM = ReactDOM;
        
        // Create root mount points in existing UI
        createReactMountPoints();
        
        reactInitialized = true;
        console.log('React initialized successfully');
        
        // Dispatch event for other modules
        window.dispatchEvent(new CustomEvent('react-initialized'));
        
    } catch (error) {
        console.error('Failed to initialize React:', error);
        throw error;
    }
}

/**
 * Creates mount points for React components in existing HTML
 */
function createReactMountPoints() {
    // Main mount points for gradual migration
    const mountPoints = [
        { id: 'react-properties-panel', parentSelector: '#properties-panel' },
        { id: 'react-hierarchy-panel', parentSelector: '#hierarchy-panel' },
        { id: 'react-space-props-panel', parentSelector: '#space-properties-panel' },
        { id: 'react-inventory-panel', parentSelector: '#inventory-panel' },
        { id: 'react-script-editor', parentSelector: '#script-editor' }
    ];
    
    mountPoints.forEach(({ id, parentSelector }) => {
        const parent = document.querySelector(parentSelector);
        if (parent && !document.getElementById(id)) {
            const mountDiv = document.createElement('div');
            mountDiv.id = id;
            mountDiv.style.display = 'none'; // Hidden by default
            parent.appendChild(mountDiv);
        }
    });
}

/**
 * Renders a React component into a specific container
 * @param {React.Component} Component - React component to render
 * @param {Object} props - Props for the component
 * @param {string|HTMLElement} container - Container ID or element
 * @returns {Object} - React root for updates
 */
export function renderReactComponent(Component, props, container) {
    if (!reactInitialized) {
        throw new Error('React is not initialized. Call initializeReact() first.');
    }
    
    const containerEl = typeof container === 'string' 
        ? document.getElementById(container) 
        : container;
        
    if (!containerEl) {
        throw new Error(`Container not found: ${container}`);
    }
    
    // Show the React container
    containerEl.style.display = '';
    
    // Create or get React root
    let root = reactRoots.get(containerEl);
    if (!root) {
        root = ReactDOM.createRoot(containerEl);
        reactRoots.set(containerEl, root);
    }
    
    // Render the component
    root.render(React.createElement(Component, props));
    
    return root;
}

/**
 * Unmounts a React component from a container
 * @param {string|HTMLElement} container - Container ID or element
 */
export function unmountReactComponent(container) {
    const containerEl = typeof container === 'string' 
        ? document.getElementById(container) 
        : container;
        
    if (!containerEl) return;
    
    const root = reactRoots.get(containerEl);
    if (root) {
        root.unmount();
        reactRoots.delete(containerEl);
        containerEl.style.display = 'none';
    }
}

/**
 * Helper to create a React element from JSX-like syntax
 * Useful for gradual migration where we can't use JSX directly
 */
export function createElement(type, props, ...children) {
    return React.createElement(type, props, ...children);
}

/**
 * Hook to bridge with existing event system
 */
export function useUnityEvent(eventName, handler) {
    React.useEffect(() => {
        window.addEventListener(eventName, handler);
        return () => window.removeEventListener(eventName, handler);
    }, [eventName, handler]);
}

/**
 * Hook to bridge with existing scene manager
 */
export function useSceneManager() {
    const [scene, setScene] = React.useState(window.sceneManager?.scene);
    
    React.useEffect(() => {
        const handleSceneUpdate = () => {
            setScene(window.sceneManager?.scene);
        };
        
        window.addEventListener('scene-updated', handleSceneUpdate);
        return () => window.removeEventListener('scene-updated', handleSceneUpdate);
    }, []);
    
    return scene;
}

/**
 * Hook to bridge with change manager for undo/redo
 */
export function useChangeManager() {
    const [canUndo, setCanUndo] = React.useState(false);
    const [canRedo, setCanRedo] = React.useState(false);
    
    React.useEffect(() => {
        const updateState = () => {
            if (window.changeManager) {
                setCanUndo(window.changeManager.canUndo());
                setCanRedo(window.changeManager.canRedo());
            }
        };
        
        window.addEventListener('change-manager-updated', updateState);
        updateState();
        
        return () => window.removeEventListener('change-manager-updated', updateState);
    }, []);
    
    return {
        canUndo,
        canRedo,
        undo: () => window.changeManager?.undo(),
        redo: () => window.changeManager?.redo(),
        addChange: (change) => window.changeManager?.addChange(change)
    };
}

// Export utilities
export const ReactUtils = {
    renderReactComponent,
    unmountReactComponent,
    createElement,
    useUnityEvent,
    useSceneManager,
    useChangeManager
};