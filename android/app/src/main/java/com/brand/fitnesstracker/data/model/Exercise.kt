package com.brand.fitnesstracker.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "exercises")
data class Exercise(
    @PrimaryKey val id: String,
    val name: String,
    val category: String,
    val equipment: String,
    val instructions: String,
    val videoUrl: String,
    val lastUsed: Long = 0L
)
