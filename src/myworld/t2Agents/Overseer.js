const Clock = require('../../utils/Clock')
const Observable = require('../../utils/Observable')
const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')
const {BAD_WEATHER_PROB} = require('../scenarios/constants')
const { sumTime, equalTimes } = require('../../utils/Clock')
const {containsObject, removeObject} = require('../../utils/helpers')

class MonitorWeatherGoal extends Goal {
    constructor() {
        super()
    }
}

class MonitorDoorsGoal extends Goal {
    constructor() {
        super()
    }
}

class ScanHouseGoal extends Goal {
    constructor() {
        super()
    }
}

class ScanHouseIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)
        this.agent = agent
        this.goal = goal
    }

    static applicable(goal) {
        return goal instanceof ScanHouseGoal
    }

    *exec() {
        let house = this.agent.house
        let legal_people = house.people

        for (let room_name in house.rooms) {
            let room = house.rooms[room_name]
            console.log(room_name)
            for (let person_name of room.people_list) {
                console.log(person_name)
                if (!(person_name in legal_people))
                    console.log('Alert! Detected unknown person ' + person_name + ' in ' + room_name)
            }            
        }
    }
}

class MonitorWeatherIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)

        this.agent = agent
        this.goal = goal
    }

    static applicable(goal) {
        return goal instanceof MonitorWeatherGoal
    }

    *exec() {
        // Every hour, dangerous weather as a chance of occurring
        Clock.global.observe('hh', async () => {
            var time = Clock.global
            let chance = Math.random()
            if ((chance <= BAD_WEATHER_PROB) && (!this.agent.beliefs.dangerous_weather)) {
                console.log(this.agent.name + ' dangerous weather event occurring, covering solar panels')
                this.agent.solar_panels.set('cover','on')
                this.agent.solar_panels.set('status','off')
                // The random duration of the event is generated contextually
                let event_duration = Clock.randomTime(7,2) //Between 2 and 7 hours
                let event_finish_time = sumTime(time, event_duration)
                this.agent.beliefs.dangerous_weather = true

                while(true) {
                    
                    time = await Clock.global.notifyChange('mm')
                    // When time comes, the cycle breaks off
                    if (equalTimes(Clock.global, event_finish_time)) {
                        console.log(this.agent.name + ' back to normal weather, starting solar panels')
                        this.agent.solar_panels.set('cover','off')
                        this.agent.beliefs.dangerous_weather = false
                        break
                    }
                }
            }
        })

    }
}




class Overseer extends Agent {
    constructor(name, house, solar_panels) {

        super(name)   
        this.solar_panels = solar_panels
        this.intentions.push(MonitorWeatherIntention)
        this.intentions.push(ScanHouseIntention)
        this.house = house
        this.beliefs = new Observable({'dangerous_weather': false})
    }

}

module.exports = {Overseer, MonitorWeatherGoal, ScanHouseGoal}