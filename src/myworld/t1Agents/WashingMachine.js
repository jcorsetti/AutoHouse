const WashingDevice = require('../devices/WashingDevice')
const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')
const Clock =  require('../../utils/Clock')
const {TakeOrderGoal, TakeOrderIntention} = require('./utils')

class StartCycleGoal extends Goal {
    constructor() {
        super()
    }
}

// Start a cycle if conditions are met
class StartCycleIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)
    }

    static applicable (goal) {
        return goal instanceof StartCycleGoal
    }

    *exec() {
        // Can happen only if the device is off (not currently running) and does not need unloading
        if(!this.agent.device.done && this.agent.device.status == 'off') {
            if ((this.agent.device.num_loads >= 2 && this.agent.device.eco_mode == 'on') || (this.agent.device.num_loads == 4)) {
                // Calculate finish time
                let finish_time = Clock.sumTime(Clock.global, this.agent.device.time)
                console.log(this.agent.name + ' : starting, expected end at time ' + Clock.timeToString(finish_time))
                // Modify beliefs
                this.agent.device.set('status','on')
                this.agent.device.set('num_loads', 0)
                
                // Wait for finish time to arrive
                while(true) {
                    Clock.global.notifyChange('mm')
                    if (Clock.equalTimes(Clock.global, finish_time)) {
                        // When happens, update beliefs and exit cycle
                        console.log(this.agent.name + ' : finished at time ' + Clock.timeToString(Clock.global))
                        this.agent.device.set('status','off')
                        this.agent.device.set('done', true)    
                        break
                    }
                    yield
                }
            }
            else console.log(this.agent.name + ' : not full enough for current setting')
        }
        else console.log(this.agent.name + ' : cannot start, has to be unloaded or is already on')                    
    }

}


class WashingMachine extends Agent {
    
    constructor(name) {
        super(name)
        // This agent can take order from a superior one
        this.intentions.push(TakeOrderIntention)
        this.intentions.push(StartCycleIntention)
        // Init device with attributes
        this.device = new WashingDevice()
    }

    async startCycle() {
        return this.postSubGoal(new StartCycleGoal())
    }

    async addLoad() {
        // Add another load if possible, otherwise rejects
        return new Promise((resolve, reject) => {
  
            if (this.device.status == 'off') {
                if (!this.device.done) {
                    if (this.device.num_loads < 4) {
                        let cur_loads = this.device.num_loads 
                        this.device.set('num_loads', cur_loads+1)
                        resolve(this.device.num_loads)
                    }
                    else reject(this.name + ' : machine already full.')
                
                }
                else reject(this.name + ' : machine finished, waiting to be emptied.')
            }
            else {
                reject(this.name + ' : device still working.')
            }
        })
    }

    // Similar to above, remove loads from washing machine if possible
    async removeLoads() {
        if (this.device.status == 'off' || this.device.status == 'nan') {
            if (this.device.done) {
                this.device.set('num_loads', 0)
                this.device.set('done', false)
                console.log(this.name + ' : emptied loads.')
            }
            else console.log(this.name + ' : no loads available to be emptied.')       
        }
        else {
            console.log(this.name + ' : device still working')
        }
    }
}


module.exports = {WashingMachine, StartCycleGoal, StartCycleIntention}