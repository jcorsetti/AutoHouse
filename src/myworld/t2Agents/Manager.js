const Observable = require('../../utils/Observable')
const Clock = require('../../utils/Clock')
const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')
const {TakeOrderGoal, TakeOrderIntention} = require('../t1Agents/utils')
const {DAY_ENERGY_COST, NIGHT_ENERGY_COST, SOLD_ENERGY_GAIN, FOOD_PRICE} = require('../scenarios/constants')


class FoodNotificationGoal extends Goal {
    constructor(food_ordered) {
        super()

        this.food_ordered = food_ordered
    }
}

// Intention of notify food changes
class FoodNotificationIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)
        
        
        this.agent = agent
        this.food_ordered = goal.food_ordered
    }

    static applicable(goal) {
        return goal instanceof FoodNotificationGoal
    }

    *exec() {
        // Updates expenses history based on ordered food
        let notification = new Promise(async () => {
            let food_total_cost = this.food_ordered * FOOD_PRICE
            let cur_day = Clock.global.dd
            this.agent.history.expenses[cur_day] += food_total_cost
        })
        yield notification
    }
}

class MonitorSolarPanelGoal extends Goal {
    constructor() {
        super()
    }
}

// Monitor solar panel status
class MonitorSolarPanelIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)
    }

    static applicable(goal) {
        return goal instanceof MonitorSolarPanelGoal
    }

    *exec() {
        
        let monitor = new Promise(async () => {    
            // change of status modifies internal belief of watt gain
            while(true) {
                let status = await this.agent.source.notifyChange('status')
                if (status == 'on') // means that before it was off: must add electricity consumption
                    this.agent.beliefs.set('watt_gain', this.agent.source.production)
                else // means it was on before: subtract electricity consumption 
                    this.agent.beliefs.set('watt_gain', 0)
            }
        })
        
        yield monitor

    }

}

class UpdateHistoryGoal extends Goal {
    constructor() {
        super()
    }
}

// Manager mantains history of energy consumed, bought and general expenses for each day
class UpdateHistoryIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)
    }

    static applicable(goal) {
        return goal instanceof UpdateHistoryGoal
    }


    *exec() {
        
        Clock.global.observe('mm', async () => {
            var time = Clock.global
            // New day: init history

            if (time.dd > 0 && time.hh == 0 && time.mm == 0) {
                
                let history_len = this.agent.history.watt_consumption.length
                console.log('Day ' + time.dd + ' consumption: ')
                for (const prop in this.agent.history) {
                    console.log('\t' + prop + ' : ' + this.agent.history[prop][history_len-1])
                }
                    
                this.agent.history.watt_consumption.push(0)
                this.agent.history.energy_bought.push(0)
                this.agent.history.expenses.push(0)

            }

            // Update values 
            else {
                // Get current consumption and stored energy, update history
                let cur_watt = this.agent.beliefs.watt_consumption
                let gained_watt = this.agent.beliefs.watt_gain
                let stored_watt = this.agent.beliefs.battery_status
                let net_consumption = cur_watt - gained_watt
                let total_expenses = 0
                let new_battery_status = 0
                // This is not dependant from battery
                this.agent.history.watt_consumption[time.dd] += cur_watt 
                
                // Most common, must access to battery or buy energy
                if (net_consumption >= 0) {

                    // energy that can be gained from battery
                    let sub = (net_consumption <= stored_watt)? net_consumption : stored_watt
                    new_battery_status = (net_consumption <= stored_watt)? stored_watt - net_consumption : 0
                    // Residual energy, this must be payed for
                    net_consumption = net_consumption - sub
                    if (net_consumption > 0) {
                        
                        if (Clock.isDay(time))
                            var cur_expenses = net_consumption * DAY_ENERGY_COST //Watt bought at 0.2 during the day
                        else 
                            var cur_expenses = net_consumption * NIGHT_ENERGY_COST // And 0.1 during the night
            
                        // Update expenses and bought energy
                        this.agent.history.energy_bought[time.dd] += net_consumption 
                        total_expenses += cur_expenses 
                    } 


                }
                // Negative consumption: energy is gained, thus added to the battery!
                else {
                    let net_gain = -1 * net_consumption
                    new_battery_status = stored_watt + net_gain
                    if (new_battery_status > this.agent.BATTERY_CAP) {
                        new_battery_status = this.agent.BATTERY_CAP
                        net_gain = (new_battery_status - this.agent.BATTERY_CAP)
                    }
                    if (net_gain > 0) 
                        total_expenses -= net_gain * SOLD_ENERGY_GAIN // extra watt always sold for 0.1
                }

                this.agent.beliefs.set('battery_status', new_battery_status)
                this.agent.history.expenses[time.dd] += total_expenses
            }
            
        })
    }
}

class MonitorElectricityGoal extends Goal {
    constructor() {
        super()
    }
}

// Monitor status (on/off) of controlled devices
class MonitorElectricityIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)
    }

    static applicable(goal) {
        return goal instanceof MonitorElectricityGoal
    }

    *exec() {
        var monitors_goals = []

        for (let device of this.agent.devices) {
            let monitor = new Promise( async res => {
                while (true) {
                    // When one of the device status changes, watt consumpion id added/removed from current consumption
                    let status = await device.notifyChange('status')
                    let e_consumption = this.agent.beliefs.watt_consumption
                    if (status == 'on') // means that before it was off: must add electricity consumption
                        this.agent.beliefs.set('watt_consumption',e_consumption + device.consumption)
                    else // means it was on before: subtract electricity consumption 
                        this.agent.beliefs.set('watt_consumption',e_consumption - device.consumption)
                }
            });
            monitors_goals.push(monitor)
        }
        yield Promise.all(monitors_goals)
    }
}


class Manager extends Agent {
    constructor(name, devices, source) {
        super(name)
        // Manager capabilities
        this.intentions.push(MonitorElectricityIntention)
        this.intentions.push(MonitorSolarPanelIntention)
        this.intentions.push(FoodNotificationIntention)
        this.intentions.push(UpdateHistoryIntention)

        // Used to monitor electricity
        this.beliefs = new Observable({'watt_consumption': 0, 'watt_gain': 0, 'battery_status' : 0})
        this.BATTERY_CAP = 2000
        this.devices = devices
        this.source = source // energy source, tipically solar panels
        this.history = {
            'watt_consumption' : [0],
            'energy_bought' : [0],
            'expenses' : [0]
        }

    }

    // method to set an agent attributes if it allows taking orders
    setAgentAttribute(agent, key, value) {

        if (agent.intentions.includes(TakeOrderIntention)) {
            agent.postSubGoal(new TakeOrderGoal(key, value)).then(
                (result) => {
                    if (result)
                        console.log(this.name +' : setted ' + key + ' in ' + agent.name + ' to ' + value + ' succesfully')
                    else
                        console.log(this.name+' error: no attribute ' + key + ' in ' + agent.name)
                })
                
        }
        else console.log('Agent ' + agent.name + ' does not take orders!')
    }
}

module.exports = {Manager, MonitorElectricityGoal, UpdateHistoryGoal, MonitorSolarPanelGoal, FoodNotificationGoal, FoodNotificationIntention}