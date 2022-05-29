const Observable =  require('./Observable')



/**
 * @static {global} is the global time
 * @static {startTimer()} method start the timer loop
 * 
 * Note that mm, hh, and dd are updated one at a time!
 * However, Observable handle observer callbacks in microtask queues, so that,
 * at the time observers are actually called, both mm, hh, and dd should all been up-to-date!
 */
class Clock {

    /** @type {Observable} {dd, hh, mm} */
    static global = new Observable( {dd: 0, hh: 0, mm: 0} )

    static format() {
        var time = Clock.global
        return '' + time.dd + ':' + (time.hh<10?'0':'')+time.hh + ':' + (time.mm==0?'00':time.mm)
    }

    static #start = true

    static async stopTimer() {
        Clock.#start = false
    }

    static async startTimer() {

        Clock.#start = true

        while(Clock.#start) {
            await new Promise( res => setTimeout(res, 50))
            
            var {dd, hh, mm} = Clock.global
            
            if(mm<60-15)
                Clock.global.mm += 15
            else {
                if(hh<24) {
                    Clock.global.hh += 1 // increased hh but mm still 45
                    Clock.global.mm = 0 // however, observers are handled as microtask so at the time they are called everything will be sync
                }
                else {
                    Clock.global.mm = 0
                    Clock.global.hh = 0
                    Clock.global.dd += 1
                }
            }
            
            // Here, time is logged immediately before any other observable gets updated!
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write( Clock.format() + '\t');
        }
    }

    // Sum two times and get the final time
    static sumTime(time1, time2) {
    
        
        let dd = time1.dd
        let hh = time1.hh
        let mm = time1.mm
    
        let dd_int = time2.dd
        let hh_int = time2.hh
        let mm_int = time2.mm
    
        let final_mm = (mm_int + mm) % 60 // Minutes in modulo 60
        let extra_hh = Math.floor((mm_int + mm) / 60)
        let final_hh = (hh_int + hh + extra_hh) % 24 // hours in modulo 24
    
        let extra_dd = Math.floor((hh_int + hh + extra_hh) / 24)
        let final_dd = dd_int + dd + extra_dd
    
        return({'dd' : final_dd, 'hh' : final_hh, 'mm': final_mm})
    }
    
    // Checks time equality
    static equalTimes(time1, time2) {
    
        let eq_d = (time1.dd == time2.dd)
        let eq_h = (time1.hh == time2.hh)
        let eq_m = (time1.mm == time2.mm)
    
        return (eq_d && eq_h && eq_m)
    }
    
    // True if time1 is before time2, false otherwise
    static before(time1, time2) {
        
        if (time1.dd < time2.dd)
            return true
        if (time1.dd > time2.dd)
            return false
        if (time1.hh < time2.hh)
            return true
        if (time1.hh > time2.hh)
            return false
        if (time1.mm < time2.mm)
            return true
        if (time1.mm > time2.mm)
            return false
        
        return false
    }
    
    // Format a time to string
    static timeToString(time) {
        return '[Day '+ time.dd + ' | '+time.hh+':'+time.mm+']'
    }

    // Day is defined as between 08:00 and 18:00
    static isDay(time) {
        return ((time.hh >= 8) && (time.hh < 18))
    }

    // Generate a random interval of time
    static randomTime(min_h, max_h) {
        let hh = Math.floor(Math.random() * (max_h - min_h)) + min_h
        let mm = Math.floor(Math.random() * 3) * 15

        return ({'dd' : 0, 'hh' : hh, 'mm' : mm})
        
    }
    

}



module.exports = Clock