/**
 * React and Babel CDN Loader
 * Manages loading React, ReactDOM, and Babel for in-browser JSX transformation
 */

const REACT_VERSION = '18.2.0';
const BABEL_VERSION = '7.23.5';

// Determine if we're in development or production mode
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.search.includes('dev=true');

// React CDN URLs
const REACT_SCRIPTS = {
    development: [
        `https://unpkg.com/react@${REACT_VERSION}/umd/react.development.js`,
        `https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.development.js`,
    ],
    production: [
        `https://unpkg.com/react@${REACT_VERSION}/umd/react.production.min.js`,
        `https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js`,
    ]
};

// Babel standalone for JSX transformation
const BABEL_SCRIPT = `https://unpkg.com/@babel/standalone@${BABEL_VERSION}/babel.min.js`;

/**
 * Dynamically loads a script from a URL
 * @param {string} src - Script URL
 * @returns {Promise} - Resolves when script is loaded
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * Loads all React dependencies
 * @returns {Promise} - Resolves when all scripts are loaded
 */
export async function loadReactDependencies() {
    try {
        console.log(`Loading React dependencies (${isDevelopment ? 'development' : 'production'} mode)...`);
        
        // Load React and ReactDOM
        const reactScripts = isDevelopment ? REACT_SCRIPTS.development : REACT_SCRIPTS.production;
        for (const script of reactScripts) {
            await loadScript(script);
        }
        
        // Load Babel for JSX transformation
        await loadScript(BABEL_SCRIPT);
        
        // Configure Babel
        if (window.Babel) {
            window.Babel.registerPreset('react-inspector', {
                presets: [
                    ['react', { runtime: 'classic' }]
                ],
                plugins: []
            });
        }
        
        console.log('React dependencies loaded successfully');
        
        // Return React globals for convenience
        return {
            React: window.React,
            ReactDOM: window.ReactDOM,
            Babel: window.Babel
        };
    } catch (error) {
        console.error('Failed to load React dependencies:', error);
        throw error;
    }
}

/**
 * Transforms JSX code to JavaScript using Babel
 * @param {string} code - JSX code
 * @param {string} filename - Optional filename for better error messages
 * @returns {string} - Transformed JavaScript code
 */
export function transformJSX(code, filename = 'unknown') {
    if (!window.Babel) {
        throw new Error('Babel is not loaded. Call loadReactDependencies() first.');
    }
    
    try {
        const result = window.Babel.transform(code, {
            presets: ['react-inspector'],
            filename
        });
        return result.code;
    } catch (error) {
        console.error(`JSX transformation error in ${filename}:`, error);
        throw error;
    }
}

/**
 * Loads and transforms a JSX module
 * @param {string} url - URL of the JSX file
 * @returns {Promise<Module>} - The loaded module
 */
export async function loadJSXModule(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch JSX module: ${response.statusText}`);
        }
        
        const jsxCode = await response.text();
        const jsCode = transformJSX(jsxCode, url);
        
        // Create a data URL for the transformed code
        const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(jsCode)}`;
        
        // Dynamically import the transformed module
        return await import(dataUrl);
    } catch (error) {
        console.error(`Failed to load JSX module ${url}:`, error);
        throw error;
    }
}

// Auto-initialize if this script is loaded directly
if (typeof window !== 'undefined' && !window.ReactLoader) {
    window.ReactLoader = {
        loadReactDependencies,
        transformJSX,
        loadJSXModule
    };
}