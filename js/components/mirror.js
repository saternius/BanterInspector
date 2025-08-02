const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterMirrorComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterMirror;
        this.type = 'BanterMirror';
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
            properties.renderTextureSize = sceneComponent.renderTextureSize;
        }
        
        if (sceneComponent.cameraClear !== undefined) {
            properties.cameraClear = sceneComponent.cameraClear;
        }
        
        if (sceneComponent.backgroundColor !== undefined) {
            properties.backgroundColor = sceneComponent.backgroundColor;
        }
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterMirror:`, e);
        }
    }
}