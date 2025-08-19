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
            this.radialCrownTolDisplay = document.getElementById("radialCrownTolDisplay");
        }

        this.focusComponent = "";
        this.focusProperty = "";
        this.setup();
        this.eventListeners = [];
      
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
        let turnLoopInterval = null;
        let tolTurnLoopInterval = null;
        let lastRadialRot = 0;
        let currentRadialRot = 0;
        let lastTolRot = 0;
        let currentTolRot = 0;


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
                this.radialCrown.style.transform = `rotateZ(${lastRadialRot + deltaX}deg)`;
                currentRadialRot = lastRadialRot + deltaX;
                this.inputHelperValue.innerHTML = valueTarget.toFixed(4);
                this.setValue(component, property, valueTarget);
            }
            if(turnLoopInterval){
                clearInterval(turnLoopInterval);
                turnLoopInterval = null;
            }
            turnLoopInterval = setInterval(turnLoop, 100)
            this.radialCrown.style.boxShadow = "0px 0px 20px black";
        })

        this.addEventListeners(this.radialCrownTol, "mousedown", (e)=>{
            e.preventDefault();
            e.stopPropagation();
            let startRot = this.getRightControllerRot();
            let signFlip = 1;
            let lastRotX = -999999;
            let minRot = -270;
            let maxRot = 270;
            let turnLoop = ()=>{
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
                let valueDelta = deltaX;

                let targetRot = lastTolRot + deltaX;
                if(targetRot < minRot){
                    targetRot = minRot;
                }
                if(targetRot > maxRot){
                    targetRot = maxRot;
                }   
                let value = Math.exp(targetRot/12);
                let displayVal = value.toFixed(12);
                if(value < .000000001){
                    displayVal = value.toFixed(11);
                }else if(value < .00000001){
                    displayVal = value.toFixed(10);
                }else if(value < .0000001){
                    displayVal = value.toFixed(9);
                }else if(value < .000001){
                    displayVal = value.toFixed(8);
                }else if(value < .00001){
                    displayVal = value.toFixed(7);
                }else if(value < .0001){
                    displayVal = value.toFixed(6);
                }else if(value < .001){
                    displayVal = value.toFixed(5);
                }else if(value < .01){
                    displayVal = value.toFixed(4);
                }else if(value < .1){
                    displayVal = value.toFixed(3);
                }else if(value < 1){
                    displayVal = value.toFixed(2);
                }else if(value < 10){
                    displayVal = value.toFixed(1);
                }else{
                    displayVal = value.toFixed(0);
                }
                this.radialCrownTolDisplay.innerHTML = `Tol +/- ${displayVal}` //   :relInc: ${relInc}, :deltaX: ${deltaX}, :valueDelta: ${valueDelta}, :valueTarget: ${valueTarget}
                this.radialCrownTol.style.transform = `rotateZ(${targetRot}deg)`;
                this.tolerance = value;
                currentTolRot = targetRot;
            }
            if(tolTurnLoopInterval){
                clearInterval(tolTurnLoopInterval);
                tolTurnLoopInterval = null;
            }
            tolTurnLoopInterval = setInterval(turnLoop, 100)
            this.radialCrownTol.style.boxShadow = "0px 0px 20px black";
        })

        let stopTurnLoops = ()=>{
            this.inputHelperInfo.innerHTML = "";
            lastRadialRot = currentRadialRot;
            lastTolRot = currentTolRot;
            clearInterval(turnLoopInterval);
            clearInterval(tolTurnLoopInterval);    
            turnLoopInterval = null;
            tolTurnLoopInterval = null;
            this.radialCrown.style.boxShadow = "none";
            this.radialCrownTol.style.boxShadow = "none";
        }

        this.addEventListeners(this.inputHelper, "mouseleave", (e)=>{
            stopTurnLoops();
        })

        this.addEventListeners(this.inputHelper, "mouseup", (e)=>{
            e.preventDefault();
            e.stopPropagation();
            stopTurnLoops();
        })

        this.addEventListeners(document.body, "mouseup", (e)=>{
            stopTurnLoops();
            this.checkInputBlur();
        })

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
    }

    checkInputBlur(){
        const activeEl = this.getDeepActiveElement();
        if(activeEl === document.body){
            this.clearHighlight();
            this.focusComponent = null;
            this.focusProperty = null;
            inspector.propertiesPanel.render(SM.selectedEntity)
        }
    }

    inputFocusChanged(activeEl, component, property){
        if(!this.initialized){ return; }
        if(this.currentInput === activeEl){
            return;
        }
       
        this.focusComponent = component;
        this.focusProperty = property;
        inspector.propertiesPanel.render(SM.selectedEntity)
        this.clearHighlight();

        this.currentInput = activeEl;
        this.helpInputElement(activeEl, component, property);
        
    }

}
export const inputHandler = new InputHandler();
window.inputHandler = inputHandler;