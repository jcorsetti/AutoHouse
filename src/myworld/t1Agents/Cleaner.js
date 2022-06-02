const {pddlActionIntention} = require('../../pddl/actions/pddlActionIntention')
const Clock = require('../../utils/Clock')
const Agent = require('../../bdi/Agent')
const PlanningGoal = require('../../pddl/PlanningGoal')
const CleanerDevice = require('../devices/CleanerDevice')
const house = require('../structure/House')
const { TakeOrderIntention } = require('./utils')
const { containsObject } = require('../../utils/helpers')


// Defines, again, actions as pddl intentions
class MoveTo extends pddlActionIntention {
    static parameters = ['agent', 'room1', 'room2'];
    static precondition = [['accessible', 'room1', 'room2'], ['in-room', 'room1', 'agent'], ['not busy', 'room2']];
    static effect = [['in-room', 'room2','agent'], ['not in-room','room1','agent']];
    *exec ({agent, room1, room2}=parameters) {

        let finish_time = Clock.sumTime(Clock.global, this.agent.device.movetime)
        var cur_agent = house.planning_agents[agent]
        var error_in_plan = false

        yield house.moveTo({
            agent:agent,
            room1:room1,
            room2:room2
        })
        .catch(async (error) => {
            console.log('Error catched: ' + error)
            error_in_plan = true
        })

        if (!error_in_plan) {

            let cur_agent = house.planning_agents[agent]
            if (house.beliefs.check('in-room ' + room2 + ' ' + agent) && house.beliefs.check('not in-room ' + room1 + ' ' + agent)) {
                cur_agent.beliefs.declare('in-room ' + room2 + ' ' + agent)
                cur_agent.beliefs.undeclare('in-room ' + room1 + ' ' + agent)
            }

            while(true) {
                Clock.global.notifyChange('mm')
                if (Clock.equalTimes(Clock.global, finish_time)) {
                    // When happens, update beliefs and exit cycle
                    break
                }
                yield
            }
        }
        else {
            console.log(cur_agent.name + ' in panic mode!')
            cur_agent.restart = true
        } 
    }
}

class CleanFilthy extends pddlActionIntention {
    static parameters = ['agent','room'];
    static precondition = [['in-room', 'room', 'agent'], ['filthy','room'], ['not busy', 'room']];
    static effect = [['dirty', 'room'],['not filthy', 'room']];
    *exec ({agent, room}=parameters) {

        let finish_time = Clock.sumTime(Clock.global, this.agent.device.time)
        var cur_agent = house.planning_agents[agent]
        var error_in_plan = false

        yield house.cleanFilthy({
            agent: agent, 
            room: room
        })
        .catch(async (error) => {
            console.log('Error catched: ' + error)
            error_in_plan = true
        })

        if (!error_in_plan) {
            let cur_agent = house.planning_agents[agent]
            // Check house belief and update vacuum belief 
            // Note that the room may become dirty while the agent is cleaning
            if (house.beliefs.check('dirty ' + room))
                cur_agent.beliefs.declare('dirty ' + room)
            
            if (house.beliefs.check('not filthy ' + room))
                cur_agent.beliefs.undeclare('filthy ' + room)
                house.filth_level.set('filth', house.filth_level.filth-1)
            // The action takes a certain time to be completed
            while(true) {
                Clock.global.notifyChange('mm')
                if (Clock.equalTimes(Clock.global, finish_time)) {
                    break
                }
                yield
            }    
        }
        else {
            console.log(cur_agent.name + ' in panic mode!')
            cur_agent.restart = true
        } 
    }
}

class CleanDirty extends pddlActionIntention {
    static parameters = ['agent','room'];
    static precondition = [['in-room', 'room', 'agent'], ['dirty','room'], ['not busy', 'room']];
    static effect = [['clean', 'room'],['not dirty', 'room']];
    *exec ({agent, room}=parameters) {

        let finish_time = Clock.sumTime(Clock.global, this.agent.device.time)
        var cur_agent = house.planning_agents[agent]
        var error_in_plan = false
        
        yield house.cleanDirty({
            agent: agent, 
            room: room
        })
        .catch((error) => {
            console.log('Error catched: ' + error)
            error_in_plan = true
        })

        if (!error_in_plan) {

            // Check house belief and update vacuum belief 
            // as above
            if (house.beliefs.check('clean ' + room)) 
                cur_agent.beliefs.declare('clean ' + room)
        
            if (house.beliefs.check('not dirty ' + room)) 
                cur_agent.beliefs.undeclare('dirty ' + room)
            
            house.filth_level.set('filth', house.filth_level.filth-1)
            // The action takes a certain time to be completed
            while(true) {
                Clock.global.notifyChange('mm')
                if (Clock.equalTimes(Clock.global, finish_time)) {
                    break
                }
                yield
            }
        }
        else {
            console.log(cur_agent.name + ' in panic mode!')
            cur_agent.restart = true  
        } 
        
    }
}

