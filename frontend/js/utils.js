/**
 * Utility Functions
 * Common helper functions used across the inspector
 */

/**
 * Format property name for display
 * Converts camelCase to Title Case
 */
export function formatPropertyName(name) {
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

/**
 * Convert RGB values to hex color
 */
export function rgbToHex(r, g, b) {
    const toHex = (n) => {
        const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

/**
 * Check if value is a Vector3-like object
 */
export function isVector3Object(value) {
    return value && 
           typeof value === 'object' && 
           'x' in value && 
           'y' in value && 
           'z' in value &&
           Object.keys(value).length === 3;
}

/**
 * Check if value is a Vector4-like object
 */
export function isVector4Object(value) {
    return value && 
           typeof value === 'object' && 
           'x' in value && 
           'y' in value && 
           'z' in value &&
           'w' in value &&
           Object.keys(value).length === 4;
}

/**
 * Check if value is a Quaternion (used for rotations)
 */
export function isQuaternion(value) {
    return value && 
           typeof value === 'object' && 
           'x' in value && 
           'y' in value && 
           'z' in value &&
           'w' in value &&
           typeof value.x === 'number' &&
           typeof value.y === 'number' &&
           typeof value.z === 'number' &&
           typeof value.w === 'number';
}

/**
 * Convert Quaternion to Euler angles (in degrees)
 */
export function quaternionToEuler(q) {
    // Normalize quaternion
    const norm = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
    const x = q.x / norm;
    const y = q.y / norm;
    const z = q.z / norm;
    const w = q.w / norm;
    
    // Convert to Euler angles using ZYX order (Unity's default)
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);
    
    const sinp = 2 * (w * y - z * x);
    let pitch;
    if (Math.abs(sinp) >= 1) {
        pitch = Math.sign(sinp) * Math.PI / 2; // Use 90 degrees if out of range
    } else {
        pitch = Math.asin(sinp);
    }
    
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);
    
    // Convert radians to degrees
    return {
        x: pitch * 180 / Math.PI,
        y: yaw * 180 / Math.PI,
        z: roll * 180 / Math.PI
    };
}
window.quaternionToEuler = quaternionToEuler;
/**
 * Convert Euler angles (in degrees) to Quaternion
 */
export function eulerToQuaternion(euler) {
    // Convert degrees to radians
    const pitch = euler.x * Math.PI / 180;
    const yaw = euler.y * Math.PI / 180;
    const roll = euler.z * Math.PI / 180;
    
    // Calculate quaternion using ZYX order (Unity's default)
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);
    
    return {
        w: cr * cp * cy + sr * sp * sy,
        x: sr * cp * cy - cr * sp * sy,
        y: cr * sp * cy + sr * cp * sy,
        z: cr * cp * sy - sr * sp * cy
    };
}
window.eulerToQuaternion = eulerToQuaternion;
/**
 * Check if value is a Color object (RGBA)
 */
export function isColorObject(value) {
    return value && 
           typeof value === 'object' && 
           'r' in value && 
           'g' in value && 
           'b' in value;
}

/**
 * Deep clone an object
 */
export function deepClone(obj, exclude=[], remove_all_underscores=true) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item, exclude));
    }
    
    const clonedObj = {};
    for (const key in obj) {
        if(exclude.includes(key)) continue;
        if(remove_all_underscores && key.startsWith("_")) continue;
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key], exclude);
        }
    }
    
    return clonedObj;
}

/**
 * Debounce function execution
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Format number with fixed decimal places
 */
export function formatNumber(value, decimals = 3) {
    return parseFloat(value.toFixed(decimals));
}

/**
 * Parse string value to appropriate type
 */
export function parseValue(value) {
    if (typeof value !== 'string') return value;
    
    value = value.trim();
    
    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Number
    if (!isNaN(value) && value !== '') {
        return parseFloat(value);
    }
    
    // JSON
    if (value.startsWith('{') || value.startsWith('[')) {
        try {
            return JSON.parse(value);
        } catch (e) {
            // Return as string if parse fails
        }
    }
    
    return value;
}

