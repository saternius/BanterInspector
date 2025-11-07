this.default = {
    imgUrl: {
        "type": "string",
        "value": ""
    }
}
log("Image UI", "ImageUI loaded with vars: ", this.vars)
Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]){
        log("Image UI", "setting var", key, val)
        this.vars[key] = val
    }
})    

log("Image UI", "ImageUI loaded with vars: ", this.vars)





class WindowUI {
    constructor(ctx, windowName){
        this.ctx = ctx;
        this.windowName = windowName;
        this.held = false;
        this.lastParent = "Scene";
        this.user = SM.myName();
        this.container = null;
        this.contentArea = null;
        this.PaneEntity = null;
        this.doc = null;
        this.handle = null;

        let isOwner = ()=>{
            return this.ctx._component.properties._owner === SM.myName();
        }        

        let getChildEntity = (childName)=>{
            let rel_path = this.ctx._entity.id+"/"+childName
            log(`${this.windowName} UI`, "getChildEntityPath", rel_path)
            let entity = SM.getEntityById(rel_path)
            log(`${this.windowName} UI`, "getChildEntity", entity)
            return entity
        }

        let constructWindow = async (imageUrl)=>{
            if(this.doc){
                await this.doc.Destroy();
            }

            // Get image dimensions
            let imgWidth = 512;
            let imgHeight = 512;

            if(imageUrl) {
                try {
                    const dimensions = await this.getImageDimensions(imageUrl);
                    imgWidth = dimensions.width;
                    imgHeight = dimensions.height;
                    log(`${this.windowName} UI`, `Image dimensions: ${imgWidth}x${imgHeight}`);
                } catch(e) {
                    log(`${this.windowName} UI`, "Failed to get image dimensions, using default 512x512", e);
                }
            }

            // Create UI with image resolution
            this.doc = await this.PaneEntity._bs.AddComponent(new BS.BanterUI(new BS.Vector2(imgWidth, imgHeight), false));
            this.doc.SetBackgroundColor(new BS.Vector4(0.00, 0.31, 0.89, 1));
            window.blankUI = this.doc;


            // Adjust entity scale based on resolution
            if(this.PaneEntity){
                let transform = this.PaneEntity.getTransform();
                log(`${this.windowName} UI`, "PaneEntity Transform", transform)
                transform._set("localScale", {
                    x: imgWidth / 512,
                    y: imgHeight / 512,
                    z: 1
                });
            }
            if(this.handle){
                log(`${this.windowName} UI`, "Handle", this.handle)
                this.handle.getTransform()._set("localPosition", {x: 0, y: imgHeight/1024, z: 0});
            }
            this.generateUI(imageUrl);
        }

        this.ctx.onLoaded = async ()=>{
            log(`${this.windowName} UI`, "onLoaded")            
            this.PaneEntity = getChildEntity("UI")
            await constructWindow(this.ctx.vars.imgUrl.value);

            if(isOwner()){
                let {startingPosition, startingRotation} = await this.getStartingSpot();
                let transform = this.ctx._entity.getTransform();    
                transform.Set("localPosition", startingPosition);
                transform.Set("localRotation", startingRotation);
            }

            log(`${this.windowName} UI`, "onLoaded")
            this.handle = this.ctx._entity.children.find(c=>c.name === "Handle")
            log(`${this.windowName} UI`, "Handle", this.handle)
            this.handle._bs.On("click", e => {
                log(`${this.windowName} UI`, "TEMP holder")
                this.grabHandler(e)
            })
        }

        this.ctx.onVarChange = async (varName, value)=>{
            log(`${this.windowName} UI`, "onVarChange", varName, value)
            if(varName === "imgUrl"){
                await constructWindow(value.value);
            }
        }

        this.ctx.onDestroy = async()=>{
            log(`${this.windowName} UI`, "onDestroy")
            if(this.doc){
                await this.doc.Destroy();
            }
        }
    }

