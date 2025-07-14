(function(){
    this.vars = {
        "rotationSpeed": {
            "type": "number",
            "default": 1
        }
    }
    
    this.onStart = ()=>{
        console.log("onStart")
    }

    this.onUpdate = ()=>{
        console.log("onUpdate")
    }

    this.onDestroy = ()=>{
        console.log("onDestroy")
    }

    this.keyDown = (key)=>{
        console.log("keyDown", key)
    }

    this.keyUp = (key)=>{
        console.log("keyUp", key)
    }

    this.keyPress = (key)=>{
        console.log("keyPress", key)
    }
})