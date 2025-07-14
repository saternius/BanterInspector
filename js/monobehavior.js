export class MonoBehavior{
    constructor(slot, compData){
        this.slot = slot;
        this.id = compData.id;
        this.type = compData.type;
        this.properties = compData.properties;
        this.vars = {}
    }
}