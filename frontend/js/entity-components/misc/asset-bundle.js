const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class AssetBundleComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterAssetBundle;
        this.type = 'AssetBundle';
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
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
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
            console.error(`Failed to update ${property} on AssetBundle:`, e);
        }
        this.checkSpaceDiff();
    }
}