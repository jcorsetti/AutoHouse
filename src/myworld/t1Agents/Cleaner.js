const pddlActionIntention = require('../../pddl/actions/pddlActionIntention')
const Clock = require('../../utils/Clock')
const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Intention = require('../../bdi/Intention')
const PlanningGoal = require('../../pddl/PlanningGoal')
const CleanerDevice = require('../devices/CleanerDevice')
const house = require('../structure/House')

class ReplanningIntention extends Intention {
    static applicable (goal) {
        return goal instanceof PlanningGoal
    }
    *exec (parameters) {
        yield new Promise(res=>setTimeout(res,10))
        yield this.agent.postSubGoal( new PlanningGoal(parameters) )
    }
}


// Defines, again, actions as pddl intentions
class MoveTo extends pddlActionIntention {
    static parameters = ['agent', 'room1', 'room2'];
    static precondition = [['accessible', 'room1', 'room2'], ['in-room', 'room1', 'agent']];
    static effect = [['in-room', 'room2','agent'], ['not in-room','room1','agent']];
    *exec ({agent, room1, room2}=parameters) {

        let finish_time = Clock.sumTime(Clock.global, this.agent.device.movetime)
        yield house.moveTo({
            agent:agent,
            room1:room1,
            room2:room2
        })

        while(true) {
            Clock.global.notifyChange('mm')
            if (Clock.equalTimes(Clock.global, finish_time)) {
                // When happens, update beliefs and exit cycle
                break
            }
            yield
        }
    }
}

class CleanFilthy extends pddlActionIntention {
    static parameters = ['agent','room'];
    static precondition = [['in-room', 'room', 'agent'], ['filthy','room'], ['not busy', 'room']];
    static effect = [['dirty', 'room'],['not filthy', 'room']];
    *exec ({agent, room}=parameters) {

        let finish_time = Clock.sumTime(Clock.global, this.agent.device.time)

        yield house.cleanFilthy({
            agent: agent, 
            room: room
        })
        while(true) {
            Clock.global.notifyChange('mm')
            if (Clock.equalTimes(Clock.global, finish_time)) {
                // When happens, update beliefs and exit cycle
                break
            }
            yield
        }
    }
}

class CleanDirty extends pddlActionIntention {
    static parameters = ['agent','room'];
    static precondition = [['in-room', 'room', 'agent'], ['dirty','room'], ['not busy', 'room']];
    static effect = [['clean', 'room'],['not dirty', 'room']];
    *exec ({agent, room}=parameters) {

        let finish_time = Clock.sumTime(Clock.global, this.agent.device.time)
        yield house.cleanDirty({
            agent: agent, 
            room: room
        })
        while(true) {
            Clock.global.notifyChange('mm')
            if (Clock.equalTimes(Clock.global, finish_time)) {
                // When happens, update beliefs and exit cycle
                break
            }
            yield
        }
    }
}

class Cleaner extends Agent {
    constructor(house, name, position) {
        super(name)
        this.device = new CleanerDevice(name, position)
        this.house = house
        this.beliefs.declare('in-room ' + position + ' ' + name)
        this.house.beliefs.declare('in-room ' + position + ' ' + name)
    }

    run_cleaning_schedule() {

        
        if (this.device.status == 'off') {
            
            this.device.set('status','on')
            let {OnlinePlanning} = require('../../pddl/OnlinePlanner')([MoveTo, CleanDirty, CleanFilthy])
            this.intentions.push(OnlinePlanning)
            //this.intentions.push(ReplanningIntention)
            console.log('a1 entries', this.beliefs.entries)
            console.log('a1 literals', this.beliefs.literals)
            this.postSubGoal( new PlanningGoal( { goal: ['clean backyard', 'clean kitchen', 'clean living_room', 'in-room bathroom vacuum'] }))
            .then((res) => {
                console.log('Plan finished, setting off')
                this.device.set('status','off')
                house.beliefs.unobserve()
            }) // by default give up after trying all intention to achieve the goal
            
        }
        else {
            console.log('Cleaner already on, not starting')
        }

    }
}

module.exports = Cleaner