    generateUI(imageUrl){
        if(this.container){
            this.container.Destroy();
        }
        log(`${this.windowName} UI`, "generating UI")
        this.container = this.doc.CreateVisualElement();
        this.container.style.display = "flex";
        this.container.style.flexDirection = "column";
        this.container.style.height = "100%";
        this.container.style.width = "100%";
        //container.style.backgroundColor = "red";
    
        // Create Windows-style header
        const header = this.doc.CreateVisualElement();
        header.style.display = "flex";
        header.style.flexDirection = "row";
        header.style.justifyContent = "space-between";
        header.style.backgroundColor = "#0051e5";
        header.style.paddingLeft = "8px";
        header.style.borderBottom = "1px solid #333";
    
        header.OnClick(this.grabHandler)
        
    
        const title = this.doc.CreateLabel();
        title.text = this.windowName;
        title.style.color = "#ffffff";
        title.style.fontSize = "14px";
        title.style.fontWeight = "bold";
    
    
        const closeButton = this.doc.CreateLabel();
        closeButton.text = "x";
        closeButton.style.backgroundColor = "red";
        closeButton.style.color = "#ffffff";
        closeButton.style.border = "none";
        closeButton.style.borderRadius = "0px";
        closeButton.style.fontSize = "12px";
        closeButton.style.padding = "4px";
        closeButton.style.paddingRight = "8px";
        closeButton.style.paddingLeft = "8px";
        closeButton.style.cursor = "pointer";
        closeButton.OnClick(() => {
            this.DestroySelf();
        });
        closeButton.OnMouseEnter(() => {
            closeButton.style.backgroundColor = "#e81123";
        });
        closeButton.OnMouseLeave(() => {
            closeButton.style.backgroundColor = "transparent";
        });
    
        header.AppendChild(title);
        header.AppendChild(closeButton);
        this.container.AppendChild(header);
    
        // Create content area for undo/redo items
        this.contentArea = this.doc.CreateVisualElement();
        this.contentArea.style.overflowY = "auto";
        this.contentArea.style.margin = "4px";
        this.contentArea.style.backgroundColor = "white";
        this.contentArea.style.backgroundImage = `url("${imageUrl}")`;
        this.contentArea.style.backgroundSize = "cover";
        this.contentArea.style.backgroundPosition = "center";
        this.contentArea.style.backgroundRepeat = "no-repeat";
        log("ImageUI", "contentArea", this.contentArea)
        this.contentArea.style.height = "100%"
        this.container.AppendChild(this.contentArea);
        
        
    }

    grabHandler(e){
        console.log("grabHandler", e.detail)
        if(this.held){
            this.ctx._entity.SetParent(this.lastParent)
        }else{
            console.log("click", e.detail)
            let rightHandHolderPath = "People/"+this.user+"/Trackers/RIGHT_HAND/Holder";
            let rightHandHolder = SM.getEntityById(rightHandHolderPath)
            console.log(`RIGHT_HAND HOLDER => ${rightHandHolderPath}`, rightHandHolder)
            if(!rightHandHolder){
                showNotification("Error: RIGHT_HAND Holder not found")
                return;
            }
            rightHandHolder.getTransform().Set("position", e.detail.point)
            this.lastParent = this.ctx._entity.parentId;
            this.ctx._entity.SetParent(rightHandHolderPath)
        }
        this.held = !this.held;
    }

    async fetchTracker(name){
        try{
            let tracker = await GetTracker(name);
            return tracker;
        }catch(e){
            await new Promise(resolve => setTimeout(resolve, 500));
            return await this.fetchTracker(name);
        }
    }

    async getStartingSpot(){
        let headTracker = await this.fetchTracker("HEAD");
        let headTransform = headTracker.getTransform();
        let headPosition = headTransform._bs._localPosition;
        let headForward = TransformOps.Multiply(headTransform._bs.forward, 1.75);
        let startingPosition = TransformOps.Add(headPosition, headForward);
        startingPosition.y -= 0.5;
        let startingRotation = lockQuaternionAxes(headTransform._bs._rotation, true, false, true);
        return {startingPosition, startingRotation};
    }

    async getImageDimensions(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                resolve({
                    width: this.width,
                    height: this.height
                });
            };
            img.onerror = function() {
                reject(new Error('Failed to load image'));
            };
            img.src = url;
        });
    }

    async DestroySelf(){
        log(`${this.windowName} UI`, "Destroying Image UI");
        await RemoveEntity(this.ctx._entity.id);
    }
}

this.UI = new WindowUI(this, "Image");
