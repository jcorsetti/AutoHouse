const Observable = require('../../utils/Observable');



class Light extends Observable {
    constructor (house, name) {
        super()
        this.house = house          // reference to the house
        this.name = name            // non-observable
        this.set('status', 'off')   // observable
        this.consumption = 20       // constant
    }

    switchOnLight (l) {
        if (this.status == 'off') {
            this.status = 'on'
            // Include some messages logged on the console!
            console.log(this.name + ' light turned on')
        }
    }

    switchOffLight (l) {
        if (this.status == 'on') {
            this.status = 'off'
            // Include some messages logged on the console!
            console.log(this.name + ' light turned off')
        }
    }
}

module.exports = Light