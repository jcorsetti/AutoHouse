const Clock =  require('../../utils/Clock')
const Agent = require('../../bdi/Agent')
const house = require('../structure/House')
const Cleaner = require('../t1Agents/Cleaner')
const SolarPanel = require('../devices/SolarPanel')
const {Manager, MonitorElectricityGoal, UpdateHistoryGoal, MonitorSolarPanelGoal} = require('../t2Agents/Manager')
const {PersonLighterIntention} = require('../devices/LightSensor')
const {Overseer, MonitorWeatherGoal} = require('../t2Agents/Overseer')
const Person = require('../structure/Person')

// Custom agent, turns on and off lights as people enter and exit rooms
var myAgent = new Agent('lighter')

// Smaller implementation of house with only 3 rooms
var solarPanels = new SolarPanel()
var overseer = new Overseer('overseer', house, solarPanels)
var cleaner1 = new Cleaner('vacuum_1', ['kitchen','living_room','bathroom1'], 'living_room', overseer)
var manager = new Manager('manager', house, 
    [
        cleaner1.device,
        house.devices.kitchen_light,
        house.devices.living_room_light, 
        house.devices.bathroom1_light,
    ], solarPanels
)

// Pushing intentions and passive goals
myAgent.intentions.push(PersonLighterIntention)
manager.postSubGoal(new MonitorElectricityGoal())
manager.postSubGoal(new UpdateHistoryGoal())
manager.postSubGoal(new MonitorSolarPanelGoal())
overseer.postSubGoal(new MonitorWeatherGoal())
  
// Bob always in bathroom1
bob = new Person('bob')
house.registerPerson(bob, 'bathroom1')

overseer.authAgentAllDoors(house, bob)
overseer.authAgentAllDoors(house, overseer)
// Method for the manager to set lesser Agents attributes
manager.setAgentAttribute(cleaner1, 'filth_tolerated', 2)

// Simulated Daily/Weekly schedule
Clock.global.observe('mm', async (mm) => {
    var time = Clock.global
    if (time.hh==8 && time.mm==30) {
       
    }
    if(time.hh==13 && time.mm==30) {
        // Because bathroom1 is forbidden if occupied, the cleaner will never have access to it (provided bob does not forget the door open)
        cleaner1.decideCleaning()

    }
})

// Start clock
Clock.startTimer()