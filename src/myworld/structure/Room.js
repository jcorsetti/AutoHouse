const Observable = require('../../utils/Observable');



class Room extends Observable {
    constructor (house, name, doors_to) {
        super()
        this.house = house;             // reference to the house
        this.name = name;               // non-observable
        this.set('people_count', 0);
        this.people_list = []
        this.doors_to = doors_to;
    }

    // Helper method. Finds and remove the person from this room, without updating people count
    removePerson(person_name) {

        for (let i in this.people_list)
            if (this.people_list[i] == person_name)  {
                this.people_list.splice(i, 1)
                this.people_count -= 1
                break
            }
    }

    addPerson(person_name) {
        this.people_list.push(person_name)
        this.people_count += 1
    }


}

module.exports = Room