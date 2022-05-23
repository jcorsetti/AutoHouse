const Clock = require('../../utils/Clock')
const Observable = require('../../utils/Observable')
const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')
const {BAD_WEATHER_PROB} = require('../scenarios/constants')
const { sumTime, equalTimes } = require('../../utils/Clock')


class MonitorWeatherGoal extends Goal {
    constructor() {
        super()
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
                let event_duration = Clock.random_time(7,2) //Between 2 and 7 hours
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
    constructor(name, solar_panels) {

        super(name)   
        this.solar_panels = solar_panels
        this.intentions.push(MonitorWeatherIntention)
        this.beliefs = new Observable({'dangerous_weather': false})
    }

}

module.exports = {Overseer, MonitorWeatherGoal}