const Clock =  require('../../utils/Clock')
const Agent = require('../../bdi/Agent')
const Person = require('../structure/Person')
const Light = require('../devices/Light')
const Room = require('../structure/Room')
const {Fridge, KeepStockedGoal} = require('../t1Agents/Fridge')

const SolarPanel = require('../devices/SolarPanel')
const {WashingMachine, StartCycleGoal} = require('../t1Agents/WashingMachine')
const {Manager, MonitorElectricityGoal, UpdateHistoryGoal, MonitorSolarPanelGoal} = require('../t2Agents/Manager')
const {PersonLighterIntention, PersonLighterGoal } = require('../devices/LightSensor')
const { Overseer, MonitorWeatherGoal } = require('../t2Agents/Overseer')

class House {
    constructor () {
        this.people = { bob: new Person(this, 'Bob'), anna: new Person(this, 'Anna') }
        this.rooms = {
            'kitchen' : new Room(this, 'kitchen', ['living_room','backyard']),
            'living_room' : new Room(this, 'living_room', ['garage','backyard','bathroom','kitchen','bedroom']),
            'garage' : new Room(this, 'garage', ['living_room']),
            'bathroom' : new Room(this, 'bathroom', ['living_room']),
            'backyard' : new Room(this, 'backyard', ['living_room','kitchen']),
            'bedroom' : new Room(this, 'bedroom', ['living_room'])

        }
        this.devices = {
            kitchen_light: new Light(this, 'kitchen'),
            garage_light: new Light(this, 'garage'),
            living_room_light: new Light(this, 'living_room'),
            bedroom_light: new Light(this, 'bedroom'),
            bathroom_light: new Light(this, 'bathroom')
        }
    }

    // given the fridge, removes a quantity of food depending on people present in the house
    foodTime(fridge) {

        let total_food = 0
        for (let person in this.people)
            if (this.people[person].in_house)
                total_food += 1
        fridge.serveFood(total_food)
    }

}


var myHouse = new House()
// Custom agent, turns on and off lights as people enter and exit rooms
var myAgent = new Agent('lighter')


// More comples agents and devices
var wm = new WashingMachine('wm_bathroom')
var solarPanels = new SolarPanel()
var manager = new Manager('manager', [wm.device, myHouse.devices.kitchen_light, myHouse.devices.garage_light, myHouse.devices.living_room_light, myHouse.devices.bedroom_light, myHouse.devices.bathroom_light], solarPanels)
var overseer = new Overseer('overseer', solarPanels)
var fridge = new Fridge('fridge', manager)


// Pushing intentions and passive goals
myAgent.intentions.push(PersonLighterIntention)
fridge.postSubGoal(new KeepStockedGoal())
manager.postSubGoal(new MonitorElectricityGoal())
manager.postSubGoal(new UpdateHistoryGoal())
manager.postSubGoal(new MonitorSolarPanelGoal())
overseer.postSubGoal(new MonitorWeatherGoal())

// List of rooms and relative lights for the agent to check

myAgent.postSubGoal(new PersonLighterGoal(
    [myHouse.rooms.kitchen, myHouse.rooms.garage, myHouse.rooms.living_room, myHouse.rooms.bedroom, myHouse.rooms.bathroom],
    [myHouse.devices.kitchen_light, myHouse.devices.garage_light, myHouse.devices.living_room_light, myHouse.devices.bedroom_light, myHouse.devices.bathroom_light]
))
  
// Initializing people counts and locations
myHouse.rooms.bedroom.set('people_count',2)
myHouse.people.bob.set('in_room','bedroom')
myHouse.people.anna.set('in_room','bedroom')

// Method for the manager to set lesser Agents attributes
manager.setAgentAttribute(wm, 'eco_mode', 'off')

//manager.beliefs.observe('watt_consumption', (status) => {console.log('WATT TO '+status)})
//manager.beliefs.observe('watt_gain', (status) => {console.log('GAINS TO '+status)})

// Simulated Daily/Weekly schedule
Clock.global.observe('mm', async (mm) => {
    var time = Clock.global
    if (time.hh==8 && time.mm==30) {
        myHouse.people.bob.moveTo('living_room')
        myHouse.people.anna.moveTo('living_room')
        // Going to work: anna always do, bob has a more random, flexible schedule
        myHouse.people.anna.goToWork(7,8)
        
        if(Math.random > 0.5)
            bob.goToWork(3,9)
        else 
            console.log('Bob is working from home today')
        
    }
    if(time.hh==13 && time.mm==30) {
        myHouse.people.anna.moveTo('kitchen')
        // moveTo does not throw error if the person is not in the house
        myHouse.people.bob.moveTo('kitchen')
        myHouse.people.anna.moveTo('kitchen')
        // lunch time
        myHouse.foodTime(fridge)
    }
    if(time.hh==19 && time.mm==0) {
        myHouse.people.bob.moveTo('living_room')

    }
    if(time.hh==19 && time.mm==30) {
        // Eventual loads are removed, new ones are loaded with some probability
        wm.remove_loads()
        if(Math.random > 0.1) 
            wm.add_load()
        // Cycle will only start when the agent settings allows it
        wm.postSubGoal(new StartCycleGoal())

        // dinner time
        myHouse.foodTime(fridge)
    }
    if(time.hh==22 && time.mm==15) {
        myHouse.people.bob.moveTo('bedroom')
        myHouse.people.anna.moveTo('bedroom')

    }
})

// Start clock
Clock.startTimer()