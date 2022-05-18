const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')

class TakeOrderGoal extends Goal {
    constructor(key, value) {
        super()
        this.key = key
        this.value = value
    }
}

// An agent having this intention can take orders (i.e. having his own attributes modified) by another Agent
class TakeOrderIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)
        this.key = goal.key
        this.value = goal.value
    }

    static applicable (goal) {
        return goal instanceof TakeOrderGoal
    }

    *exec() {
        // Goal contains both key and value to be set
        var goalPromise = new Promise( async (resolve, reject) => {
            if (this.key in this.agent.device) {
                this.agent.device.set(this.key, this.value) // Attribute must be Observable
                resolve(this.key)

            }
            else reject(this.key)
            
        })
    
    return goalPromise
    }
}

module.exports = {TakeOrderGoal, TakeOrderIntention}