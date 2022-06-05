const Clock =  require('../../utils/Clock')
const Agent = require('../../bdi/Agent')
const {Fridge, KeepStockedGoal} = require('../t1Agents/Fridge')

const house = require('../structure/House')
const Cleaner = require('../t1Agents/Cleaner')
const SolarPanel = require('../devices/SolarPanel')
const {WashingMachine} = require('../t1Agents/WashingMachine')
const {Manager, MonitorElectricityGoal, UpdateHistoryGoal, MonitorSolarPanelGoal} = require('../t2Agents/Manager')
const {PersonLighterIntention, PersonLighterGoal} = require('../devices/LightSensor')
const {Overseer, MonitorWeatherGoal} = require('../t2Agents/Overseer')
const Person = require('../structure/Person')

// Custom agent, turns on and off lights as people enter and exit rooms
var myAgent = new Agent('lighter')

// More comples agents and devices
var washingMachine = new WashingMachine('wm_bathroom')
var solarPanels = new SolarPanel()
var dishwasher = new WashingMachine('wm_kitchen')
var overseer = new Overseer('overseer', house, solarPanels)
var cleaner1 = new Cleaner('vacuum_1', ['kitchen','living_room','bathroom1','garage','backyard'], 'living_room', overseer)
var cleaner2 = new Cleaner('vacuum_2', ['corridor', 'study_room', 'bathroom2'], 'bathroom2', overseer)
var manager = new Manager('manager', house, 
    [
        cleaner1.device,
        cleaner2.device, 
        washingMachine.device, 
        dishwasher.device,
        house.devices.kitchen_light,
        house.devices.backyard_light, 
        house.devices.garage_light, 
        house.devices.living_room_light, 
        house.devices.bedroom_light, 
        house.devices.bathroom1_light,
        house.devices.corridor_light,
        house.devices.study_room_light,
        house.devices.bathroom2_light,
    ], solarPanels
)

var fridge = new Fridge('fridge', manager)
manager.addDevice(fridge.device)

// Pushing intentions and passive goals
myAgent.intentions.push(PersonLighterIntention)
fridge.postSubGoal(new KeepStockedGoal())
manager.postSubGoal(new MonitorElectricityGoal())
manager.postSubGoal(new UpdateHistoryGoal())
manager.postSubGoal(new MonitorSolarPanelGoal())
overseer.postSubGoal(new MonitorWeatherGoal())

// List of rooms and relative lights for the agent to check

myAgent.postSubGoal(new PersonLighterGoal(
    [house.rooms.kitchen, house.rooms.garage, house.rooms.living_room, house.rooms.bedroom, house.rooms.bathroom1],
    [   house.devices.kitchen_light,
        house.devices.backyard_light, 
        house.devices.garage_light, 
        house.devices.living_room_light, 
        house.devices.bedroom_light, 
        house.devices.bathroom1_light,
        house.devices.corridor_light,
        house.devices.study_room_light,
        house.devices.bathroom2_light]
))
  
bob = new Person('bob')
anna = new Person('anna')
house.registerPerson(bob, 'bedroom')
house.registerPerson(anna, 'bathroom1')

overseer.authAgentAllDoors(house, anna)
overseer.authAgentAllDoors(house, bob)
overseer.authAgentAllDoors(house, overseer)
// Method for the manager to set lesser Agents attributes
manager.setAgentAttribute(washingMachine, 'eco_mode', 'off')

// Simulated Daily/Weekly schedule
Clock.global.observe('mm', async (mm) => {
    var time = Clock.global
    if (time.hh==8 && time.mm==30) {
        bob.moveTo('living_room')
        anna.moveTo('living_room')
        
        // Going to work: anna always do, bob has a more random, flexible schedule
        
        anna.goToWork(7,8)
        if(Math.random() > 0.5)
            house.people.bob.goToWork(3,9)
        else {
            bob.moveTo('corridor')
            bob.moveTo('study_room')
            console.log('Bob is working from home today')
        }
        cleaner1.decideCleaning()
        cleaner2.decideCleaning()
    }
    if(time.hh==13 && time.mm==30) {
        // moveTo does not throw error if the person is not in the house
        bob.moveTo('corridor')
        bob.moveTo('living_room')
        bob.moveTo('kitchen')
        anna.moveTo('kitchen')
        // lunch time
        house.foodTime(fridge)
    }
    if(time.hh==19 && time.mm==0) {
        bob.moveTo('living_room')

    }
    if(time.hh==19 && time.mm==30) {
        // Eventual loads are removed, new ones are loaded with some probability
        washingMachine.removeLoads()
        //if(Math.random > 0.1) 
        washingMachine.addLoad()
            // Cycle will only start when the agent settings allows it
        washingMachine.startCycle()
        
        // dinner time
        house.foodTime(fridge)
        anna.moveTo('living_room')
        }
        if(time.dd==1 && time.hh==22 && time.mm==0) {
            bob.moveTo('living_room')
            
            // Example of an unknown person appearing in the house
            ghost = new Person('ghost')
            ghost.beliefs.in_room = 'living_room'
            house.rooms.living_room.people_list.push('ghost')
            bob.moveTo('bathroom1')
    }
    if(time.hh==22 && time.mm==15) {
        //bob.moveTo('bedroom')
        anna.moveTo('corridor')
        anna.moveTo('bedroom')
        

    }
    if(time.hh==23 && time.mm==45) {
        // At night, the overseer closes all doors and performs a scan for unknown people
        overseer.performSecurityScan()
        overseer.closeAllDoors()
        
    }
})

// Start clock
Clock.startTimer()