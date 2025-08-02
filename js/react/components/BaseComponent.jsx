/**
 * Base React Component with common patterns for Unity Inspector
 * Provides common functionality for all React components in the migration
 */

const { React, useEffect, useState, useCallback, useMemo } = window;

export const BaseComponent = ({ children, className = '', ...props }) => {
    return React.createElement('div', { className: `react-component ${className}`, ...props }, children);
};

/**
 * Higher-order component for Unity Bridge integration
 */
export const withUnityBridge = (Component) => {
    return (props) => {
        const [connected, setConnected] = useState(false);
        
        useEffect(() => {
            const checkConnection = () => {
                setConnected(window.SM && window.SM.scene !== null);
            };
            
            checkConnection();
            window.addEventListener('scene-updated', checkConnection);
            
            return () => window.removeEventListener('scene-updated', checkConnection);
        }, []);
        
        return React.createElement(Component, { ...props, unityConnected: connected });
    };
};

/**
 * Common prop types for inspector components
 */
export const InspectorPropTypes = {
    // Common property descriptor
    property: {
        name: 'string',
        type: 'string',
        value: 'any',
        defaultValue: 'any',
        constraints: 'object',
        readonly: 'boolean'
    },
    
    // Component reference
    component: {
        id: 'string',
        type: 'string',
        properties: 'object'
    },
    
    // Slot/GameObject reference
    slot: {
        id: 'string',
        name: 'string',
        active: 'boolean',
        components: 'array',
        children: 'array'
    }
};

/**
 * Common hooks for inspector functionality
 */

// Hook for managing property changes with undo/redo
export const usePropertyChange = (component, property) => {
    const [value, setValue] = useState(property.value);
    const [tempValue, setTempValue] = useState(value);
    
    const handleChange = useCallback((newValue) => {
        setTempValue(newValue);
    }, []);
    
    const handleChangeComplete = useCallback((finalValue) => {
        if (finalValue !== value) {
            // Create change object for undo/redo
            const change = new window.ComponentPropertyChange(
                component.id,
                property.name,
                value,
                finalValue
            );
            window.changeManager.addChange(change);
            setValue(finalValue);
        }
    }, [component.id, property.name, value]);
    
    useEffect(() => {
        setValue(property.value);
        setTempValue(property.value);
    }, [property.value]);
    
    return {
        value: tempValue,
        onChange: handleChange,
        onChangeComplete: handleChangeComplete
    };
};

// Hook for selection state
export const useSelection = () => {
    const [selectedSlot, setSelectedSlot] = useState(window.SM?.selectedSlot);
    const [selectedComponent, setSelectedComponent] = useState(null);
    
    useEffect(() => {
        const handleSelectionChange = () => {
            setSelectedSlot(window.SM?.selectedSlot);
        };
        
        window.addEventListener('slot-selected', handleSelectionChange);
        return () => window.removeEventListener('slot-selected', handleSelectionChange);
    }, []);
    
    return { selectedSlot, selectedComponent, setSelectedComponent };
};

// Hook for UI state persistence
export const useUIState = (key, defaultValue) => {
    const storageKey = `inspector_ui_${key}`;
    
    const [state, setState] = useState(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    });
    
    const setPersistentState = useCallback((newState) => {
        setState(newState);
        try {
            localStorage.setItem(storageKey, JSON.stringify(newState));
        } catch (e) {
            console.warn('Failed to persist UI state:', e);
        }
    }, [storageKey]);
    
    return [state, setPersistentState];
};

// Hook for debounced values
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        return () => clearTimeout(handler);
    }, [value, delay]);
    
    return debouncedValue;
};

/**
 * Common UI components
 */

// Collapsible section component
export const CollapsibleSection = ({ title, children, defaultExpanded = true, onToggle }) => {
    const [expanded, setExpanded] = useUIState(`section_${title}`, defaultExpanded);
    
    const handleToggle = () => {
        const newState = !expanded;
        setExpanded(newState);
        onToggle?.(newState);
    };
    
    return React.createElement('div', { className: 'collapsible-section' },
        React.createElement('div', { 
            className: 'section-header',
            onClick: handleToggle
        },
            React.createElement('span', { className: `collapse-icon ${expanded ? 'expanded' : ''}` }, '▶'),
            React.createElement('span', { className: 'section-title' }, title)
        ),
        expanded && React.createElement('div', { className: 'section-content' }, children)
    );
};

// Loading spinner
export const LoadingSpinner = ({ size = 'medium' }) => {
    return React.createElement('div', { className: `loading-spinner ${size}` },
        React.createElement('div', { className: 'spinner' })
    );
};

// Error boundary component
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        console.error('React component error:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return React.createElement('div', { className: 'error-boundary' },
                React.createElement('h3', null, 'Component Error'),
                React.createElement('p', null, this.state.error?.message || 'An error occurred'),
                React.createElement('button', {
                    onClick: () => this.setState({ hasError: false, error: null })
                }, 'Reset')
            );
        }
        
        return this.props.children;
    }
}