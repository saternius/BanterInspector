const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterAttachedObjectComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterAttachedObject;
        this.type = 'BanterAttachedObject';
    }

    defaultProperties() {
        return {
            uid: '',
            attachmentPosition: { x: 0, y: 0, z: 0 },
            attachmentRotation: { x: 0, y: 0, z: 0, w: 1 },
            attachmentType: 0,
            avatarAttachmentType: 0,
            avatarAttachmentPoint: 0,
            attachmentPoint: 0
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.uid !== undefined) {
            properties.uid = sceneComponent.uid;
        }
        
        if (sceneComponent.attachmentPosition !== undefined) {
            properties.attachmentPosition = {
                x: sceneComponent.attachmentPosition.x || 0,
                y: sceneComponent.attachmentPosition.y || 0,
                z: sceneComponent.attachmentPosition.z || 0
            };
        }
        
        if (sceneComponent.attachmentRotation !== undefined) {
            properties.attachmentRotation = {
                x: sceneComponent.attachmentRotation.x || 0,
                y: sceneComponent.attachmentRotation.y || 0,
                z: sceneComponent.attachmentRotation.z || 0,
                w: sceneComponent.attachmentRotation.w || 1
            };
        }
        
        const enumProps = ['attachmentType', 'avatarAttachmentType', 'avatarAttachmentPoint', 'attachmentPoint'];
        enumProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;
        if(typeof value === "string" && (property === 'attachmentPosition' || property === 'attachmentRotation')){
            value = JSON.parse(value);
        }

        this.properties[property] = value;

        try {
            if (property === 'attachmentPosition' && typeof value === 'object') {
                this._bs[property] = new BS.Vector3(
                    parseFloat(value.x || 0),
                    parseFloat(value.y || 0),
                    parseFloat(value.z || 0)
                );
            } else if (property === 'attachmentRotation' && typeof value === 'object') {
                value.x = parseFloat(value.x || 0);
                value.y = parseFloat(value.y || 0);
                value.z = parseFloat(value.z || 0);
                if( 'w' in value ){
                    value.w = parseFloat(value.w || 1);
                    this._bs[property] = new BS.Vector4(value.x,value.y,value.z,value.w);
                }else{
                    value = eulerToQuaternion(value);
                    this._bs[property] = new BS.Vector4(value.x,value.y,value.z,value.w);
                }
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterAttachedObject:`, e);
        }
    }
}