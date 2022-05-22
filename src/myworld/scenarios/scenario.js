const Clock =  require('../../utils/Clock')
const Agent = require('../../bdi/Agent')
const {Fridge, KeepStockedGoal} = require('../t1Agents/Fridge')

const house = require('../structure/House')
const Cleaner = require('../t1Agents/Cleaner')
const SolarPanel = require('../devices/SolarPanel')
const {WashingMachine, StartCycleGoal} = require('../t1Agents/WashingMachine')
const {Manager, MonitorElectricityGoal, UpdateHistoryGoal, MonitorSolarPanelGoal} = require('../t2Agents/Manager')
const {PersonLighterIntention, PersonLighterGoal } = require('../devices/LightSensor')
const { Overseer, MonitorWeatherGoal } = require('../t2Agents/Overseer')

// Custom agent, turns on and off lights as people enter and exit rooms
var myAgent = new Agent('lighter')

// More comples agents and devices
var wm = new WashingMachine('wm_bathroom')
var solarPanels = new SolarPanel()
var cleaner = new Cleaner('vacuum', house.room_priority, 'bathroom')
var manager = new Manager('manager', [cleaner.device, wm.device, house.devices.kitchen_light, house.devices.garage_light, house.devices.living_room_light, house.devices.bedroom_light, house.devices.bathroom_light], solarPanels)
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
    [house.rooms.kitchen, house.rooms.garage, house.rooms.living_room, house.rooms.bedroom, house.rooms.bathroom],
    [house.devices.kitchen_light, house.devices.garage_light, house.devices.living_room_light, house.devices.bedroom_light, house.devices.bathroom_light]
))
  
// Initializing people counts and locations
house.rooms.bedroom.set('people_count',2)
house.people.bob.set('in_room','bedroom')
house.people.anna.set('in_room','bedroom')
//house.beliefs.declare('filthy backyard')
//house.beliefs.undeclare('clean backyard')

// Method for the manager to set lesser Agents attributes
manager.setAgentAttribute(wm, 'eco_mode', 'off')

//manager.beliefs.observe('watt_consumption', (status) => {console.log('WATT TO '+status)})
//manager.beliefs.observe('watt_gain', (status) => {console.log('GAINS TO '+status)})

// Simulated Daily/Weekly schedule
Clock.global.observe('mm', async (mm) => {
    var time = Clock.global
    if (time.hh==8 && time.mm==30) {
        house.people.bob.moveTo('living_room')
        house.people.anna.moveTo('living_room')
        // Going to work: anna always do, bob has a more random, flexible schedule
        house.people.anna.goToWork(7,8)
        
        if(Math.random > 0.5)
            bob.goToWork(3,9)
        else 
            console.log('Bob is working from home today')
        
    }
    if(time.hh==13 && time.mm==30) {
        house.people.anna.moveTo('kitchen')
        // moveTo does not throw error if the person is not in the house
        house.people.bob.moveTo('kitchen')
        house.people.anna.moveTo('kitchen')
        // lunch time
        house.foodTime(fridge)
    }
    if(time.hh==19 && time.mm==0) {
        house.people.bob.moveTo('living_room')
        cleaner.run_cleaning_schedule()
    }
    if(time.hh==19 && time.mm==30) {
        // Eventual loads are removed, new ones are loaded with some probability
        wm.remove_loads()
        if(Math.random > 0.1) 
            wm.add_load()
        // Cycle will only start when the agent settings allows it
        wm.postSubGoal(new StartCycleGoal())

        // dinner time
        house.foodTime(fridge)
    }
    if(time.hh==22 && time.mm==15) {
        house.people.bob.moveTo('bedroom')
        house.people.anna.moveTo('bedroom')

    }
})

// Start clock
Clock.startTimer()