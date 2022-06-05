const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')
const Observable = require('../../utils/Observable')
const FridgeDevice = require('../devices/FridgeDevice')
const {FoodNotificationGoal} = require('../t2Agents/Manager')
const { TakeOrderIntention } = require('./utils')

// Agent managing a fridge
class Fridge extends Agent {
    constructor(name, manager) {
        super(name)

        this.device = new FridgeDevice(name, 10)
        this.intentions.push(KeepStockedIntention) //always active\
        this.intentions.push(TakeOrderIntention)
        this.manager = manager   // relative manager. Threshold ath which food is ordered, quantity of food ordered
    }

    // Serve food to people and updates internal status
    serveFood(num_people) {
        if (num_people <= this.device.food) {
            if (num_people > 0)
                this.log('food served for ' + num_people + ' people')
            else
                this.log('there are no people in the house, no food is serve.')
            this.device.food -= num_people
        }
        else {
            let fasting_people = num_people -= this.device.food
            this.log('not enough food, ' + fasting_people + ' people will not eat!')
            this.device.food = 0
        }   
    }
}

// Intention of keeping the food quantity over a certain value
class KeepStockedIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)
    }

    static applicable (goal) {
        return goal instanceof KeepStockedGoal
    }

    *exec() {
        
        let monitor = new Promise(async () => {    
            
            while(true) {
                // Check food changes, buy more when necessary
                let food = await this.agent.device.notifyChange('food')
                // If it fall under a certain value, notify the Manager to buy more food
                if (food <= this.agent.device.food_order_level) {    
                    this.agent.manager.postSubGoal(new FoodNotificationGoal(this.agent.device.food_to_order, this.agent))
                    this.log('Food ordered, new food level: ' + this.agent.device.food)
                } 
            }
        })        
        
        yield monitor
    
    }

}

class KeepStockedGoal extends Goal {
    constructor() {
        super()
    }    
}

module.exports = {Fridge, KeepStockedGoal}