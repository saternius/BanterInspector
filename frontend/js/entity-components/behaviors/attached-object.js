const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class AttachedObjectComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterAttachedObject;
        this.type = 'AttachedObject';
    }

    defaultProperties() {
        return {
            uid: '',
            // attachmentPosition: { x: 0, y: 0, z: 0 },
            // attachmentRotation: { x: 0, y: 0, z: 0, w: 1 },
            // attachmentType: 0,
            // avatarAttachmentType: 0,
            // avatarAttachmentPoint: 0,
            attachmentPoint: 0
        };
    }

    enums(){
        return {
            attachmentPoint: {
                0: 'HEAD',
                1: 'BODY',
                2: 'LEFT_HAND',
                3: 'RIGHT_HAND',
                4: 'COCKPIT'
            }
        }
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.uid !== undefined) {
            properties.uid = parseBest(sceneComponent.uid);
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
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);

        if(property === "uid" && value === "" && this.properties.uid !== ""){
            log("scene", "Detaching Object", this.properties)
            SM.scene.LegacyAttachObject(this._entity._bs, null, null);
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
            err("scene", `Failed to update ${property} on AttachedObject:`, e);
        }
        
        if(this.properties.uid){
            log("scene", "Attaching Object", this._entity._bs, this.properties.uid, this.properties.attachmentPoint)
            SM.scene.LegacyAttachObject(this._entity._bs, this.properties.uid, this.properties.attachmentPoint);
        }
    }
}