/**
 * Get nested property value from object
 */
export function getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested property value in object
 */
export function setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
}

/**
 * Compare two objects for equality
 */
export function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
}

/**
 * Throttle function execution
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Create a safe function name from a string
 */
export function toSafeName(str) {
    return str
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^(\d)/, '_$1')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Get component icon based on type
 */
export function getComponentIcon(componentType) {
    const icons = {
        'Transform': '⊹',
        'BanterRigidbody': '⚛',
        'BoxCollider': '□',
        'SphereCollider': '○',
        'CapsuleCollider': '◯',
        'MeshCollider': '▣',
        'BanterGeometry': '◆',
        'BanterMaterial': '🎨',
        'BanterText': 'T',
        'BanterAudioSource': '🔊',
        'BanterVideoPlayer': '▶',
        'BanterBrowser': '🌐',
        'BanterGLTF': '📦',
        'BanterAssetBundle': '📁',
        'BanterGrabHandle': '✋',
        'BanterHeldEvents': '👆',
        'BanterAttachedObject': '📌',
        'BanterSyncedObject': '🔄',
        'BanterBillboard': '👁',
        'BanterMirror': '🪞',
        'BanterPortal': '🌀'
    };
    
    return icons[componentType] || '●';
}

export function parseBest(str) {
    if (typeof str !== 'string') return str; // Already not a string

    // Trim whitespace
    const trimmed = str.trim();

    // Handle booleans
    if (trimmed.toLowerCase() === "true") return true;
    if (trimmed.toLowerCase() === "false") return false;

    // Handle null
    if (trimmed.toLowerCase() === "null") return null;

    // Handle undefined
    if (trimmed.toLowerCase() === "undefined") return undefined;

    // Handle numbers (int, float, negative, exponential)
    if (!isNaN(trimmed) && trimmed !== '') {
        return Number(trimmed);
    }

    // Handle JSON objects/arrays
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            // If invalid JSON, just return as string
        }
    }

    // Default: return the original string
    return str;
}

export function appendToShell(tag, id, str){
    if(window.logger && window.logger.include[tag]){
        let shellEl = document.getElementById("lifecycleShell");
        if(!shellEl) return;

        const children = shellEl.children;
        if (children.length >= 500) {
            shellEl.removeChild(children[0]);
        }

        const div = document.createElement('div');
        div.className = 'change-item';
        div.id = id;
        div.style.whiteSpace = 'pre-wrap';
        div.style.fontFamily = 'monospace';

        if(window.logger && window.logger.getTagColor){
            const color = tag === "error" ? "red" : window.logger.getTagColor(tag);
            div.innerHTML = `<span style="color: ${color}; font-weight: bold">[${tag.toUpperCase()}]:</span> ${str}`;
        } else {
            div.textContent = str;
            if(tag === "error"){
                div.style.color = "red";
            }
        }

        shellEl.appendChild(div);
        shellEl.scrollTop = shellEl.scrollHeight;
    }
}

/**
 * Custom confirm modal to replace browser's confirm()
 * Returns a promise that resolves to true/false based on user choice
 */
export function confirm(message) {
    return new Promise((resolve) => {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'custom-confirm-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
        `;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;
        
        // Add message
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            color: #fff;
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.5;
        `;
        modalContent.appendChild(messageDiv);
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        `;
        
        // Create Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            padding: 8px 16px;
            background: #444;
            color: #fff;
            border: 1px solid #555;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        `;
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#555';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#444';
        
        // Create OK button
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.style.cssText = `
            padding: 8px 16px;
            background: #0066cc;
            color: #fff;
            border: 1px solid #0077dd;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        `;
        okBtn.onmouseover = () => okBtn.style.background = '#0077dd';
        okBtn.onmouseout = () => okBtn.style.background = '#0066cc';
        
        // Add click handlers
        cancelBtn.onmousedown = () => {
            document.body.removeChild(modal);
            resolve(false);
        };
        
        okBtn.onmousedown = () => {
            document.body.removeChild(modal);
            resolve(true);
        };
        
        // Handle Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Assemble modal
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(okBtn);
        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Focus OK button for keyboard navigation
        okBtn.focus();
    });
}

