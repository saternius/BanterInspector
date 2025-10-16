console.log("PassthroughStartup")
let navControls = document.querySelector(".nav-controls")
let passthroughBtn = document.createElement("button")
passthroughBtn.classList.add("nav-control-btn")
passthroughBtn.innerHTML = "<span>🪟</span>"
navControls.appendChild(passthroughBtn)


let cooledDown = true;
let passthrough = null;
passthroughBtn.addEventListener("click", async ()=>{
    if(passthrough){
        if(passthrough.active){
            passthroughBtn.style.opacity = 0.5;
            passthrough.Set("active", false)
            showNotification("Passthrough deactivated")
        }else{
            passthroughBtn.style.opacity = 1;
            passthrough.Set("active", true)
            showNotification("Passthrough activated")
        }
        return;
    }
    if(!cooledDown) return;
    cooledDown = false;
    showNotification("Spawning Passthrough")
    passthrough = await LoadItem("t712", "Scene")
    let attachmentComponent = passthrough.getComponent("BanterAttachedObject")
    await attachmentComponent.Set("uid", scene.localUser.uid)
    await passthrough.Set("name", "Passthrough_"+scene.localUser.name);
    passthroughBtn.disabled = true;
    setTimeout(()=>{
        cooledDown = true;
        passthroughBtn.disabled = false;
    }, 1000)
})