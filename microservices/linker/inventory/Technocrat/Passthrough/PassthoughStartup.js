console.log("PassthroughStartup")
let navControls = document.querySelector(".nav-controls")
let passthroughBtn = document.createElement("button")
passthroughBtn.classList.add("nav-control-btn")
passthroughBtn.innerHTML = "<span>🪟</span>"
navControls.appendChild(passthroughBtn)


let cooledDown = true;
let spawned = false;
passthroughBtn.addEventListener("click", async ()=>{
    if(spawned){
        if(this._entity.active){
            passthroughBtn.style.opacity = 0.5;
            this._entity.Set("active", false)
            showNotification("Passthrough deactivated")
        }else{
            passthroughBtn.style.opacity = 1;
            this._entity.Set("active", true)
            showNotification("Passthrough activated")
        }
        return;
    }
    if(!cooledDown) return;
    cooledDown = false;
    showNotification("Spawning Passthrough")
    await LoadItem("Passthrough", "Scene")
    let attachmentComponent = this._entity.getComponent("BanterAttachedObject")
    await attachmentComponent.Set("uid", scene.localUser.uid)
    await this._entity.Set("name", "Passthrough_"+scene.localUser.name);
    spawned = true;
    passthroughBtn.disabled = true;
    setTimeout(()=>{
        cooledDown = true;
        passthroughBtn.disabled = false;
    }, 1000)
})