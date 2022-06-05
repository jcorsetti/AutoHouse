;; problem file: problem-vacuum_2.pddl
(define (problem vacuum_2)
    (:domain vacuum_2)
    (:objects bathroom2 vacuum_2 kitchen living_room backyard bathroom1 garage corridor bedroom study_room)
	(:init (in-room bathroom2 vacuum_2) (clean kitchen) (clean living_room) (clean bathroom1) (clean garage) (accessible corridor study_room) (accessible study_room corridor) (clean study_room) (accessible corridor bathroom2) (accessible bathroom2 corridor) (clean bathroom2) (dirty corridor) (filthy bedroom) (filthy backyard))
	(:goal (and (clean corridor) (in-room bathroom2 vacuum_2)))
)
