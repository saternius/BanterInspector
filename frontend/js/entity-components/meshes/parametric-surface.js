const { MeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

/**
 * Base class for parametric surface mesh components
 * All parametric surfaces share the same stacks/slices properties
 */
export class ParametricSurfaceComponent extends MeshComponent {
    constructor() {
        super();
    }

    defaultProperties() {
        return {
            stacks: 20,
            slices: 20
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};

        if (sceneComponent.stacks !== undefined) {
            properties.stacks = parseBest(sceneComponent.stacks);
        }
        if (sceneComponent.slices !== undefined) {
            properties.slices = parseBest(sceneComponent.slices);
        }

        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
        this.properties[property] = value;

        try {
            if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on ${this.type}:`, e);
        }

    }
}
