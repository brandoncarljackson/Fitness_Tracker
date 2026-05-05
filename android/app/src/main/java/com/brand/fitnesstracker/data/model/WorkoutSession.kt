package com.brand.fitnesstracker.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.brand.fitnesstracker.data.local.WorkoutExerciseListConverter

@Entity(tableName = "workout_sessions")
@TypeConverters(WorkoutExerciseListConverter::class)
data class WorkoutSession(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val startTime: Long,
    val endTime: Long,
    val duration: Int,
    val exercises: List<WorkoutExercise> = emptyList()
)