class Cleaner extends Agent {
    constructor(name, room_list, position, forbidden_if_occupied) {
        super(name)
        // Cleaning device
        this.device = new CleanerDevice(name, position)
        // Declaring position beliefs
        this.beliefs.declare('in-room ' + position + ' ' + name)
        house.beliefs.declare('in-room ' + position + ' ' + name)
        // House must have access to controlled agent for planning
        house.planning_agents[name] = this
        // Room priority is a list of rooms name, which specify which ones the cleaner is allowed to clean
        this.room_list = room_list
        // Used as an eco setting: if N is setted, the vacuum cleaner will clean only the first N dirty room in the room list
        this.max_rooms = 5
        // If the total filth value is more than this, the cleaner starts a cleaning routine
        this.filth_tolerated = 4
        // Flag to specify whether a plan had problems and needs an additional checks
        this.restart = 0
        // List of rooms which are not to be cleaned if occupied
        this.forbidden_if_occupied = forbidden_if_occupied
        this.intentions.push(TakeOrderIntention)
    }

    buildGoal() {
        let goal = []

        // Beliefs updating: current room status is transferred from the house to the vacuum cleaner
        for (let entry of house.beliefs.entries) {
            let pred = entry[0].split(' ')
            
            if ((pred[0] === 'clean') || (pred[0] === 'dirty') || (pred[0] === 'filthy')) {
                let value = entry[1]
                if (value)
                    this.beliefs.declare(entry[0])
                else
                    this.beliefs.undeclare(entry[0])
            } 
            if (pred[0] === 'accessible') {
                let room1 = pred[1]
                let room2 = pred[2]
                if (containsObject(room1, this.room_list) && containsObject(room2, this.room_list))
                    this.beliefs.declare(entry[0])
                
            }
        }

        // Build list of rooms to clean based on room priority
        for (let room of this.room_list) 
            if (this.beliefs.check('not clean ' + room)) {
                goal.push('clean ' + room)
                if (goal.length == this.max_rooms)
                    break
            }

        goal.push('in-room ' + this.device.start_position + ' ' + this.device.name)
        
        for (let room in house.rooms) {
            if (house.rooms[room].people_count > 2) {

                this.beliefs.declare('busy ' + room)
                house.beliefs.declare('busy ' + room)
            }
        }

        return goal
    }

    decideCleaning() {
        if(house.filth_level.filth > this.filth_tolerated) {
            console.log('Too much filth detected, started cleaning schedule')
            this.runCleaningSchedule()
        }
    }

    runCleaningSchedule() {
        
        // Can happen only if vacuum is not already going
        if (this.device.status == 'off') {

            let current_goal = this.buildGoal()
            
            if (current_goal.length == 1) {
                console.log(this.device.name + ' : there are no rooms to clean.')
                return
            }

            // Set device ona and start planning
            this.device.set('status','on')
            let {OnlinePlanning} = require('../../pddl/OnlinePlanner')([MoveTo, CleanDirty, CleanFilthy])
            this.intentions.push(OnlinePlanning)
            //console.log('a1 entries', this.beliefs.entries)
            //console.log('a1 literals', this.beliefs.literals)
            var return_goal = ['in-room ' + this.device.start_position + ' ' + this.device.name]
            this.postSubGoal( new PlanningGoal( { goal: current_goal }))
            // After goal completed, set to off
            .then((res) => {
                console.log('Plan finished, setting off')
                this.device.set('status','off')

                if (this.restart && (!this.beliefs.check(return_goal[0]))) {
                    this.restart = false
                    this.device.status = 'on'
                    this.postSubGoal( new PlanningGoal( { goal: return_goal}))
                    .then((res) => {
                        console.log('Plan finished, setting off:' + res)
                        this.device.set('status','off')
                    })
                }
                else {
                    this.restart = false
                    console.log('New plan not necessary')
                }
            }) 

        }
        else {
            console.log('Cleaner already on, not starting')
        }

    }
}

module.exports = Cleaner



