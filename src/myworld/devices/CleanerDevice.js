const Observable = require('../../utils/Observable');

class CleanerDevice extends Observable {
    constructor (name, start_position) {
        super()
        this.name = name            // non-observable
        this.time = {dd:0,hh:0,mm:30} //Time of cycle
        this.movetime = {dd:0,hh:0,mm:15}
        this.set('status', 'off')   // observable
        this.set('max_rooms', 5)
        this.set('filth_tolerated', 4)
        this.consumption = 30       // constant
        this.start_position = start_position // room where there is the recharging station
    }
}

module.exports = CleanerDevice