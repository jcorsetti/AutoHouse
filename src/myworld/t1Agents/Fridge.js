const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')
const Observable = require('../../utils/Observable')
const FridgeDevice = require('../devices/FridgeDevice')
const {FoodNotificationGoal} = require('../t2Agents/Manager')

// Agent managing a fridge
class Fridge extends Agent {
    constructor(name, manager) {
        super(name)

        this.device = new FridgeDevice(name, 10)
        this.intentions.push(KeepStockedIntention) //always active
        this.manager = manager   // relative manager. Threshold ath which food is ordered, quantity of food ordered
        this.beliefs = new Observable({'food' : 7, 'food_order_level' : 6, 'food_to_order' : 3})
    }

    // Serve food to people and updates internal status
    serveFood(num_people) {
        if (num_people <= this.beliefs.food) {
            console.log(this.name + ' : food served for ' + num_people + ' people')
            this.beliefs.food -= num_people
        }
        else {
            let fasting_people = num_people -= this.beliefs.food
            console.log(this.name + ' : not enough food, ' + fasting_people + ' people will not eat!')
            this.beliefs.food = 0
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
                let food = await this.agent.beliefs.notifyChange('food')
                // If it fall under a certain value, notify the Manager to buy more food
                if (food <= this.agent.beliefs.food_order_level) {    
                    this.agent.manager.postSubGoal(new FoodNotificationGoal(this.agent.beliefs.food_to_order))
                    // Internal beliefs are then updated
                    this.agent.beliefs.food += this.agent.beliefs.food_to_order
                    console.log('Food ordered!')
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