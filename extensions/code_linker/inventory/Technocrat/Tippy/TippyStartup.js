console.log("TippyStartup")
let navControls = document.querySelector(".nav-controls")
let tooltipBtn = document.createElement("button")
tooltipBtn.classList.add("nav-control-btn")
tooltipBtn.innerHTML = "<span>🟨</span>"
navControls.appendChild(tooltipBtn)

tooltipBtn.addEventListener("click", ()=>{
    let tippyExists = SM.getEntityById("Scene/Tippy(Open)")
    if(!tippyExists){
        showNotification("Spawning Tippy")
        LoadItem("Tippy", "Scene")
    }else{
        showNotification("Tippy already in scene")
    }
})