export function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'editor-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}


export class Logger{
    constructor(){
        this.include = {
            error: true,
            command: true,
            script: true,
            oneShot: false,
            spaceProps: false
        }
        this.tagColors = {};
        // Store original console methods
        this.originalLog = console.log.bind(console);
        this.originalError = console.error.bind(console);
        this.active = true;
    }

    hashStringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = Math.abs(hash % 360);
        const saturation = 60 + (Math.abs(hash >> 8) % 30);
        const lightness = 50 + (Math.abs(hash >> 16) % 30);
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    getTagColor(tag) {
        if (!this.tagColors[tag]) {
            this.tagColors[tag] = this.hashStringToColor(tag);
        }
        return this.tagColors[tag];
    }

    getCallerInfo() {
        const stack = new Error().stack;
        const stackLines = stack.split('\n');
        // Skip lines until we find one that's not part of the logger
        for (let i = 2; i < stackLines.length; i++) {
            const line = stackLines[i];
            // Skip internal logger methods, window.log/err bindings, and getCallerInfo
            if (!line.includes('Logger.') && 
                !line.includes('bound ') && 
                !line.includes('getCallerInfo') &&
                !line.includes('window.log') &&
                !line.includes('window.err')) {
                // Extract file path and line number
                const match = line.match(/(?:at\s+)?(?:.*?\s+\()?(.+?):(\d+):(\d+)\)?$/);
                if (match) {
                    const filePath = match[1];
                    const lineNum = match[2];
                    const colNum = match[3];
                    // Get just the filename from the path
                    const fileName = filePath.split('/').pop();
                    return { fileName, lineNum, colNum, fullPath: filePath };
                }
            }
        }
        return null;
    }

