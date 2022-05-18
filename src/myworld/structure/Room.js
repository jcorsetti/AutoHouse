const Observable = require('../../utils/Observable');



class Room extends Observable {
    constructor (house, name, doors_to) {
        super()
        this.house = house;             // reference to the house
        this.name = name;               // non-observable
        this.set('people_count', 0);
        this.doors_to = doors_to;
    }
}

module.exports = Room