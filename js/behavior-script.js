export class BehaviorScript{
    constructor(compData){
        this.id = compData.id;
        this.type = compData.type;
        this.properties = compData.properties;
        this.vars = {}
    }
}