    // Create a proxy function that preserves the caller's stack
    createLogProxy(tag, isError = false) {
        const color = this.getTagColor(tag);
        const logger = this;
        
        // Return a function that will be called directly from the caller's context
        return function(...args) {
            // Direct console call preserves the stack trace
            if (isError) {
                console.error(`%c[${tag.toUpperCase()}]:%c`, `color: ${color}; font-weight: bold`, 'color: inherit', ...args);
            } else {
                console.log(`%c[${tag.toUpperCase()}]:%c`, `color: ${color}; font-weight: bold`, 'color: inherit', ...args);
            }
            
            // Handle lifecycle shell separately
            if(logger.include[tag]){
                const callerInfo = logger.getCallerInfo();
                const message = args.map(a=>(typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
                const locationInfo = callerInfo ? ` (${callerInfo.fileName}:${callerInfo.lineNum})` : '';
                appendToShell(isError ? "error" : tag, generateId(isError ? 'error' : 'log'), message + locationInfo);
            }
        };
    }

    log(tag, ...args){
        // Create and immediately call the proxy to preserve stack
        this.createLogProxy(tag, false)(...args);
    }

    err(tag, ...args){
        // Create and immediately call the proxy to preserve stack
        this.createLogProxy(tag, true)(...args);
    }
}

window.logger = new Logger();

// Store original console methods
const _originalLog = console.log;
const _originalError = console.error;

// Create custom log that shows correct source location
window.log = function(tag, ...args) {
    if(!window.logger.active) return;
    const color = window.logger.getTagColor(tag);
    const callerInfo = window.logger.getCallerInfo();

    // Truncate excessively long arguments for console display
    const MAX_ARG_LENGTH = 1000;
    const truncatedArgs = args.map(arg => {
        if (typeof arg === 'string' && arg.length > MAX_ARG_LENGTH) {
            return arg.substring(0, MAX_ARG_LENGTH) + '... [truncated]';
        }
        return arg;
    });

    // Create nicely formatted output with inline location
    if (callerInfo) {
        console.groupCollapsed(
            `%c[${tag.toUpperCase()}]%c @ ${callerInfo.fileName}:${callerInfo.lineNum}%c`,
            `color: ${color}; font-weight: bold`,
            'color: #888; font-size: 0.9em',
            'color: inherit',
            ...truncatedArgs
        );
        console.trace('Stack trace');
        console.groupEnd();
    } else {
        _originalLog.apply(console, [`%c[${tag.toUpperCase()}]:%c`, `color: ${color}; font-weight: bold`, 'color: inherit', ...truncatedArgs]);
    }

    // Handle lifecycle shell
    if(window.logger.include[tag]){
        const MAX_MESSAGE_LENGTH = 5000;
        let message = args.map(a=>{
            if(typeof a === "object") {
                try {
                    const str = JSON.stringify(a);
                    return str && str.length > MAX_ARG_LENGTH ? str.substring(0, MAX_ARG_LENGTH) + '...[truncated]' : str;
                } catch(e) {
                    return '[circular object]';
                }
            }
            const str = String(a);
            return str.length > MAX_ARG_LENGTH ? str.substring(0, MAX_ARG_LENGTH) + '...[truncated]' : str;
        }).join(" ");

        // Final truncation check for complete message
        if (message.length > MAX_MESSAGE_LENGTH) {
            message = message.substring(0, MAX_MESSAGE_LENGTH) + '... [message truncated]';
        }

        const locationInfo = callerInfo ? ` (${callerInfo.fileName}:${callerInfo.lineNum})` : '';
        appendToShell(tag, generateId('log'), message + locationInfo);
    }
};

window.err = function(tag, ...args) {
    const color = window.logger.getTagColor(tag);
    const callerInfo = window.logger.getCallerInfo();

    // Truncate excessively long arguments for console display
    const MAX_ARG_LENGTH = 1000;
    const truncatedArgs = args.map(arg => {
        if (typeof arg === 'string' && arg.length > MAX_ARG_LENGTH) {
            return arg.substring(0, MAX_ARG_LENGTH) + '... [truncated]';
        } else if (typeof arg === 'object') {
            try {
                const str = JSON.stringify(arg);
                if (str && str.length > MAX_ARG_LENGTH) {
                    return str.substring(0, MAX_ARG_LENGTH) + '... [truncated object]';
                }
                return arg;
            } catch(e) {
                return '[circular or complex object]';
            }
        }
        return arg;
    });

    // Create nicely formatted output with inline location
    if (callerInfo) {
        console.groupCollapsed(
            `%c[${tag.toUpperCase()}]%c @ ${callerInfo.fileName}:${callerInfo.lineNum}%c`,
            `color: ${color}; font-weight: bold`,
            'color: #f88; font-size: 0.9em',
            'color: inherit',
            ...truncatedArgs
        );
        console.trace('Stack trace');
        console.groupEnd();
    } else {
        _originalError.apply(console, [`%c[${tag.toUpperCase()}]:%c`, `color: ${color}; font-weight: bold`, 'color: inherit', ...truncatedArgs]);
    }

    // Handle lifecycle shell
    if(window.logger.include[tag]){
        const MAX_MESSAGE_LENGTH = 5000;
        let message = args.map(a=>{
            if(typeof a === "object") {
                try {
                    const str = JSON.stringify(a);
                    return str && str.length > MAX_ARG_LENGTH ? str.substring(0, MAX_ARG_LENGTH) + '...[truncated]' : str;
                } catch(e) {
                    return '[circular object]';
                }
            }
            const str = String(a);
            return str.length > MAX_ARG_LENGTH ? str.substring(0, MAX_ARG_LENGTH) + '...[truncated]' : str;
        }).join(" ");

        // Final truncation check for complete message
        if (message.length > MAX_MESSAGE_LENGTH) {
            message = message.substring(0, MAX_MESSAGE_LENGTH) + '... [message truncated]';
        }

        const locationInfo = callerInfo ? ` (${callerInfo.fileName}:${callerInfo.lineNum})` : '';
        appendToShell("error", generateId('error'), message + locationInfo);
    }
};

window.showNotification = showNotification;

window.TransformOps = {
    Add: (vec1, vec2)=>{
        return {
            x: vec1.x + vec2.x,
            y: vec1.y + vec2.y,
            z: vec1.z + vec2.z
        }
    },
    Subtract: (vec1, vec2)=>{
        return {
            x: vec1.x - vec2.x,
            y: vec1.y - vec2.y,
            z: vec1.z - vec2.z
        }
    },
    Multiply: (vec1, vec2)=>{
        if(typeof vec2 === "number"){
            return {
                x: vec1.x * vec2,
                y: vec1.y * vec2,
                z: vec1.z * vec2
            }
        }
        if(typeof vec1 === "number"){
            return {
                x: vec1 * vec2.x,
                y: vec1 * vec2.y,
                z: vec1 * vec2.z
            }
        }
        
        return {
            x: vec1.x * vec2.x,
            y: vec1.y * vec2.y,
            z: vec1.z * vec2.z
        }
    },
    Divide: (vec1, vec2)=>{
        if(typeof vec2 === "number"){
            return {
                x: vec1.x / vec2,
                y: vec1.y / vec2,
                z: vec1.z / vec2
            }
        }
        if(typeof vec1 === "number"){
            return {
                x: vec1 / vec2.x,
                y: vec1 / vec2.y,
                z: vec1 / vec2.z
            }
        }
        return {
            x: vec1.x / vec2.x,
            y: vec1.y / vec2.y,
            z: vec1.z / vec2.z
        }
    }
}



function qNormalize(q) {
    const n = Math.hypot(q.x, q.y, q.z, q.w) || 1;
    return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n };
}
function qConjugate(q) {
    return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}
function qMul(a, b) {
    return {
        w: a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z,
        x: a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y,
        y: a.w*b.y - a.x*b.z + a.y*b.w + a.z*b.x,
        z: a.w*b.z + a.x*b.y - a.y*b.x + a.z*b.w,
    };
}

function normalizeVec3(v){
    const n = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x/n, y: v.y/n, z: v.z/n };
}

