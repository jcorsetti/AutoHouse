const Observable = require('../../utils/Observable');

class CleanerDevice extends Observable {
    constructor (name, capacity) {
        super()
        this.name = name            // non-observable
        this.set('status', 'on')   // observable
        this.consumption = 30       // constant
        this.capacity = capacity
    }
}

module.exports = CleanerDevice