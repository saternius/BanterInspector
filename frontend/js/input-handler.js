const { deepClone, parseBest, appendToConsole, showNotification } = await import(`${window.repoUrl}/utils.js`);
export class InputHandler{
    constructor(){
        this.currentInput = null;
        // this.attach();
        // this.syncWithActiveElement();
        this.initialized = false;
        this.tolerance = 1;
        this.setup = ()=>{
            if(window.scene === undefined){
                setTimeout(this.setup, 400)
                return;
            } 
            console.log("Setting up input handler..")

            if(this.initialize){
                return;
            }
            this.initialized = true;
            scene.LegacyEnableQuaternionPose()
            scene.LegacyEnableControllerExtras()
            scene.EnableLegacy()

            this.getRightControllerRot = ()=>{
                return {
                    x: userinputs.righthand.rotation.x,
                    y: userinputs.righthand.rotation.y,
                    z: userinputs.righthand.rotation.z,
                }
            }
            this.radialCrown = document.getElementById("radialCrown");
            this.radialCrownTol = document.getElementById("radialCrownTol");
            this.inputHelper = document.getElementById("inputHelper");
            this.spacePanel = document.getElementById("spacePropsContent");
            this.lifeCyclePanel = document.getElementById("lifecyclePanel");
            this.inputHelperInfo = document.getElementById("inputHelperInfo");
            this.inputHelperValue = document.getElementById("inputHelperValue");
            this.inputHelperSubject = document.getElementById("inputHelperSubject");


            // document.body.addEventListener("click", (e)=>{
            //     console.log("window click")
            //     this.checkInputBlur();
            // })
        }

        this.setup();
        this.eventListeners = [];
        this.turnLoopInterval = null;
    }

    addEventListeners(element, event, callback){
        element.addEventListener(event, callback);
        this.eventListeners.push({element, event, callback});
    }
    
