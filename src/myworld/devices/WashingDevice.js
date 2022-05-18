const Observable = require('../../utils/Observable');

// Defines attributes of the washing machine / dishwasher, accessed by the agent
class WashingDevice extends Observable {
    constructor () {
        super()
        this.consumption = 100 //Energy consumption
        this.name = 'bath1_wm' //fixed name
        this.time = {dd:0,hh:0,mm:45} //Time of cycle
        this.set('status','off')     
        this.set('num_loads',0)     // max 4 loads
        this.set('eco_mode','off')  
        this.set('done', false)     // if, true, device is waiting for unloading

    }
}

module.exports = WashingDevice