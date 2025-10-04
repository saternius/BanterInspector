const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BoxColliderControls{
    constructor(component){
        this.component = component;
        this.visible = false;
        this.visual = null;
        this.visualTransform = null;
        this.controls = {
            'view': {
                'input': 'button',
                'callback': this.view.bind(this),
                'label': 'View',
                'id': 'view'
            }
        }
    }

    updateVisual(){
        if(!this.visual) return;
        if(!this.visualTransform) return;

        this.visualTransform.localScale = new BS.Vector3(this.component.properties.size.x, this.component.properties.size.y, this.component.properties.size.z);
        this.visualTransform.localPosition = new BS.Vector3(this.component.properties.center.x, this.component.properties.center.y, this.component.properties.center.z);


    }

    async view(){
        this.visible = !this.visible;
            
        if(this.visible){
            this.visual = new BS.GameObject(this.name);

            this.visualTransform = new BS.Transform()
            this.visualTransform.localScale = new BS.Vector3(this.component.properties.size.x, this.component.properties.size.y, this.component.properties.size.z);
            this.visualTransform.localPosition = new BS.Vector3(this.component.properties.center.x, this.component.properties.center.y, this.component.properties.center.z);
            this.visual.AddComponent(this.visualTransform);

            this.visual.AddComponent(new BS.BanterGeometry());
            let material = new BS.BanterMaterial()
            material.color = new BS.Vector4(0, 1, 0, .25);
            material.shaderName = 'Unlit/DiffuseTransparent';
            this.visual.AddComponent(material);
            await this.visual.SetParent(this.component._entity._bs, true);
            this.controls['view'].label = "Hide";
        }else{
            if(this.visual){
                this.visual.Destroy();
                this.visual = null;
            }
            this.controls['view'].label = "View";
        }

        let buttonEl = document.getElementById(`${this.component.id}_view`);
        buttonEl.innerHTML = this.controls['view'].label

    }
}

export class BoxColliderComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BoxCollider;
        this.type = 'BoxCollider';
        this._controls = new BoxColliderControls(this);
    }

    defaultProperties() {
        return {
            isTrigger: false,
            center: { x: 0, y: 0, z: 0 },
            size: { x: 1, y: 1, z: 1 }
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.isTrigger !== undefined) {
            properties.isTrigger = parseBest(sceneComponent.isTrigger);
        }
        
        if (sceneComponent.center !== undefined) {
            properties.center = {
                x: sceneComponent.center.x || 0,
                y: sceneComponent.center.y || 0,
                z: sceneComponent.center.z || 0
            };
        }
        
        if (sceneComponent.size !== undefined) {
            properties.size = {
                x: sceneComponent.size.x || 1,
                y: sceneComponent.size.y || 1,
                z: sceneComponent.size.z || 1
            };
        }
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
        this.properties[property] = value;

        try {
            if ((property === 'center' || property === 'size') && typeof value === 'object') {
                this._bs[property] = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
                this._controls.updateVisual();
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BoxCollider:`, e);
        }
    }
}