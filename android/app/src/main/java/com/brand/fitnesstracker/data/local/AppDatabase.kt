package com.brand.fitnesstracker.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.brand.fitnesstracker.data.model.Exercise
import com.brand.fitnesstracker.data.model.WorkoutSession

@Database(
    entities = [Exercise::class, WorkoutSession::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(WorkoutExerciseListConverter::class, WorkoutSetListConverter::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun exerciseDao(): ExerciseDao
    abstract fun workoutDao(): WorkoutDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "fitness_tracker.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
