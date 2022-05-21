const Observable = require('../../utils/Observable');

class CleanerDevice extends Observable {
    constructor (name, start_position) {
        super()
        this.name = name            // non-observable
        this.set('status', 'off')   // observable
        this.consumption = 20       // constant
        this.start_position = start_position // room where there is the recharging station
    }
}

module.exports = CleanerDevice