function qTwistAroundAxis(qIn, axis) {
    const q = qNormalize(qIn);
    const a = normalizeVec3(axis);
    // project vector part of q onto axis
    const dot = q.x*a.x + q.y*a.y + q.z*a.z;
    const vProj = { x: a.x*dot, y: a.y*dot, z: a.z*dot };
    const twist = qNormalize({ x: vProj.x, y: vProj.y, z: vProj.z, w: q.w });
    // If twist became degenerate (can happen for 180° with opposite sign), fix sign
    // so it represents the shortest-arc rotation about axis:
    if (twist.w < 0) {
      return { x: -twist.x, y: -twist.y, z: -twist.z, w: -twist.w };
    }
    return twist;
}

function qLockAxis(qIn, axis) {
    const twist = qTwistAroundAxis(qIn, axis);
    return qNormalize(qMul(qIn, qConjugate(twist)));
}

function qKeepOnlyAxis(qIn, axis) {
    return qTwistAroundAxis(qIn, axis);
}

const X_AXIS = { x: 1, y: 0, z: 0 };
const Y_AXIS = { x: 0, y: 1, z: 0 };
const Z_AXIS = { x: 0, y: 0, z: 1 };

window.lockQuaternionAxes = (q, lockX = false, lockY = false, lockZ = false) =>{
    q = qNormalize(q);
    if (lockX) q = qLockAxis(q, X_AXIS);
    if (lockY) q = qLockAxis(q, Y_AXIS);
    if (lockZ) q = qLockAxis(q, Z_AXIS);
    return qNormalize(q);
}