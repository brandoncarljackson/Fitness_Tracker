package com.brand.fitnesstracker.data.local

import androidx.room.TypeConverter
import com.brand.fitnesstracker.data.model.WorkoutExercise
import com.brand.fitnesstracker.data.model.WorkoutSet
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class WorkoutExerciseListConverter {
    private val gson = Gson()

    @TypeConverter
    fun fromJson(json: String): List<WorkoutExercise> {
        val type = object : TypeToken<List<WorkoutExercise>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    @TypeConverter
    fun toJson(list: List<WorkoutExercise>): String = gson.toJson(list)
}

class WorkoutSetListConverter {
    private val gson = Gson()

    @TypeConverter
    fun fromJson(json: String): List<WorkoutSet> {
        val type = object : TypeToken<List<WorkoutSet>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    @TypeConverter
    fun toJson(list: List<WorkoutSet>): String = gson.toJson(list)
}
