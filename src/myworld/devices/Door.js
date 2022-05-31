const Observable = require('../../utils/Observable');

class Door extends Observable {
    constructor (name, room1, room2) {
        super()
        this.name = name            // non-observable
        this.set('status', 'closed')   // observable
        this.set('alarm', 0)
        this.room1 = room1 
        this.room2 = room2
        this.people_allowed = []
        this.device_allowed = []

    }
}

module.exports = Door