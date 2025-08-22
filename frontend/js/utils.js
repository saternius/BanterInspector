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
export function deepClone(obj, exclude=[]) {
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

export function appendToConsole(tag, id, str){
    if(window.logger && window.logger.include[tag]){
        let consoleEl = document.getElementById("lifecycleConsole");
        if(!consoleEl) return;
        
        const children = consoleEl.children;
        if (children.length >= 500) {
            consoleEl.removeChild(children[0]);
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
        
        consoleEl.appendChild(div);
        consoleEl.scrollTop = consoleEl.scrollHeight;
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

    log(tag, ...args){
        const color = this.getTagColor(tag);
        console.log(`%c[${tag.toUpperCase()}]:%c `, `color: ${color}; font-weight: bold`, 'color: inherit', ...args);
        if(this.include[tag]){
            const message = args.map(a=>(typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
            appendToConsole(tag, generateId('log'), message);
        }
    }

    err(tag, ...args){
        const color = this.getTagColor(tag);
        console.error(`%c[${tag.toUpperCase()}]:%c `, `color: ${color}; font-weight: bold`, 'color: inherit', ...args);
        if(this.include[tag]){
            const message = args.map(a=>(typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
            appendToConsole("error", "error_" + Math.floor(Math.random()*1000000), message);
        }
    }
}

window.logger = new Logger();
window.log = window.logger.log.bind(window.logger);
window.err = window.logger.err.bind(window.logger);
window.showNotification = showNotification;