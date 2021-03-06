const Observable = require('../../utils/Observable');
const Clock = require('../../utils/Clock');
const Agent = require('../../bdi/Agent');
const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')

class Person extends Agent {
    constructor (name) {
        super(name)
        this.house = undefined;         // reference to the house
        this.name = name;               // non-observable
        this.beliefs = new Observable({'in_room':undefined,'in_house':false})
        this.intentions.push(WorkIntention)
    }

    // Move a person to an adjacent room
    moveTo (destRoom) {

        if (this.beliefs.in_house) {

            if (this.house.openDoor(this, this.beliefs.in_room, destRoom)) { 
                this.house.rooms[this.beliefs.in_room].removePerson(this.name)
                this.house.rooms[destRoom].addPerson(this.name)
                this.log('moved from', this.beliefs.in_room, 'to', destRoom)
                // Clumsy people: sometimes they do not close the door after exiting
                if (Math.random() > 0.2)
                    this.house.closeDoor(this, this.beliefs.in_room, destRoom)
                this.beliefs.in_room = destRoom
                return true
            }
            else {
                this.log('failed moving from', this.beliefs.in_room, 'to', destRoom)
                //exit(0)
                return false
            }
        }
    }
    // Moves the person out of the house
    getOut () {
        if (this.beliefs.in_house) {
            this.beliefs.in_house = false 
            this.house.rooms[this.beliefs.in_room].removePerson(this.name)
            this.beliefs.in_room = undefined
            this.log('got out of the house.')
        }
    }
    
    // Moves the person in the house
    getIn () {
        if (!this.beliefs.in_house) {
            this.beliefs.in_house = true 
            this.beliefs.in_room = 'living_room'
            this.house.rooms['living_room'].addPerson(this.name)
            this.log('got in the house, welcome!')
        }
    }

    // Simultates working behaviour: the person leaves and come back after a while
    goToWork (minWorkHours, maxWorkHours) {
        
        if (this.beliefs.in_house) {
            this.postSubGoal(new WorkGoal(minWorkHours, maxWorkHours))
            .then(() => this.getIn())
            .catch((err) => {
                this.getIn()
                this.error(res)
            })
        }
    }
}

class WorkGoal extends Goal {
    constructor(minWorkHours, maxWorkHours) {
        super()
        this.minWorkHours = minWorkHours
        this.maxWorkHours = maxWorkHours
    }
}
    
    // Start a cycle if conditions are met
class WorkIntention extends Intention {
    constructor(agent, goal) {
        super(agent, goal)
        this.agent = agent
        this.goal = goal
    }

    static applicable (goal) {
        return goal instanceof WorkGoal 
    }

    *exec() {

        // Generate worktime and return time
        let work_time = Clock.randomTime(this.goal.minWorkHours, this.goal.maxWorkHours)
        let return_time = Clock.sumTime(Clock.global, work_time)
        this.agent.log('going to work, I will be back at ' + Clock.timeToString(return_time))
        this.agent.getOut()
            
        // Wait for finish time to arrive
        while(true) {
            Clock.global.notifyChange('mm')
            if (Clock.equalTimes(Clock.global, return_time)) {
                break
            }
            yield 
        
        }
    }
}



module.exports = Person