    clearEventListeners(){
        this.eventListeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.callback);
        });
        this.eventListeners = []
    }


    setValue(component, property, value){
        if(!property.includes(".")){
            component.Set(property, value);
            return;
        }
        let [key, axis] = property.split(".");
        let currentVec = deepClone(component.properties[key]);
        currentVec[axis] = value;
        component.Set(key, currentVec);
    }

    helpInputElement(element, component, property){

       

        this.currentInput.style.backgroundColor = "#1e3764";
        this.currentInput.style.borderColor = "#326689";
        this.inputHelper.style.display = "block";
        this.spacePanel.style.display = "none"; 
        this.lifeCyclePanel.style.display = "none";
        this.inputHelperSubject.innerHTML = `
            <span style="color:orange">${component._entity.name}</span> 
            <span style="color:#8babd5">${component.type}</span> 
            <span >${property}</span>
        `;
        this.inputHelperValue.innerHTML = element.value;

        

        // Clear any existing event listeners before adding new ones
        this.clearEventListeners();
        
        

       
        
        // interval is managed at the instance level

        this.addEventListeners(this.radialCrown, "mousedown", (e)=>{
            e.preventDefault();
            e.stopPropagation();
            let startRot = this.getRightControllerRot();
            let value = parseFloat(element.value);
            if(isNaN(value) || value === 0){
                value = 1;
            }
            let relInc = Math.abs((value / 180) * this.tolerance);
            let signFlip = 1;
            let lastRotX = -999999;
            let turnLoop = ()=>{
                console.log("turnLoop")
                let currentRot = this.getRightControllerRot();
                let cX = currentRot.x;
                if(lastRotX === -999999){
                    lastRotX = cX;
                }else{
                    if(Math.abs(cX - lastRotX) > .8){
                        signFlip *= -1;
                    }
                }
                lastRotX = cX;
                cX = cX * signFlip;
                
                let deltaX = -(Math.round((cX - startRot.x) * 180*100)/100);
                let valueDelta = deltaX*relInc;
                let valueTarget = value + valueDelta;
                element.value = valueTarget;
                this.inputHelperInfo.innerHTML = (valueDelta > 0 ? "+" : "") + `${valueDelta.toFixed(4)}` //   :relInc: ${relInc}, :deltaX: ${deltaX}, :valueDelta: ${valueDelta}, :valueTarget: ${valueTarget}
                this.radialCrown.style.transform = `rotateZ(${deltaX}deg)`;
                this.inputHelperValue.innerHTML = valueTarget.toFixed(4);
                this.setValue(component, property, valueTarget);
            }
            console.log("startTurnLoop", startRot)
            if(this.turnLoopInterval){
                clearInterval(this.turnLoopInterval);
                this.turnLoopInterval = null;
            }
            this.turnLoopInterval = setInterval(turnLoop, 100)
            this.radialCrown.style.boxShadow = "0px 0px 20px black";
        })

        let stopTurnLoop = ()=>{
            if(this.turnLoopInterval){
                clearInterval(this.turnLoopInterval);
                this.turnLoopInterval = null;
                this.radialCrown.style.boxShadow = "none";
            }
        }

        // this.addEventListeners(window, "mouseup", (e)=>{
        //     console.log("mouseup on window")
        //     stopTurnLoop();
        // })

        this.addEventListeners(this.inputHelper, "mouseleave", (e)=>{
            console.log("exited the INPUT HELPER")
            stopTurnLoop();
        })

        this.addEventListeners(this.inputHelper, "mouseup", (e)=>{
            console.log("mouseup on the INPUT HELPER")
            e.preventDefault();
            e.stopPropagation();
            stopTurnLoop();
        })

        this.addEventListeners(document.body, "mouseup", (e)=>{
            stopTurnLoop();
            this.checkInputBlur();
        })

        // this.addEventListeners(this.inputHelper, "mouseup", (e)=>{
        //     e.preventDefault();
        //     e.stopPropagation();
        //     console.log("mouseup on INPUT HELPER: clear turnLoopInterval")
        //     if(this.turnLoopInterval){
        //         clearInterval(this.turnLoopInterval);
        //         this.turnLoopInterval = null;
        //         this.radialCrown.style.boxShadow = "none";
        //     }
        // })

        // this.addEventListeners(this.inputHelper, "mousedown", (e)=>{
        //     e.preventDefault();
        //     e.stopPropagation();
        //     console.log("mousedown on INPUT HELPER")
        // })

    }
   
    getDeepActiveElement(doc = document){
        let activeEl = doc.activeElement;
        while (activeEl && activeEl.shadowRoot && activeEl.shadowRoot.activeElement) {
            activeEl = activeEl.shadowRoot.activeElement;
        }
        return activeEl;
    }

    isInputElement(element){
        if(!element){
            return false;
        }
        if(element instanceof HTMLInputElement){
            return true;
        }
        if(element instanceof HTMLTextAreaElement){
            return true;
        }
        if(element.isContentEditable === true){
            return true;
        }
        if(element.contentEditable === "true"){
            return true;
        }
        return false;
    }

    syncWithActiveElement(){
        const active = this.getDeepActiveElement();
        this.currentInput = this.isInputElement(active) ? active : null;
        console.log("syncWithActiveElement", this.currentInput)
    }

    handleWindowBlur(){
        this.currentInput = null;
    }

    clearHighlight(){
        this.inputHelper.style.display = "none";
        this.spacePanel.style.display = "block";
        this.lifeCyclePanel.style.display = "block";
        if(this.currentInput && this.currentInput.style){
            this.currentInput.style.backgroundColor = "#0f0f0f";
            this.currentInput.style.borderColor = "#2a2a2a";
        }
        this.currentInput = null;
        this.clearEventListeners();
        if(this.turnLoopInterval){
            clearInterval(this.turnLoopInterval);
            this.turnLoopInterval = null;
        }
    }

    checkInputBlur(){
        const activeEl = this.getDeepActiveElement();
        console.log("ACTIVE EL", activeEl)
        if(activeEl === document.body){
            this.clearHighlight();
        }
    }

    inputFocusChanged(activeEl, component, property){
        console.log("inputFocusChanged", activeEl, component, property)
        if(!this.initialized){ return; }
        if(this.currentInput === activeEl){
            return;
        }
        this.clearHighlight();

        // let ignore = ["propertyPanelEditProp", "propertyPanelAddPublicPropKey", "propertyPanelAddPublicPropValue", "propertyPanelAddProtectedPropKey", "propertyPanelAddProtectedPropValue"];
        // if(ignore.includes(activeEl.dataset?.input)){
        //     return;
        // }
  
        this.currentInput = activeEl;
        this.helpInputElement(activeEl, component, property);
        
    }

}
export const inputHandler = new InputHandler();
window.inputHandler = inputHandler;