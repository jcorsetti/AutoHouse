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

            console.log(this.name + ' light turned on')
        }
    }

    switchOffLight (l) {
        if (this.status == 'on') {
            this.status = 'off'
            console.log(this.name + ' light turned off')
        }
    }
}

module.exports = Light