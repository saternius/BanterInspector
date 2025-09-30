let getChildEntity = (childName)=>{
    let rel_path = this._entity.id+"/"+childName
    return SM.getEntityById(rel_path)
}

// Stopwatch state
this.startTime = null
this.elapsedTime = 0
this.isRunning = false
this.updateInterval = null
this.lastMinutes = -1
this.lastSeconds = -1

// Get digit entities
let D1 = null
let D2 = null
let D3 = null
let D4 = null
let audioSource = null
this.onLoaded = () => {
    // Cache digit references
    D1 = getChildEntity("Digit1")
    D2 = getChildEntity("Digit2")
    D3 = getChildEntity("Digit3")
    D4 = getChildEntity("Digit4")
    audioSource = this._entity.getComponent("BanterAudioSource")

    // Initial display
    this.updateDisplay(0, 0)

    // Listen for button events
    window.addEventListener('clock-button-clicked', this.handleButtonClick)
}

this.handleButtonClick = (e) => {
    log("stopwatch", "handleButtonClick", e.detail.flag)
    if (e.detail.flag === "playpause") {
        this.togglePlayPause()
    } else if (e.detail.flag === "reset") {
        this.reset()
    }
}

this.togglePlayPause = () => {
    log("stopwatch", "togglePlayPause")
    if (this.isRunning) {
        // Stop the stopwatch
        this.isRunning = false
        this.elapsedTime += Date.now() - this.startTime
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
            this.updateInterval = null
        }
    } else {
        // Start the stopwatch
        this.isRunning = true
        this.startTime = Date.now()

        // Update display every 10ms for smooth seconds counting
        this.updateInterval = setInterval(() => {
            this.updateTime()
        }, 10)
    }
}

this.reset = () => {
    // Stop if running
    if (this.isRunning) {
        this.isRunning = false
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
            this.updateInterval = null
        }
    }

    // Reset time
    this.startTime = null
    this.elapsedTime = 0
    this.lastMinutes = -1
    this.lastSeconds = -1
    // Reset display
    this.updateDisplay(0, 0)
}

this.updateTime = () => {
    if (!this.isRunning) return

    let totalMs = this.elapsedTime + (Date.now() - this.startTime)
    let totalSeconds = Math.floor(totalMs / 1000)
    let minutes = Math.floor(totalSeconds / 60)
    let seconds = totalSeconds % 60

    // Limit to 99:59 max display
    if (minutes > 99) {
        minutes = 99
        seconds = 59
    }

    this.updateDisplay(minutes, seconds)
}

this.updateDisplay = async (minutes, seconds) => {
    // Only update if values have changed
    if (minutes === this.lastMinutes && seconds === this.lastSeconds) {
        return
    }

    // Store new values
    this.lastMinutes = minutes
    this.lastSeconds = seconds
    audioSource._bs.PlayOneShotFromUrl("https://suitable-bulldog-flying.ngrok-free.app/assets/audio/tick.mp3")
    await new Promise(resolve => setTimeout(resolve, 100))

    // Convert to individual digits
    let min1 = Math.floor(minutes / 10)
    let min2 = minutes % 10
    let sec1 = Math.floor(seconds / 10)
    let sec2 = seconds % 10

    // Update each digit display
    if (D1 && D1._digitScript && D1._digitScript.displayNumber) {
        D1._digitScript.displayNumber(min1)
    }
    if (D2 && D2._digitScript && D2._digitScript.displayNumber) {
        D2._digitScript.displayNumber(min2)
    }
    if (D3 && D3._digitScript && D3._digitScript.displayNumber) {
        D3._digitScript.displayNumber(sec1)
    }
    if (D4 && D4._digitScript && D4._digitScript.displayNumber) {
        D4._digitScript.displayNumber(sec2)
    }
}

this.onDestroy = () => {
    // Clean up
    if (this.updateInterval) {
        clearInterval(this.updateInterval)
    }
    window.removeEventListener('clock-button-clicked', this.handleButtonClick)
}
