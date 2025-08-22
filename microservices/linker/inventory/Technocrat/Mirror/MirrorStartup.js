console.log("MirrorStartup")
let navControls = document.querySelector(".nav-controls")
let tooltipBtn = document.createElement("button")
tooltipBtn.classList.add("nav-control-btn")
tooltipBtn.innerHTML = "<span>🪞</span>"
navControls.appendChild(tooltipBtn)

let cooledDown = true;
tooltipBtn.addEventListener("click", ()=>{
    if(!cooledDown) return;
    cooledDown = false;
    showNotification("Spawning Mirror")
    LoadItem("PersonalMirror", "Scene")
    tooltipBtn.disabled = true;
    setTimeout(()=>{
        cooledDown = true;
        tooltipBtn.disabled = false;
    }, 1000)
})