const { deepClone, parseBest, appendToConsole, showNotification } = await import(`${window.repoUrl}/utils.js`);
const { EntityPropertyChange, ComponentPropertyChange, ComponentRemoveChange, MonoBehaviorVarChange, ComponentReorderChange } = await import(`${window.repoUrl}/change-types.js`);
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
            // scene.LegacyEnableQuaternionPose()
            // scene.LegacyEnableControllerExtras()
            // scene.EnableLegacy()

           

            this.getRightControllerRot = ()=>{
                //console.log("todo: set with tippy")
                let user = SM.myName()
                let rightHandPath = `People/${user}/Trackers/RIGHT_HAND`
                let rightHand = SM.getEntityById(rightHandPath)
                if(!rightHand){
                    showNotification("Error: RIGHT_HAND Tracker not found")
                    return {
                        x: 0,
                        y: 0,
                        z: 0,
                    }
                }

                let pos = rightHand.transform._localRotation;

                return {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
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
        if(!element) {
            return;
        }
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
        let sections = property.split(".");
        let lockkey = component.id+"_"+sections[0];
        if(inspector.propertiesPanel.scaleLockStates.get(lockkey)){
            inspector.propertiesPanel.handleProportionalScaleChange(component.type, component.id, sections[0], sections[1], value, component.properties[sections[0]], 0);
            return;
        }

        if(!property.includes(".")){
            component.Set(property, value);
            return;
        }
        let [key, axis] = property.split(".");
        let currentVec = deepClone(component.properties[key]);
        currentVec[axis] = value;
        component.Set(key, currentVec);
    }

    helpNumericInputElement(element, component, property){
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

    helpColorInputElement(element, component, property){
        // Clear any existing event listeners
        this.clearEventListeners();


        // Hide numeric input UI and show color selector UI
        if(!this.colorSelectorContainer){
            this.setupColorSelector();
        }
        
        this.currentInput.style.backgroundColor = "#1e3764";
        this.currentInput.style.borderColor = "#326689";
        this.inputHelper.style.display = "block";
        this.spacePanel.style.display = "none"; 
        this.lifeCyclePanel.style.display = "none";
        
        // Hide numeric input controls
        const numericContainer = document.getElementById("radialCrown")?.parentElement;
        if(numericContainer) {
            numericContainer.id = "numericInputContainer";
            numericContainer.style.display = "none";
        }
        this.colorSelectorContainer.style.display = "block";
        
        // Set subject
        this.inputHelperSubject.innerHTML = `
            <span style="color:orange">${component._entity.name}</span> 
            <span style="color:#8babd5">${component.type}</span> 
            <span >${property}</span>
        `;
        
        // Get current color value
        let currentColor = this.getColorValue(component, property);
        
        // Initialize color selector with current value
        this.initColorSelector(currentColor, (newColor) => {
            this.setColorValue(component, property, newColor);
            this.updateColorDisplay(newColor);
        });
        
        
        

        this.addEventListeners(this.inputHelper, "mouseup", (e)=>{
            e.preventDefault();
            e.stopPropagation();
        })

        // Add cleanup handlers
        this.addEventListeners(document.body, "mouseup", () => {
            this.checkInputBlur();
        });
        
    }
    
    setupColorSelector(){
        // Create color selector elements dynamically
        const container = document.createElement('div');
        container.className = 'color-selector-container';
        container.id = 'colorSelectorContainer';
        container.style.display = 'none';
        
        // Color preview at top
        const preview = document.createElement('div');
        preview.className = 'color-preview-large';
        preview.id = 'colorPreviewLarge';
        container.appendChild(preview);
        
        // Main picker area with saturation/brightness square and hue bar
        const pickerArea = document.createElement('div');
        pickerArea.className = 'color-picker-area';
        
        // Saturation/Brightness square
        const sbSquare = document.createElement('div');
        sbSquare.className = 'color-sb-square';
        sbSquare.id = 'colorSbSquare';
        
        const sbCursor = document.createElement('div');
        sbCursor.className = 'color-sb-cursor';
        sbCursor.id = 'sbCursor';
        sbSquare.appendChild(sbCursor);
        
        pickerArea.appendChild(sbSquare);
        
        // Hue bar
        const hueBar = document.createElement('div');
        hueBar.className = 'color-hue-bar';
        hueBar.id = 'colorHueBar';
        
        const hueSlider = document.createElement('div');
        hueSlider.className = 'color-hue-slider';
        hueSlider.id = 'hueSlider';
        hueBar.appendChild(hueSlider);
        
        pickerArea.appendChild(hueBar);
        
        container.appendChild(pickerArea);
        
        // Alpha slider
        const alphaWrapper = document.createElement('div');
        alphaWrapper.className = 'color-alpha-wrapper';
        
        const alphaLabel = document.createElement('span');
        alphaLabel.className = 'color-slider-label';
        alphaLabel.textContent = 'Alpha';
        alphaWrapper.appendChild(alphaLabel);
        
        const alphaBar = document.createElement('div');
        alphaBar.className = 'color-alpha-bar';
        alphaBar.id = 'colorAlphaBar';
        
        const alphaSlider = document.createElement('div');
        alphaSlider.className = 'color-alpha-slider';
        alphaSlider.id = 'alphaSlider';
        alphaBar.appendChild(alphaSlider);
        
        alphaWrapper.appendChild(alphaBar);
        
        const alphaValue = document.createElement('span');
        alphaValue.className = 'color-slider-value';
        alphaValue.id = 'alphaValue';
        alphaValue.textContent = '100%';
        alphaWrapper.appendChild(alphaValue);
        
        container.appendChild(alphaWrapper);
        
        // Color values display
        const values = document.createElement('div');
        values.className = 'color-values';
        
        const rgbRow = document.createElement('div');
        rgbRow.className = 'color-value-row';
        rgbRow.innerHTML = '<span>RGB:</span><span id="rgbDisplay">255, 255, 255</span>';
        values.appendChild(rgbRow);
        
        const hexRow = document.createElement('div');
        hexRow.className = 'color-value-row';
        hexRow.innerHTML = '<span>Hex:</span><span id="hexDisplay">#FFFFFF</span>';
        values.appendChild(hexRow);
        
        container.appendChild(values);
        
        // Add to properties content
        const propertiesContent = document.querySelector('#inputHelper .properties-content');
        propertiesContent.appendChild(container);
        
        // Store reference
        this.colorSelectorContainer = container;
    }
    
    
    initColorSelector(color, onChange){
        this.colorChangeCallback = onChange;
        this.currentHSV = this.rgbToHsv(color.r * 255, color.g * 255, color.b * 255);
        this.currentAlpha = color.a || 1;
        
        // Update displays
        this.updateColorDisplay(color);
        this.updatePickerVisuals();
        
        // Setup interactions
        this.setupSaturationBrightnessPicker();
        this.setupHuePicker();
        this.setupAlphaPicker();
    }
    
    setupSaturationBrightnessPicker(){
        const square = document.getElementById('colorSbSquare');
        const cursor = document.getElementById('sbCursor');
        
        
        if(!square || !cursor) {
            return;
        }
        
        let isDragging = false;
        
        const updateSB = (e) => {
            const rect = square.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
            
            this.currentHSV.s = x / rect.width;
            this.currentHSV.v = 1 - (y / rect.height);
            
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
            
            this.updateFromHSV();
        };
        
        const mouseDownHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            updateSB(e);
        };
        
        const mouseMoveHandler = (e) => {
            // if(isDragging) {
            //     e.preventDefault();
            //     updateSB(e);
            // }
        };
        
        const mouseUpHandler = (e) => {
            // if(isDragging) {
            //     e.preventDefault();
            //     isDragging = false;
            // }
        };
        
        this.addEventListeners(square, 'mousedown', mouseDownHandler);
        this.addEventListeners(document, 'mousemove', mouseMoveHandler);
        this.addEventListeners(document, 'mouseup', mouseUpHandler);
    }
    
    setupHuePicker(){
        const bar = document.getElementById('colorHueBar');
        const slider = document.getElementById('hueSlider');
        
        if(!bar || !slider) {
            console.error('Hue picker elements not found');
            return;
        }
        
        let isDragging = false;
        
        const updateHue = (e) => {
            const rect = bar.getBoundingClientRect();
            const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
            
            this.currentHSV.h = (y / rect.height) * 360;
            slider.style.top = `${y - 2}px`;
            
            this.updateFromHSV();
            this.updatePickerVisuals();
        };
        
        this.addEventListeners(bar, 'mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            updateHue(e);
        });
        
        this.addEventListeners(document, 'mousemove', (e) => {
            // if(isDragging) {
            //     e.preventDefault();
            //     updateHue(e);
            // }
        });
        
        this.addEventListeners(document, 'mouseup', (e) => {
            // if(isDragging) {
            //     e.preventDefault();
            //     isDragging = false;
            // }
        });
    }
    
    setupAlphaPicker(){
        const bar = document.getElementById('colorAlphaBar');
        const slider = document.getElementById('alphaSlider');
        const valueDisplay = document.getElementById('alphaValue');
        
        if(!bar || !slider || !valueDisplay) {
            console.error('Alpha picker elements not found');
            return;
        }
        
        let isDragging = false;
        
        const updateAlpha = (e) => {
            const rect = bar.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            
            this.currentAlpha = x / rect.width;
            slider.style.left = `${x - 2}px`;
            valueDisplay.textContent = `${Math.round(this.currentAlpha * 100)}%`;
            
            this.updateFromHSV();
        };
        
        this.addEventListeners(bar, 'mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            updateAlpha(e);
        });
        
        this.addEventListeners(document, 'mousemove', (e) => {
            // if(isDragging) {
            //     e.preventDefault();
            //     updateAlpha(e);
            // }
        });
        
        this.addEventListeners(document, 'mouseup', (e) => {
            // if(isDragging) {
            //     e.preventDefault();
            //     isDragging = false;
            // }
        });
    }
    
    updatePickerVisuals(){
        // Update saturation/brightness square background
        const square = document.getElementById('colorSbSquare');
        if(square){
            const hueColor = this.hsvToRgb(this.currentHSV.h, 1, 1);
            square.style.background = `
                linear-gradient(to bottom, 
                    rgba(0,0,0,0) 0%, 
                    rgba(0,0,0,1) 100%
                ),
                linear-gradient(to right, 
                    rgba(255,255,255,1) 0%, 
                    rgb(${hueColor.r}, ${hueColor.g}, ${hueColor.b}) 100%
                )
            `;
            
            // Update cursor position
            const cursor = document.getElementById('sbCursor');
            if(cursor){
                // Use fixed dimensions since getBoundingClientRect might return 0 initially
                const width = 200; // matching CSS width
                const height = 200; // matching CSS height
                cursor.style.left = `${this.currentHSV.s * width}px`;
                cursor.style.top = `${(1 - this.currentHSV.v) * height}px`;
            }
        }
        
        // Update hue slider position
        const hueSlider = document.getElementById('hueSlider');
        if(hueSlider){
            const height = 200; // matching CSS height
            hueSlider.style.top = `${(this.currentHSV.h / 360) * height - 2}px`;
        }
        
        // Update alpha slider position
        const alphaSlider = document.getElementById('alphaSlider');
        const alphaValue = document.getElementById('alphaValue');
        if(alphaSlider){
            // Alpha bar width is flex, but we can estimate
            const width = 160; // approximate width
            alphaSlider.style.left = `${this.currentAlpha * width - 2}px`;
        }
        if(alphaValue){
            alphaValue.textContent = `${Math.round(this.currentAlpha * 100)}%`;
        }
    }
    
    updateFromHSV(){
        const rgb = this.hsvToRgb(this.currentHSV.h, this.currentHSV.s, this.currentHSV.v);
        const color = {
            r: rgb.r / 255,
            g: rgb.g / 255,
            b: rgb.b / 255,
            a: this.currentAlpha
        };
        
        if(this.colorChangeCallback){
            this.colorChangeCallback(color);
        }
        
        this.updateColorDisplay(color);
    }
    
    updateColorDisplay(color){
        const r = Math.round(color.r * 255);
        const g = Math.round(color.g * 255);
        const b = Math.round(color.b * 255);
        const a = color.a || 1;
        
        // Update preview
        const preview = document.getElementById('colorPreviewLarge');
        if(preview){
            preview.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        
        // Update value displays
        const rgbDisplay = document.getElementById('rgbDisplay');
        if(rgbDisplay){
            rgbDisplay.textContent = `${r}, ${g}, ${b}`;
        }
        
        const hexDisplay = document.getElementById('hexDisplay');
        if(hexDisplay){
            hexDisplay.textContent = this.rgbToHex(r, g, b);
        }
        
        // Update main value display
        this.inputHelperValue.innerHTML = ``;
    }
    
    
    getColorValue(component, property){
        // Handle MonoBehavior variables
        if(this.contextType === 'monobehavior'){
            const varDef = component.vars?.[property];
            return varDef?.value || {r: 1, g: 1, b: 1, a: 1};
        }

        // Handle regular component properties
        if(!property.includes(".")){
            return component.properties[property] || {r: 1, g: 1, b: 1, a: 1};
        }
        // Handle nested properties like color.r
        let [key, channel] = property.split(".");
        return component.properties[key] || {r: 1, g: 1, b: 1, a: 1};
    }
    
    setColorValue(component, property, color){
        // Handle MonoBehavior variables
        if(this.contextType === 'monobehavior'){
            const change = new MonoBehaviorVarChange(component.id, property, {type: 'color', value: color}, { source: 'ui' });
            window.changeManager.applyChange(change);
            return;
        }

        // Handle regular component properties
        if(!property.includes(".")){
            component.Set(property, color);
            return;
        }
        // Handle individual channel updates
        let [key, channel] = property.split(".");
        let currentColor = deepClone(component.properties[key]);
        if(channel){
            currentColor[channel] = color[channel];
        } else {
            currentColor = color;
        }
        component.Set(key, currentColor);
    }
    
    // Color conversion utilities
    rgbToHsv(r, g, b){
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        let h = 0;
        let s = max === 0 ? 0 : delta / max;
        let v = max;
        
        if(delta !== 0){
            if(max === r){
                h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
            } else if(max === g){
                h = ((b - r) / delta + 2) * 60;
            } else {
                h = ((r - g) / delta + 4) * 60;
            }
        }
        
        return {h, s, v};
    }
    
    hsvToRgb(h, s, v){
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        
        if(h >= 0 && h < 60){
            [r, g, b] = [c, x, 0];
        } else if(h >= 60 && h < 120){
            [r, g, b] = [x, c, 0];
        } else if(h >= 120 && h < 180){
            [r, g, b] = [0, c, x];
        } else if(h >= 180 && h < 240){
            [r, g, b] = [0, x, c];
        } else if(h >= 240 && h < 300){
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }
    
    rgbToHex(r, g, b){
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
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
        
        // Reset numeric input container visibility
        const numericContainer = document.getElementById("numericInputContainer");
        if(numericContainer) {
            numericContainer.style.display = "block";
        }
        
        // Hide color selector if it exists
        if(this.colorSelectorContainer) {
            this.colorSelectorContainer.style.display = "none";
        }
        
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

    inputFocusChanged(activeEl, component, property, contextType = null){
        if(!this.initialized){
            return;
        }
        if(this.currentInput === activeEl){
            return;
        }

        this.focusComponent = component;
        this.focusProperty = property;
        this.contextType = contextType; // 'monobehavior' or null for regular components
        //inspector.propertiesPanel.render(SM.selectedEntity)
        this.clearHighlight();

        this.currentInput = activeEl;
        if(activeEl.type === "number"){
            this.helpNumericInputElement(activeEl, component, property);
        }
        if(activeEl.type === "color"){
            this.helpColorInputElement(activeEl, component, property);
        }

    }

}
export const inputHandler = new InputHandler();
window.inputHandler = inputHandler;