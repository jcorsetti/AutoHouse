const Door = require('../devices/Door')
const Light = require('../devices/Light')
const Room = require('../structure/Room')
const Agent = require('../../bdi/Agent')
const Goal = require('../../bdi/Goal')
const Clock = require('../../utils/Clock')
const Person = require('./Person')
const {FakeAction} = require('../../pddl/actions/pddlActionIntention')
const {DIRT_CHANCE} = require('../scenarios/constants.js')
const Observable = require('../../utils/Observable')
const {containsObject, removeObject} = require('../../utils/helpers')

const house = new Agent('house')
// List of registered people
house.people = {}
// List of rooms with names
house.rooms = {
    'kitchen' : new Room(house, 'kitchen'),
    'living_room' : new Room(house, 'living_room'),
    'garage' : new Room(house, 'garage'),
    'bathroom1' : new Room(house, 'bathroom1'),
    'backyard' : new Room(house, 'backyard'),
    'bedroom' : new Room(house, 'bedroom'),
    'bathroom2' : new Room(house, 'bathroom2'),
    'corridor' : new Room(house, 'corridor'),
    'study_room' : new Room(house, 'study_room')
}
// List of doors between rooms
house.adjacency_list =[
    ['kitchen','living_room'],
    ['kitchen','backyard'],
    ['living_room','bathroom1'],
    ['living_room','garage'],
    ['living_room','backyard'],
    ['kitchen','backyard'],
    ['living_room','corridor'],
    ['corridor','bedroom'],
    ['corridor','study_room'],
    ['corridor','bathroom2']
] 

// Set filth level
house.filth_level = new Observable()
house.filth_level.set('filth',0)
// Set initial devices
house.devices = {
    kitchen_light: new Light(house, 'kitchen'),
    backyard_light: new Light(house, 'backyard'),
    garage_light: new Light(house, 'garage'),
    living_room_light: new Light(house, 'living_room'),
    bedroom_light: new Light(house, 'bedroom'),
    bathroom1_light: new Light(house, 'bathroom1'),
    corridor_light: new Light(house, 'corridor'),
    study_room_light: new Light(house, 'study_room'),
    bathroom2_light: new Light(house, 'bathroom2'),
}

// Dictionary containing references to agents which must be accessible during planning
house.planning_agents = {}

// Planning action
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
for (let adj of house.adjacency_list) {
    // By default, each room is clean, not filthy, not dirty, not busy
    house.beliefs.declare('accessible ' + adj[0] + ' ' + adj[1])    
    house.beliefs.declare('accessible ' + adj[1] + ' ' + adj[0])
    house.beliefs.declare('clean ' + adj[0])
    house.beliefs.declare('clean ' + adj[1])
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
    console.log(house.rooms[room].name)
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
    // unRegistering people in list
    delete house.people[person.name]
    console.log('Person ' + person.name + ' has been removed from the house.')
}

// Build doors based on adjacency list
house.makeDoors = function(adjacency_list) {
    house.doors = []

    for (let adj of adjacency_list) {
        let room1 = adj[0]
        let room2 = adj[1]

        let name = room1 + '_' + room2
        let door = new Door(name, room1, room2)
        house.doors.push(door)
    }
}

// Opens a door if exists and agent is allowed to
house.openDoor = function(agent, room1, room2) {

    for (let door of house.doors) {

        if (((door.room1 == room1) && (door.room2 == room2)) || ((door.room2 == room1) && (door.room1 == room2))) {
            if (agent instanceof Person) {

                if (containsObject(agent.name, door.people_allowed)) {
                    if (door.status != 'open')
                        door.status = 'open'
                    return true
                }
                else 
                    console.log(agent.name + ' not authorized to open door ' + door.name)
            }
            else {
                if (agent instanceof Agent) {

                    if (containsObject(agent.name, door.device_allowed)) {
                        if (door.status != 'open')
                            door.status = 'open'
                        return true
                    }
                    else 
                        console.log(agent.name + ' not authorized to open door ' + door.name)
                }
            }
        }
    }
    return false
}

// Close a door (always allowed)
house.closeDoor = function(agent, room1, room2) {
    for (let door of house.doors) {
        if (((door.room1 == room1) && (door.room2 == room2)) || ((door.room2 == room1) && (door.room1 == room2))) {
            if (door.status != 'closed') {
                door.status = 'closed'
                return true
            }
        }
    }
    return false
}

house.makeDoors(house.adjacency_list)

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