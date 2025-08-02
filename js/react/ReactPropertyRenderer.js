/**
 * React Property Renderer
 * Bridge between existing property system and React components
 */

import { renderReactComponent, unmountReactComponent } from './react-bootstrap.js';

export class ReactPropertyRenderer {
    constructor() {
        this.mountedComponents = new Map();
        this.componentTypes = new Map();
        
        // Register component types
        this.registerDefaultComponents();
    }
    
    /**
     * Register default React components for property types
     */
    async registerDefaultComponents() {
        // Load component modules dynamically
        const modules = {
            ColorPicker: () => window.loadJSXModule(`${window.repoUrl}/react/components/common/ColorPicker.jsx`),
            Vector3Input: () => window.loadJSXModule(`${window.repoUrl}/react/components/common/Vector3Input.jsx`),
            NumberInput: () => window.loadJSXModule(`${window.repoUrl}/react/components/common/NumberInput.jsx`),
            SelectDropdown: () => window.loadJSXModule(`${window.repoUrl}/react/components/common/SelectDropdown.jsx`),
            AssetPicker: () => window.loadJSXModule(`${window.repoUrl}/react/components/common/AssetPicker.jsx`),
            SliderInput: () => window.loadJSXModule(`${window.repoUrl}/react/components/common/SliderInput.jsx`)
        };
        
        // Map property types to components
        this.componentTypes.set('Color', 'ColorPicker');
        this.componentTypes.set('Vector3', 'Vector3Input');
        this.componentTypes.set('number', 'NumberInput');
        this.componentTypes.set('float', 'NumberInput');
        this.componentTypes.set('int', 'NumberInput');
        this.componentTypes.set('enum', 'SelectDropdown');
        this.componentTypes.set('Texture', 'AssetPicker');
        this.componentTypes.set('Material', 'AssetPicker');
        this.componentTypes.set('AudioClip', 'AssetPicker');
        this.componentTypes.set('slider', 'SliderInput');
        
        // Store module loaders
        this.moduleLoaders = modules;
    }
    
    /**
     * Check if a property type has a React component
     */
    hasReactComponent(propertyType) {
        return this.componentTypes.has(propertyType);
    }
    
    /**
     * Render a React property component
     */
    async renderProperty(container, property, component, options = {}) {
        const { onChange, onChangeComplete } = options;
        
        // Determine component type
        let componentType = property.type;
        
        // Check for special cases
        if (property.constraints?.slider) {
            componentType = 'slider';
        } else if (property.constraints?.options) {
            componentType = 'enum';
        }
        
        const componentName = this.componentTypes.get(componentType);
        if (!componentName) {
            console.warn(`No React component for property type: ${componentType}`);
            return false;
        }
        
        // Load component module if not already loaded
        if (!this[componentName]) {
            const loader = this.moduleLoaders[componentName];
            if (loader) {
                try {
                    const module = await loader();
                    this[componentName] = module[componentName];
                } catch (error) {
                    console.error(`Failed to load React component ${componentName}:`, error);
                    return false;
                }
            }
        }
        
        const ReactComponent = this[componentName];
        if (!ReactComponent) {
            console.error(`React component ${componentName} not found`);
            return false;
        }
        
        // Prepare props based on component type
        const props = this.prepareProps(componentName, property, component, { onChange, onChangeComplete });
        
        // Create container div if needed
        let reactContainer = container.querySelector('.react-property-container');
        if (!reactContainer) {
            reactContainer = document.createElement('div');
            reactContainer.className = 'react-property-container';
            container.appendChild(reactContainer);
        }
        
        // Render the component
        try {
            renderReactComponent(ReactComponent, props, reactContainer);
            this.mountedComponents.set(container, reactContainer);
            return true;
        } catch (error) {
            console.error('Failed to render React component:', error);
            return false;
        }
    }
    
    /**
     * Prepare props for specific component types
     */
    prepareProps(componentName, property, component, handlers) {
        const baseProps = {
            value: property.value,
            label: property.displayName || property.name,
            disabled: property.readonly,
            onChange: handlers.onChange,
            onChangeComplete: handlers.onChangeComplete
        };
        
        switch (componentName) {
            case 'NumberInput':
                return {
                    ...baseProps,
                    min: property.constraints?.min ?? -Infinity,
                    max: property.constraints?.max ?? Infinity,
                    step: property.constraints?.step ?? (property.type === 'int' ? 1 : 0.01),
                    precision: property.type === 'int' ? 0 : 3
                };
                
            case 'SliderInput':
                return {
                    ...baseProps,
                    min: property.constraints?.min ?? 0,
                    max: property.constraints?.max ?? 1,
                    step: property.constraints?.step ?? 0.01,
                    unit: property.constraints?.unit || ''
                };
                
            case 'SelectDropdown':
                return {
                    ...baseProps,
                    options: property.constraints?.options || [],
                    searchable: (property.constraints?.options?.length || 0) > 10
                };
                
            case 'AssetPicker':
                return {
                    ...baseProps,
                    assetType: property.type,
                    placeholder: `Select ${property.type}...`
                };
                
            case 'Vector3Input':
                return {
                    ...baseProps,
                    labels: property.constraints?.labels || ['X', 'Y', 'Z'],
                    step: property.constraints?.step ?? 0.01
                };
                
            case 'ColorPicker':
                return {
                    ...baseProps
                };
                
            default:
                return baseProps;
        }
    }
    
    /**
     * Unmount a React component from container
     */
    unmountProperty(container) {
        const reactContainer = this.mountedComponents.get(container);
        if (reactContainer) {
            unmountReactComponent(reactContainer);
            this.mountedComponents.delete(container);
            reactContainer.remove();
        }
    }
    
    /**
     * Unmount all React components
     */
    unmountAll() {
        this.mountedComponents.forEach((reactContainer, container) => {
            unmountReactComponent(reactContainer);
            reactContainer.remove();
        });
        this.mountedComponents.clear();
    }
    
    /**
     * Check if React is enabled
     */
    isEnabled() {
        return window.inspector?.useReact || false;
    }
}

// Create singleton instance
export const reactPropertyRenderer = new ReactPropertyRenderer();