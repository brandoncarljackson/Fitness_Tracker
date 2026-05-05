package com.brand.fitnesstracker.data.model

data class WorkoutSet(
    val weight: Double = 0.0,
    val reps: Int = 0
)

data class WorkoutExercise(
    val name: String,
    val sets: List<WorkoutSet> = emptyList()
)
