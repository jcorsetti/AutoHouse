const Person = require('../structure/Person')
const Light = require('../devices/Light')
const Room = require('../structure/Room')
const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Clock = require('../../utils/Clock')
const {FakeAction} = require('../../pddl/actions/pddlActionIntention')
const {DIRT_CHANCE} = require('../scenarios/constants.js')
const Observable = require('../../utils/Observable')

const house = new Agent('house')
house.people = {}
house.rooms = {
    'kitchen' : new Room(house, 'kitchen', ['living_room','backyard']),
    'living_room' : new Room(house, 'living_room', ['garage','backyard','bathroom','kitchen','bedroom']),
    'garage' : new Room(house, 'garage', ['living_room']),
    'bathroom' : new Room(house, 'bathroom', ['living_room']),
    'backyard' : new Room(house, 'backyard', ['living_room','kitchen']),
    'bedroom' : new Room(house, 'bedroom', ['living_room'])
}

house.room_priority = ['kitchen','living_room','bathroom','bedroom','garage','backyard']
house.filth_level = new Observable()
house.filth_level.set('filth',0)
house.devices = {
    kitchen_light: new Light(house, 'kitchen'),
    garage_light: new Light(house, 'garage'),
    living_room_light: new Light(house, 'living_room'),
    bedroom_light: new Light(house, 'bedroom'),
    bathroom_light: new Light(house, 'bathroom')
}

// Dictionary containing references to agents which must be accessible during planning
house.planning_agents = {}

class MoveTo extends FakeAction {
    static parameters = ['agent', 'room1', 'room2']
    static precondition = [['accessible', 'room1', 'room2'], ['in-room', 'room1', 'agent']]
    static effect = [['in-room', 'room2','agent'], ['not in-room','room1','agent']]
}

class CleanFilthy extends FakeAction {
    static parameters = ['agent','room']
    static precondition = [['in-room', 'room', 'agent'], ['filthy','room'], ['not busy', 'room']]
    static effect = [['dirty', 'room'],['not filthy', 'room']]
}

class CleanDirty extends FakeAction {
    static parameters = ['agent','room']
    static precondition = [['in-room', 'room', 'agent'], ['dirty','room'], ['not busy', 'room']]
    static effect = [['clean', 'room'],['not dirty', 'room']]
}


// Define world actions
house.moveTo = function ({agent, room1, room2} = args) {
    return new MoveTo(house, new Goal({agent, room1, room2}) ).checkPreconditionAndApplyEffect()
    .catch(err=>{this.error('house.moveTo failed:', err.message || err); throw err;})

}

house.cleanFilthy = function ({agent,room} = args) {
    return new CleanFilthy(house, new Goal({agent, room}) ).checkPreconditionAndApplyEffect()
    .catch(err=>{this.error('house.cleanFilthy failed:', err.message || err); throw err;})
}
house.cleanDirty = function ({agent,room} = args) {
    return new CleanDirty(house, new Goal({agent, room}) ).checkPreconditionAndApplyEffect()
    .catch(err=>{this.error('house.cleanDirty failed:', err.message || err); throw err;})
}

// Initializing beliefs
for (let room_name in house.rooms) {
    // By default, each room is clean, not filthy, not dirty, not busy
    house.beliefs.declare('clean ' + room_name)
    for (let adj_room of house.rooms[room_name].doors_to) {
        house.beliefs.declare('accessible ' + room_name + ' ' + adj_room)
    }    
}

// given the fridge, removes a quantity of food depending on people present in the house
house.foodTime = function(fridge) {

    let total_food = 0
    for (let person in house.people)
        if (house.people[person].beliefs.in_house)
            total_food += 1
    fridge.serveFood(total_food)
}

// Register a person in the house. Unregistered people trigger the Overseer alarm
house.registerPerson = function(person, room) {
    // Update person references to house
    person.house = house
    person.beliefs.in_room = room
    person.beliefs.in_house = true
    // Update person position in house
    house.rooms[room].addPerson(person.name)
    // Registering people in list
    house.people[person.name] = person
    console.log('Person ' + person.name + ' registered in the house.')
}

// Remove a person from the house
house.removePerson = function(person_name) {
    let person = house.people[person_name]
    let old_room = person.in_room
    // Update person references to house
    person.house = undefined
    person.beliefs.in_room = undefined
    person.beliefs.in_house = false
    // Update person position in house
    if (old_room != undefined) {
        house.rooms[old_room].removePerson(person_name)
    }
    // Registering people in list
    delete house.people[person.name]
    console.log('Person ' + person.name + ' has been removed from the house.')
}

// Random dirt generation and tracking!
Clock.global.observe('hh', async () => {
            
    if (Math.random() <= DIRT_CHANCE) {
        let room_names = Object.keys(house.rooms)
        let room_index = Math.floor(Math.random() * (room_names.length - 1))
        let choosen_room = room_names[room_index]
        
        if (house.beliefs.check('clean ' + choosen_room)){
            console.log(choosen_room + ' became dirty!')
            house.filth_level.set('filth', house.filth_level.filth+1)
            house.beliefs.undeclare('clean ' + choosen_room)
            house.beliefs.declare('dirty ' + choosen_room)
        }
        else {
            if (house.beliefs.check('dirty ' + choosen_room)){
                console.log(choosen_room + ' became filthy!')
                house.filth_level.set('filth', house.filth_level.filth+1)
                house.beliefs.undeclare('dirty ' + choosen_room)
                house.beliefs.declare('filthy ' + choosen_room)
            }
        }
    }
})

module.exports = house