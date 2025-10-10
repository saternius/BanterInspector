class WindowUI {
    constructor(ctx){
        this.ctx = ctx;
        this.held = false;
        this.lastParent = "Scene";
        this.user = SM.myName();
        this.container = null;
        this.contentArea = null;
        this.PaneEntity = null;
        this.doc = null;

        

        this.ctx.onStart = async ()=>{
            let {startingPosition, startingRotation} = await this.getStartingSpot();
            this.ctx._entity.Set("localPosition", {x: 0, y: 0, z: 0});
            this.PaneEntity = await AddEntity(this.ctx._entity.id, "UI")
            this.doc = await this.PaneEntity._bs.AddComponent(new BS.BanterUI(new BS.Vector2(512,512), false));
            this.doc.SetBackgroundColor(new BS.Vector4(0.00, 0.31, 0.89, 1));
            window.blankUI = this.doc;
            this.ctx._entity.Set("localPosition", startingPosition);
            this.ctx._entity.Set("localRotation", startingRotation);
            this.generateUI();
        }

        this.ctx.onDestroy = async()=>{
            log("BLANK UI", "onDestroy")
            if(this.PaneEntity){
                await RemoveEntity(this.PaneEntity.id)
            }
        }
    }

    generateUI(){
        if(this.container){
            this.container.Destroy();
        }
        log("BLANK UI", "generating UI")
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
        title.text = "Blank UI";
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
            rightHandHolder.Set("position", e.detail.point)
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

    async DestroySelf(){
        log("BLANK UI", "Destroying Blank UI");
        await RemoveEntity(this.ctx._entity.id);
    }
}

window.WindowUI = WindowUI;