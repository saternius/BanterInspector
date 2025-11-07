log("clipboard", "starting")
let navControls = document.querySelector(".nav-controls")
let tooltipBtn = document.createElement("button")
tooltipBtn.classList.add("nav-control-btn")
tooltipBtn.innerHTML = "<span>📋</span>"
navControls.appendChild(tooltipBtn)

// prevent the button from stealing focus
tooltipBtn.type = "button"
tooltipBtn.addEventListener("mousedown", (e)=>{
	e.preventDefault()
})

// track the last focused input/textarea
let lastFocusedEditable = null
document.addEventListener("focusin", (e)=>{
	const t = e.target
	if(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")){
		lastFocusedEditable = t
	}
})

//paste clipboard to the current input
tooltipBtn.addEventListener("click", async ()=>{
	try{
		const clipboardText = await navigator.clipboard.readText();
		const active = (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA"))
			? document.activeElement
			: lastFocusedEditable;
		if(!active || (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA")){
			showNotification("Focus an input/textarea to paste");
			return;
		}

		const value = active.value ?? "";
		const start = typeof active.selectionStart === "number" ? active.selectionStart : value.length;
		const end = typeof active.selectionEnd === "number" ? active.selectionEnd : start;
		const before = value.slice(0, start);
		const after = value.slice(end);
		active.value = before + clipboardText + after;
		const newPos = start + clipboardText.length;
		if(typeof active.setSelectionRange === "function"){
			active.setSelectionRange(newPos, newPos);
		}
		active.dispatchEvent(new Event("input", { bubbles: true }));
		active.dispatchEvent(new Event("change", { bubbles: true }));
		active.focus();
	}catch(err){
		console.error("Clipboard read failed", err);
		showNotification("Unable to read clipboard");
	}
})