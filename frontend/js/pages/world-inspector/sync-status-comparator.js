/**
 * Sync Status Comparator
 * Compares local Unity scene hierarchy with networked state to identify divergences
 */
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class SyncStatusComparator {
    constructor() {
        this.localCache = null;
        this.networkCache = null;
        this.divergences = new Map();
        this.lastComparisonTime = 0;
        this.comparisonThrottle = 500; // ms
    }

    /**
     * Main comparison method - compares local and network hierarchies
     * @returns {Map} Map of entity paths to divergence objects
     */
    async compare() {
        // Throttle comparisons
        const now = Date.now();
        if (now - this.lastComparisonTime < this.comparisonThrottle) {
            return this.divergences;
        }
        this.lastComparisonTime = now;

        try {
            // Get both hierarchies
            this.localCache = entities();
            this.networkCache = networking.getSpaceHeir();

            // Clear previous divergences
            this.divergences.clear();

            // Build path maps for comparison
            const localMap = this.buildPathMap(this.localCache, 'local');
            const networkMap = this.buildPathMap(this.networkCache, 'network');

            // Compare the maps
            this.compareHierarchies(localMap, networkMap);

            // Also compare component properties
            this.compareComponentProperties(localMap, networkMap);

            return this.divergences;
        } catch (error) {
            console.error('Error comparing hierarchies:', error);
            return this.divergences;
        }
    }

    /**
     * Build a map of entity paths to their data
     * @param {Object|Array} hierarchy - The hierarchy to map
     * @param {String} source - 'local' or 'network'
     * @returns {Map} Map of paths to entity data
     */
    buildPathMap(hierarchy, source) {
        const pathMap = new Map();

        const processEntity = (entity, parentPath = '') => {
            const currentPath = parentPath ? `${parentPath}/${entity.name}` : entity.name;

            // Store entity data
            pathMap.set(currentPath, {
                name: entity.name,
                active: entity.active,
                layer: entity.layer,
                position: entity.position ? { ...entity.position } : null,
                rotation: entity.rotation ? { ...entity.rotation } : null,
                scale: entity.scale ? { ...entity.scale } : null,
                localPosition: entity.localPosition ? { ...entity.localPosition } : null,
                localRotation: entity.localRotation ? { ...entity.localRotation } : null,
                localScale: entity.localScale ? { ...entity.localScale } : null,
                children: entity.children ? entity.children.map(c => c.name) : [],
                components: this.extractComponents(entity.components, source),
                source: source
            });

            // Process children recursively
            if (entity.children && Array.isArray(entity.children)) {
                entity.children.forEach(child => processEntity(child, currentPath));
            }
        };

        // Handle different hierarchy structures
        if (Array.isArray(hierarchy)) {
            hierarchy.forEach(entity => processEntity(entity));
        } else if (hierarchy && hierarchy.roots) {
            hierarchy.roots.forEach(entity => processEntity(entity));
        } else if (hierarchy) {
            processEntity(hierarchy);
        }

        return pathMap;
    }

    /**
     * Extract component information from entity components
     * @param {Array} components - Array of component objects or IDs
     * @param {String} source - 'local' or 'network' to handle different formats
     * @returns {Array} Array of component info objects
     */
    extractComponents(components, source = 'local') {
        if (!components || !Array.isArray(components)) return [];

        return components.map(comp => {
            // Network components are stored as ID strings like "Grabbable_43761"
            if (source === 'network' && typeof comp === 'string') {
                // Extract the type from the ID (part before underscore and numbers)
                const match = comp.match(/^([A-Za-z]+)(?:_\d+)?$/);
                const type = match ? match[1] : comp;

                // Get component properties from space state
                const properties = this.getNetworkComponentProperties(comp);

                return {
                    type: type,
                    id: comp,
                    properties: properties
                };
            }

            // Local components are objects with constructor names
            if (typeof comp === 'string') {
                // Sometimes components might be strings
                return { type: comp };
            } else if (comp && comp.constructor) {
                // Most common case - component objects with constructors
                let typeName = comp.constructor.name;
                // Remove "Component" suffix for comparison if present
                if (typeName.endsWith('Component')) {
                    typeName = typeName.replace(/Component$/, '');
                }

                // Extract local component properties
                const properties = this.extractLocalComponentProperties(comp);

                return {
                    type: typeName,
                    id: comp.id || null,
                    properties: properties
                };
            } else if (comp && comp.type) {
                return { type: comp.type };
            }
            return { type: 'unknown' };
        });
    }

    /**
     * Compare two hierarchy maps and identify divergences
     * @param {Map} localMap - Map of local entity paths
     * @param {Map} networkMap - Map of network entity paths
     */
    compareHierarchies(localMap, networkMap) {
        const allPaths = new Set([...localMap.keys(), ...networkMap.keys()]);

        allPaths.forEach(path => {
            const localEntity = localMap.get(path);
            const networkEntity = networkMap.get(path);
            const divergence = {
                path: path,
                types: new Set(),
                details: {},
                severity: 'low'
            };

            // Check existence divergences
            if (!localEntity && networkEntity) {
                divergence.types.add('missing-local');
                divergence.severity = 'high';
                divergence.details.existence = 'Only exists in network';
            } else if (localEntity && !networkEntity) {
                divergence.types.add('missing-network');
                divergence.severity = 'high';
                divergence.details.existence = 'Only exists locally';
            } else if (localEntity && networkEntity) {
                // Both exist, check properties
                this.compareProperties(localEntity, networkEntity, divergence);
            }

            // Only add to divergences if there are actual differences
            if (divergence.types.size > 0) {
                this.divergences.set(path, divergence);
            }
        });

        // Propagate child divergences to parents
        this.propagateChildDivergences();
    }

    /**
     * Compare properties of two entities
     * @param {Object} local - Local entity data
     * @param {Object} network - Network entity data
     * @param {Object} divergence - Divergence object to populate
     */
    compareProperties(local, network, divergence) {
        // Check active state
        if (local.active !== network.active) {
            divergence.types.add('property-active');
            divergence.details.active = {
                local: local.active,
                network: network.active
            };
            divergence.severity = 'medium';
        }

        // Check layer
        if (local.layer !== network.layer) {
            divergence.types.add('property-layer');
            divergence.details.layer = {
                local: local.layer,
                network: network.layer
            };
            divergence.severity = 'medium';
        }

        // Check transforms
        this.compareVector3(local.position, network.position, 'position', divergence);
        this.compareQuaternion(local.rotation, network.rotation, 'rotation', divergence);
        this.compareVector3(local.scale, network.scale, 'scale', divergence);
        this.compareVector3(local.localPosition, network.localPosition, 'localPosition', divergence);
        this.compareQuaternion(local.localRotation, network.localRotation, 'localRotation', divergence);
        this.compareVector3(local.localScale, network.localScale, 'localScale', divergence);

        // Check children
        const localChildren = new Set(local.children);
        const networkChildren = new Set(network.children);

        if (local.children.length !== network.children.length ||
            ![...localChildren].every(c => networkChildren.has(c))) {
            divergence.types.add('hierarchy-children');
            divergence.details.children = {
                localCount: local.children.length,
                networkCount: network.children.length,
                onlyInLocal: [...localChildren].filter(c => !networkChildren.has(c)),
                onlyInNetwork: [...networkChildren].filter(c => !localChildren.has(c))
            };
        }

        // Check components
        this.compareComponents(local.components, network.components, divergence);
    }

    /**
     * Compare Vector3 values with tolerance
     */
    compareVector3(local, network, propertyName, divergence, tolerance = 0.001) {
        if (!local && !network) return;

        if (!local || !network ||
            Math.abs((local.x || 0) - (network.x || 0)) > tolerance ||
            Math.abs((local.y || 0) - (network.y || 0)) > tolerance ||
            Math.abs((local.z || 0) - (network.z || 0)) > tolerance) {

            divergence.types.add(`property-${propertyName}`);
            divergence.details[propertyName] = {
                local: local ? { x: local.x, y: local.y, z: local.z } : null,
                network: network ? { x: network.x, y: network.y, z: network.z } : null
            };
        }
    }

    /**
     * Compare Quaternion values with tolerance
     */
    compareQuaternion(local, network, propertyName, divergence, tolerance = 0.001) {
        if (!local && !network) return;

        if (!local || !network ||
            Math.abs((local.x || 0) - (network.x || 0)) > tolerance ||
            Math.abs((local.y || 0) - (network.y || 0)) > tolerance ||
            Math.abs((local.z || 0) - (network.z || 0)) > tolerance ||
            Math.abs((local.w || 1) - (network.w || 1)) > tolerance) {

            divergence.types.add(`property-${propertyName}`);
            divergence.details[propertyName] = {
                local: local ? { x: local.x, y: local.y, z: local.z, w: local.w } : null,
                network: network ? { x: network.x, y: network.y, z: network.z, w: network.w } : null
            };
        }
    }

    /**
     * Compare component arrays
     */
    compareComponents(local, network, divergence) {
        const localTypes = new Set(local.map(c => c.type));
        const networkTypes = new Set(network.map(c => c.type));

        if (local.length !== network.length ||
            ![...localTypes].every(t => networkTypes.has(t))) {

            divergence.types.add('components');
            divergence.details.components = {
                localCount: local.length,
                networkCount: network.length,
                localTypes: [...localTypes],
                networkTypes: [...networkTypes],
                onlyInLocal: [...localTypes].filter(t => !networkTypes.has(t)),
                onlyInNetwork: [...networkTypes].filter(t => !localTypes.has(t))
            };
            divergence.severity = 'medium';
        }
    }

    /**
     * Propagate child divergences to parent nodes
     */
    propagateChildDivergences() {
        // Create a set of paths that have children with divergences
        const parentsWithDivergentChildren = new Set();

        this.divergences.forEach((_divergence, path) => {
            // Get parent path
            const lastSlash = path.lastIndexOf('/');
            if (lastSlash > 0) {
                const parentPath = path.substring(0, lastSlash);
                parentsWithDivergentChildren.add(parentPath);
            }
        });

        // Add or update parent divergences
        parentsWithDivergentChildren.forEach(parentPath => {
            const existing = this.divergences.get(parentPath);
            if (existing) {
                existing.types.add('has-child-divergences');
            } else {
                this.divergences.set(parentPath, {
                    path: parentPath,
                    types: new Set(['has-child-divergences']),
                    details: {},
                    severity: 'info'
                });
            }
        });
    }

    /**
     * Get a summary of divergences by type
     */
    getSummary() {
        const summary = {
            total: this.divergences.size,
            byType: {},
            bySeverity: {
                high: 0,
                medium: 0,
                low: 0,
                info: 0
            }
        };

        this.divergences.forEach(divergence => {
            divergence.types.forEach(type => {
                summary.byType[type] = (summary.byType[type] || 0) + 1;
            });
            summary.bySeverity[divergence.severity]++;
        });

        return summary;
    }

    /**
     * Get status indicator for an entity path
     * @param {String} path - Entity path
     * @returns {String} Status indicator (synced/warning/error/missing)
     */
    getEntityStatus(path) {
        const divergence = this.divergences.get(path);
        if (!divergence) return 'synced';

        if (divergence.types.has('missing-local') || divergence.types.has('missing-network')) {
            return 'missing';
        }
        if (divergence.types.has('property-active') || divergence.types.has('property-layer') ||
            divergence.types.has('component-properties')) {
            return 'error';
        }
        if (divergence.types.has('has-child-divergences')) {
            return 'warning';
        }
        return 'warning';
    }

    /**
     * Get component properties from network space state
     * @param {String} componentId - Component ID like "Material_59130"
     * @returns {Object} Component properties
     */
    getNetworkComponentProperties(componentId) {
        if (!SM?.scene?.spaceState?.public) return {};

        const publicProps = SM.scene.spaceState.public;
        const properties = {};

        // Component properties are stored with __ prefix
        const prefix = `__${componentId}:`;

        Object.keys(publicProps).forEach(key => {
            if (key.startsWith(prefix)) {
                const propName = key.substring(prefix.length);
                const value = publicProps[key];

                // Parse the value if it's a string representation
                properties[propName] = parseBest ? parseBest(value) : value;
            }
        });

        return properties;
    }

    /**
     * Extract properties from local component object
     * @param {Object} component - Local component object
     * @returns {Object} Component properties
     */
    extractLocalComponentProperties(component) {
        const properties = {};

        // Components have a 'properties' object that contains the actual values
        if (component.properties && typeof component.properties === 'object') {
            // Copy all properties from the properties object
            Object.keys(component.properties).forEach(key => {
                properties[key] = component.properties[key];
            });
            return properties;
        }

        // Fallback: Try to get properties from SM.scene.components using the component ID
        if (component.id && window.SM && window.SM.scene && window.SM.scene.components) {
            const sceneComponent = window.SM.scene.components[component.id];
            if (sceneComponent) {
                // Get all properties that start with underscore (these are the actual values)
                Object.keys(sceneComponent).forEach(key => {
                    if (key.startsWith('_')) {
                        const propName = key.substring(1); // Remove underscore
                        properties[propName] = sceneComponent[key];
                    }
                });
                return properties;
            }
        }

        // Fallback: Try direct property access
        const propertiesToExtract = [
            'color', 'texture', 'shaderName', 'generateMipMaps', 'side',  // Material
            'width', 'height', 'depth',  // Box
            'radius',  // Sphere
            'isTrigger', 'center', 'size',  // Colliders
            'mass', 'drag', 'angularDrag', 'useGravity', 'isKinematic',  // Rigidbody
            'attachmentPoint', 'uid'  // AttachedObject
        ];

        propertiesToExtract.forEach(prop => {
            // Try different ways to access the property
            if (component[prop] !== undefined) {
                properties[prop] = component[prop];
            } else if (component['_' + prop] !== undefined) {
                properties[prop] = component['_' + prop];
            } else if (component.Get && typeof component.Get === 'function') {
                try {
                    const value = component.Get(prop);
                    if (value !== undefined) {
                        properties[prop] = value;
                    }
                } catch(e) {
                    // Ignore errors from Get method
                }
            }
        });

        return properties;
    }

    /**
     * Compare component properties between local and network
     * @param {Map} localMap - Map of local entity paths
     * @param {Map} networkMap - Map of network entity paths
     */
    compareComponentProperties(localMap, networkMap) {
        // Iterate through all entities that exist in both local and network
        localMap.forEach((localEntity, path) => {
            const networkEntity = networkMap.get(path);
            if (!networkEntity) return; // Skip if entity doesn't exist in network

            // Get existing divergence or create new one
            let divergence = this.divergences.get(path);
            if (!divergence) {
                divergence = {
                    path: path,
                    types: new Set(),
                    details: {},
                    severity: 'low'
                };
            }

            // Compare components properties
            if (localEntity.components && networkEntity.components) {
                const componentPropDivergences = [];

                // Check local components against network
                localEntity.components.forEach(localComp => {
                    // Find matching network component by ID or type
                    const networkComp = networkEntity.components.find(nc =>
                        (nc.id === localComp.id) ||
                        (nc.type === localComp.type && nc.id && localComp.id && nc.id.split('_')[0] === localComp.type)
                    );

                    if (networkComp && localComp.properties && networkComp.properties) {
                        const propDiffs = this.compareProperties(localComp.properties, networkComp.properties);
                        if (Object.keys(propDiffs).length > 0) {
                            componentPropDivergences.push({
                                componentId: localComp.id || networkComp.id,
                                type: localComp.type,
                                differences: propDiffs
                            });
                        }
                    }
                });

                // IMPORTANT: Also check for network components that don't exist locally
                // These are divergences that need to be synced to local
                networkEntity.components.forEach(networkComp => {
                    // Find matching local component by ID or type
                    const localComp = localEntity.components.find(lc =>
                        (lc.id === networkComp.id) ||
                        (lc.type === networkComp.type && lc.id && networkComp.id && networkComp.id.split('_')[0] === lc.type)
                    );

                    // If network component has no local counterpart and has properties, flag all properties as missing locally
                    if (!localComp && networkComp.properties && Object.keys(networkComp.properties).length > 0) {
                        const missingLocalProps = {};
                        Object.keys(networkComp.properties).forEach(key => {
                            missingLocalProps[key] = {
                                local: undefined,
                                network: networkComp.properties[key]
                            };
                        });

                        componentPropDivergences.push({
                            componentId: networkComp.id,
                            type: networkComp.type,
                            differences: missingLocalProps,
                            missingLocally: true  // Flag to indicate entire component is missing locally
                        });
                    }
                });

                if (componentPropDivergences.length > 0) {
                    divergence.types.add('component-properties');
                    divergence.details.componentProperties = componentPropDivergences;
                    divergence.severity = 'medium';
                    this.divergences.set(path, divergence);
                }
            }
        });
    }

    /**
     * Compare two property objects and return differences
     * @param {Object} localProps - Local properties
     * @param {Object} networkProps - Network properties
     * @returns {Object} Differences between properties
     */
    compareProperties(localProps, networkProps) {
        const differences = {};

        // Check all properties from both local and network
        const allKeys = new Set([...Object.keys(localProps), ...Object.keys(networkProps)]);

        allKeys.forEach(key => {
            const localVal = localProps[key];
            const networkVal = networkProps[key];

            // Skip if both are undefined
            if (localVal === undefined && networkVal === undefined) return;

            // IMPORTANT: Only flag as divergence if:
            // 1. Network has value but local doesn't (local needs to sync)
            // 2. Both have values but they differ
            // NOT a divergence if local has value but network doesn't (local-only properties are okay)

            if (networkVal !== undefined && localVal === undefined) {
                // Network exists but local missing - this is an error
                differences[key] = {
                    local: localVal,
                    network: networkVal
                };
            } else if (localVal !== undefined && networkVal === undefined) {
                // Local exists but network missing - this is okay, skip it
                return;
            } else if (!this.areValuesEqual(localVal, networkVal)) {
                // Both exist but differ - this is a divergence
                differences[key] = {
                    local: localVal,
                    network: networkVal
                };
            }
        });

        return differences;
    }

    /**
     * Deep comparison of two values
     * @param {*} val1 - First value
     * @param {*} val2 - Second value
     * @returns {Boolean} Whether values are equal
     */
    areValuesEqual(val1, val2) {
        // Handle nulls and undefineds
        if (val1 === val2) return true;
        if (val1 == null || val2 == null) return false;

        // Handle objects (like Vector3, Color)
        if (typeof val1 === 'object' && typeof val2 === 'object') {
            const keys1 = Object.keys(val1);
            const keys2 = Object.keys(val2);

            if (keys1.length !== keys2.length) return false;

            for (let key of keys1) {
                if (!this.areValuesEqual(val1[key], val2[key])) return false;
            }
            return true;
        }

        // Handle numbers with tolerance
        if (typeof val1 === 'number' && typeof val2 === 'number') {
            return Math.abs(val1 - val2) < 0.001;
        }

        return false;
    }
}