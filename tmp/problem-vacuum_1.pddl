;; problem file: problem-vacuum_1.pddl
(define (problem vacuum_1)
    (:domain vacuum_1)
    (:objects living_room vacuum_1 kitchen backyard bathroom1 garage corridor bedroom study_room bathroom2)
	(:init (in-room living_room vacuum_1) (accessible kitchen living_room) (accessible living_room kitchen) (clean kitchen) (clean living_room) (accessible kitchen backyard) (accessible backyard kitchen) (accessible living_room bathroom1) (accessible bathroom1 living_room) (clean bathroom1) (accessible living_room garage) (accessible garage living_room) (clean garage) (accessible living_room backyard) (accessible backyard living_room) (clean study_room) (clean bathroom2) (dirty corridor) (filthy bedroom) (filthy backyard))
	(:goal (and (clean backyard) (in-room living_room vacuum_1)))
)
