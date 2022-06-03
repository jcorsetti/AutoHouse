const Observable = require('../../utils/Observable');

class Door extends Observable {
    constructor (name, room1, room2) {
        super()
        this.name = name            // non-observable
        this.set('status', 'closed')   // observable
        // A door is uniquely defined as the two rooms it connect. This implementation does not support more doors between two rooms
        this.room1 = room1 
        this.room2 = room2
        // List of people and devices (non-People Agents) allowd to open this door
        this.people_allowed = []
        this.device_allowed = []

    }
}

module.exports = Door