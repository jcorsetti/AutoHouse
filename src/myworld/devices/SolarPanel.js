const Clock = require('../../utils/Clock');
const Observable = require('../../utils/Observable');

class SolarPanel extends Observable {

    constructor() {
        super()
        this.production = 50 // Electricity produced per time unit when on
        this.set('status','off') // Producing electricty or not
        this.set('cover','off') // Cover protecting from dangerous weather, setted by overseer
        
        // Solar panels are active between 8 and 18
        Clock.global.observe('hh', async () => {
            var time = Clock.global
            // Cover is set on by the overseer when dangerous weather is detected
            if (this.cover == 'off') {
                if (Clock.isDay(time)) { 
                    this.status = 'on'
                }
                else { 
                    this.status = 'off'
                }
            }
        })
        
    }

}

module.exports = SolarPanel