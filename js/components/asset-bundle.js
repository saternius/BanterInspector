const { SlotComponent } = await import(`${window.repoUrl}/js/components/slot-component.js`);

export class BanterAssetBundleComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterAssetBundle;
        this.type = 'BanterAssetBundle';
    }

    defaultProperties() {
        return {
            windowsUrl: '',
            osxUrl: '',
            linuxUrl: '',
            androidUrl: '',
            iosUrl: ''
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const urlProps = ['windowsUrl', 'osxUrl', 'linuxUrl', 'androidUrl', 'iosUrl'];
        urlProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
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
            console.error(`Failed to update ${property} on BanterAssetBundle:`, e);
        }
    }
}