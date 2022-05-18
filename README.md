## Summary

This projects implements subpart of the scenario I proposed, and is focused in particular on the interaction between agents. The agents implemented are:

- Washing machine: manages washing machines internal attributes
- Fridge: takes care of food and can order it autonomously
- Manager: takes care of most of the house utilities. It will keep track of current energy consumption and expenses, and it is used as an interface to set other agents attributes
- Overseer: checks for the safety of the house. In this scenario, deals only with solar panels, by monitoring weather and deactivate them when it is dangerous
- Lighter: turns on and off the lights as people enter or exit the rooms

Also two people with different beaviour are included in the house.

## Code structure

The bdi folder is unchanged from the original implementation, the subfolder myworld contains all the new code and the one that has been modified from the previous implementation.

### devices

#### Light.js

Unchanged from previous implementation

#### LightSensor.js

Includes Goal and Intention for Lighter agent. In the goal are specified the room to control and the relative lights, which are supposed to have the same name as the room.

#### SolarPanel.js

Defines the SolarPanel device, which produces a fixed amount of electricity when is on. This is happens anytime is day (between 8.00 and 18.00) and the solar panels covers are off.

#### WashingDevice.js

Defines the attributes for the device, which are then accessed by a specific agents. This attributes include the energy consumption, the current load, and the running time for a single cleaning cycle.


### scenarios

#### constants.js

Defines some constant values, for example the energy cost per day/night, the food price per unit, and the probability of dangerous weather occurring.

#### scenario.js

The provided example scenario, in which all described agents and devices are used.


### structrure

#### Room.js

Describes a room in the house. Same as the original implementation, but an attribute counting people in the room has been added for convenience.

#### Person.js

Describes a person and the informations necessary to locate him/her in the house. Also provides methods for moving across rooms (moveTo) exit or enter the house (getOut, getIn), and simulating work behaviour (goToWork). This last methods has a random beahviour, as it will generate a random time in the specified interval, for which the person will be out of the house. When the time is up, the person is considered back.

### t1Agents

#### utils.js

Contains the implementations of the TakeOrder goal and intention. This Intention can be used by Tier1 agents to accepts orders (which are value settings in their own attributes) by Tier2 agents. The key and value of attributes are specified in the TakeOrderFoal argument. Only agent having the TakeOrderIntentions will accept orders.

#### Fridge.js

Contains the impleentation of the Fridge agent and the KeepStocked intentions and goals. This Intention will monitor the food quantity in the fridge, and will order more food when the quantity falls below a certain threshold. The quantity of food ordered is specified in the agents attributes as well as the threshold. This intention will also communicate the food order to the manager, by invoking a FoodNotificationGoal on it. This allows the manager to keep also track of the expenses due to food buying. Also includes a method which will serve food by removing the specified quantity of it. Being a Tier1 agent, it includes the TakeOrderIntention.


#### WashingDevice.js

Controls the washing machine device and manages the loading/unloading logic. The add_load and remove_loads methods will respectively add a single load and remove all loads present in the washing machine. By default, the washing machine accepts up to 4 loads. Add_load is successful when:
1. There are no more than 3 loads already inside
2. The machine is not running
3. The machine is not awaiting to be emptied

Remove_loads id successful when:
1. The machine is not running
2. The machine is waiting to be emptied

The file also contains the StartCycle goals and intentions, which simulates the starting of a washing cycle. This also depends on the eco_mode parameter: when on, the minimum loads to to start a cycle is 4, otherwise is 2. A cycle ca be started if:
1. The machine is not already running
2. The minimum number of loads by current settings is satisfied
3. The machine is not waiting to be unloaded

After starting, the function will wait for the time to be expired, and after that the cycle is considered completed. Note that the washing machine only consume electricity when the cycle is ongoing. Being a Tier1 agent, it includes the TakeOrderIntention.


### t2Agents

#### Manager.js

The most complex agent of the house. Is is tasked with keeping track of house utilities (electricity and expenses), so that it includes a reference to each energy-consuming (or energy-producing) device in the house. The observables watt_consumption, watt_gain, battery_status are updated at each tick (15 minutes interval) as the devices are switched on/off and as the conditions change. The Manager includes a setAgentAttribute goal which is used to set attributes of other agents, provided that they include the TakeOrderIntention. This method can be used, for example, to set the Washing Machine to eco-mode or to change the Fridge threshold at which more food as to be ordered. The description of Manager intentions follow:

- UpdateHistoryIntention
The manager mantains a complete history of watt consumption, watt bought and expenses through this Intention. It will print a summary of the last day statistic at the beginning of each day. Also, here the logic for buying,selling, and storing energy is implemented. For each time unit, if the net consumption is above 0, energy is drained from the battery. If it is not enough, it will be bought with a price depending on the time (DAY/NIGHT). On the other hand, if the net consumption is negative, the extra energy is stored in the battery. Once this is full, the surplus energy is sold at a fixed price. Regarding the history, the valued are:
- watt_consumption: total energy used, regardless of the source
- energy_bought: energy which has been bought during the day
- expenses: for food and electricity. A positive value means a cost, while a negative value (unlikely but possible) is a gain.

- MonitorElectricityIntention
This method keeps track of the changes in status of the tracked devices. When one of them is turned on or off, the respective consumption is added/subtracted to the current value.

- MonitorSolarPanelIntention
Very similar to the previous intention, but only the status of the SolarPanel is involved here. Note that this can change dinamically based on weather. The status is used to update the Manager current belief of gained energy.

-FoodNotificationIntention
Used by the Fridge to notify the Manager that some food has been bought. The Manager will use this information to update the state of expenses.

#### Overseer.js

The Overseer acts as a weather station, which at each ticks as a chance of perceiving dangerous weather. When this happend, the Overseer changes the SolarPanel attributes to close the protective covers, which also shuts it off. The duration of the dangerous weather is randomly specified in advance, and when the time is up the cover is removed from the SolarPanels.

### utils

#### Observable.js

Unchanged from original implementation

#### Clock.js

The clock class has not been changed, but some useful methods for performings operation with time (summing, checking equality, format to string) have been added.
