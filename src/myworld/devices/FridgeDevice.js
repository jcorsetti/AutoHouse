const Observable = require('../../utils/Observable');

class CleanerDevice extends Observable {
    constructor (name, capacity) {
        super()
        this.name = name            // non-observable
        this.set('status', 'on')   // observable
        this.consumption = 30       // constant
        this.capacity = capacity
        this.set('food', 7)                 // Current quantity of food
        this.set('food_order_level', 6)     // If food falls under this level, order it
        this.set('food_to_order', 3)        // Quantity of food to order
    }
}

module.exports = CleanerDevice