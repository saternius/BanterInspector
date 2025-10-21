const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class MirrorComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterMirror;
        this.type = 'Mirror';
    }

    defaultProperties() {
        return {
            renderTextureSize: 1024,
            cameraClear: 1,
            backgroundColor: '#000000'
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.renderTextureSize !== undefined) {
            properties.renderTextureSize = parseBest(sceneComponent.renderTextureSize);
        }
        
        if (sceneComponent.cameraClear !== undefined) {
            properties.cameraClear = parseBest(sceneComponent.cameraClear);
        }
        
        if (sceneComponent.backgroundColor !== undefined) {
            properties.backgroundColor = parseBest(sceneComponent.backgroundColor);
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
            console.error(`Failed to update ${property} on Mirror:`, e);
        }
        this.checkSpaceDiff();
    }

    // Culling layer methods
    SetCullingLayer(layer) {
        if (this._bs && typeof this._bs.SetCullingLayer === 'function') {
            this._bs.SetCullingLayer(layer);
        }
    }

    AddCullingLayer(layer) {
        if (this._bs && typeof this._bs.AddCullingLayer === 'function') {
            this._bs.AddCullingLayer(layer);
        }
    }
}