const Goal = require('../../bdi/Goal');
const Intention = require('../../bdi/Intention');
const Light = require('./Light');


// Goal: switch on and off lights by sensing presence in rooms
class PersonLighterGoal extends Goal {
    constructor (rooms, lights) {
        super()
        this.rooms = rooms
        this.lights = lights
    }

}

class PersonLighterIntention extends Intention {

    constructor (agent, goal) {
        super(agent, goal)

        this.rooms = goal.rooms
        this.lights = goal.lights

    }

    static applicable (goal) {
        return goal instanceof PersonLighterGoal
    }

    *exec () {
        // Accumulates promises for all lights
        var lightsGoals = []
        // Cycle rooms
        for (let room of this.rooms) {

            let lightGoalPromise = new Promise( async res => {
                while (true) {
                    // Check number of people in each room
                    let status = await room.notifyChange('people_count')
                    
                    // Lights are switched on or off based on presence of people
                    if (status >= 1) {
                        // Assumes relative lights to contain the name of the room
                        for(let light of this.lights) {
                            if (light.name.startsWith(room.name) && (light.status == 'off'))
                                light.switchOnLight()
                        }
                    }
                    else 
                        for(let light of this.lights)
                            if (light.name == room.name && (light.status == 'on'))
                                light.switchOffLight()

                }
            });

            lightsGoals.push(lightGoalPromise)
        }
        yield Promise.all(lightsGoals)
    }
}


module.exports = {PersonLighterGoal, PersonLighterIntention}