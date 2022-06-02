const Clock = require('../../utils/Clock')
const Observable = require('../../utils/Observable')
const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')
const Person = require('../structure/Person')
const {BAD_WEATHER_PROB} = require('../scenarios/constants')
const { sumTime, equalTimes } = require('../../utils/Clock')
const {containsObject, removeObject} = require('../../utils/helpers')

class MonitorWeatherGoal extends Goal {
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

        // Iterate over rooms
        for (let room_name in house.rooms) {
            let room = house.rooms[room_name]
            // Iterate over people in room
            for (let person_name of room.people_list) {
                // Check people list against list of legal people
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

    
    // Authorize an agent to access a door between room1 e room2
    authAgentDoor(house, agent, room1, room2) {
        var found = false
        for (let door of house.doors) {
            if (((door.room1 == room1) && (door.room2 == room2)) || ((door.room2 == room1) && (door.room1 == room2))) { 
                found = true
                // Works for both Person and non-Persons Agents (like smart devices), but on different lists
                if (agent instanceof Person) {
                    if (!containsObject(agent.name, door.people_allowed)) {
                        door.people_allowed.append(agent.name)
                        break   
                    }
                }
                else {
                    if (agent instanceof Agent) {
                        if (!containsObject(agent.name, door.device_allowed)) {
                            door.device_allowed.append(agent.name)
                            break   
                        }    
                    }
                }
            }
        }
        if (!found)
            console.log('Could not find door between ' + room1 + ' and ' + room2)
    }

    // Remove an agent authorization to access a door between room1 and room2
    deauthAgentDoor(house, agent, room1, room2) {
        var found = false

        for (let door of house.doors) {
            if (((door.room1 == room1) && (door.room2 == room2)) || ((door.room2 == room1) && (door.room1 == room2))) { 
                found = true
                if (agent instanceof Person) {
                    if (containsObject(agent, door.people_allowed)) {
                        removeObject(agent, door.people_allowed) 
                        break   
                    }
                }
                else {
                    if (agent instanceof Agent) {
                        if (containsObject(agent, door.device_allowed)) {
                            removeObject(agent, door.device_allowed) 
                            break   
                        }
                    }
                }
            }
        }
        if (!found)
            console.log('Could not find door between ' + room1 + ' and ' + room2)
    }
    
    // Authorize an agent to access all doors in the house
    authAgentAllDoors(house,agent) {
        
        for (let door of house.doors)  {
            
            if (agent instanceof Person) {
                
                if (!containsObject(agent.name, door.people_allowed)) {
                    door.people_allowed.push(agent.name)
                    console.log(agent.name + ' registered to ' + door.name)
                }
            }
            else {
                if (agent instanceof Agent) {
                    if (!containsObject(agent.name, door.device_allowed)) {
                        door.device_allowed.push(agent.name)
                    }    
                }
            }    
        }
    }

    // Remove an agent authorization to access all doors
    deauthAgentAllDoors(house, agent) {
        for (let door of house.doors) {
            
            if (agent instanceof Person) {
                if (containsObject(agent, door.people_allowed)) {
                    removeObject(agent, door.people_allowed) 
                }
            }
            else {
                if (agent instanceof Agent) {
                    if (containsObject(agent, door.device_allowed)) {
                        removeObject(agent, door.device_allowed) 
                    }
                }
            }       
        }
    }

}

module.exports = {Overseer, MonitorWeatherGoal, ScanHouseGoal}