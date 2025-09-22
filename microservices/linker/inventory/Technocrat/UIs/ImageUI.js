this.default = {
    imgUrl: {
        "type": "string",
        "value": ""
    }
}
log("ImageUI", "ImageUI loaded with vars: ", this.vars)
Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]){
        log("ImageUI", "setting var", key, val)
    }
})    

log("ImageUI", "ImageUI loaded with vars: ", this.vars)