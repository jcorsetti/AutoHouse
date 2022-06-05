;; domain file: domain-vacuum_1.pddl
(define (domain vacuum_1)
    (:requirements :strips :negative-preconditions)
    (:predicates
        (accessible ?room1 ?room2)
        (in-room ?room1 ?agent)
        (busy ?room2)
        (dirty ?room)
        (clean ?room)
        (filthy ?room)              
    )
    
        (:action MoveTo
            :parameters (?agent ?room1 ?room2)
            :precondition (and
                (accessible ?room1 ?room2)
                (in-room ?room1 ?agent)
                (not (busy ?room2))
            )
            :effect (and
                (in-room ?room2 ?agent)
                (not (in-room ?room1 ?agent))
            )
        )
        
        (:action CleanDirty
            :parameters (?agent ?room)
            :precondition (and
                (in-room ?room ?agent)
                (dirty ?room)
                (not (busy ?room))
            )
            :effect (and
                (clean ?room)
                (not (dirty ?room))
            )
        )
        
        (:action CleanFilthy
            :parameters (?agent ?room)
            :precondition (and
                (in-room ?room ?agent)
                (filthy ?room)
                (not (busy ?room))
            )
            :effect (and
                (dirty ?room)
                (not (filthy ?room))
            )
        )
)