const Observable = require('../../utils/Observable');
const Clock = require('../../utils/Clock')


class Person extends Observable {
    constructor (house, name) {
        super()
        this.house = house;             // reference to the house
        this.name = name;               // non-observable
        this.set('in_room', undefined)  // observable
        this.set('in_house', true)

    }
    // Move a person to an adjacent room
    moveTo (to) {

        if (this.in_house)
            if ( this.house.rooms[this.in_room].doors_to.includes(to)) { // for object: to in this.house.rooms[this.in_room].doors_to
                this.house.rooms[this.in_room].people_count -= 1
                this.house.rooms[to].people_count += 1
                console.log(this.name, '\t moved from', this.in_room, 'to', to)
                this.in_room = to

                return true
            }
            else {
                console.log(this.name, '\t failed moving from', this.in_room, 'to', to)
                return false
            }
    }
    // Moves the person out of the house
    getOut () {
        if (this.in_house) {
            this.set('in_house',false) 
            this.house.rooms[this.in_room].people_count -= 1
            this.set('in_room',undefined)
            console.log(this.name + '\t got out of the house')
        }
    }
    
    // Moves the person in the house
    getIn () {
        if (!this.in_house) {
            this.set('in_house',true) 
            this.set('in_room','living_room')
            this.house.rooms['living_room'].people_count += 1
            console.log(this.name + '\t got in the house, welcome!')
        }
    }
    // Simultates working behaviour: the person leaves and come back after a while
    goToWork (minWorkHours, maxWorkHours) {
        // Generate worktime and return time
        let work_time = Clock.random_time(minWorkHours, maxWorkHours)
        let return_time = Clock.sumTime(Clock.global, work_time)
        this.getOut()

        //promise, resolves when return time is reached
        Clock.global.observe('mm', async () => {

            while(true) {
                await Clock.global.notifyChange('mm')
                let cur_time = Clock.global
                if (Clock.equalTimes(cur_time, return_time)) {
                    break
                }
            }
            //then this happens, the person is back home
            this.getIn()
        })

    }



}



module.exports = Person