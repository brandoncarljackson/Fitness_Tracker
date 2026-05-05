package com.brand.fitnesstracker.data.repository

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.brand.fitnesstracker.data.local.WorkoutDao
import com.brand.fitnesstracker.data.model.UserProfile
import com.brand.fitnesstracker.data.model.WorkoutSession
import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "user_prefs")

class WorkoutRepository(
    private val workoutDao: WorkoutDao,
    private val context: Context
) {
    private val gson = Gson()

    val allSessions: Flow<List<WorkoutSession>> = workoutDao.getAllSessions()

    // ── User Profile ─────────────────────────────────────────────────────────

    private val KEY_PROFILE = stringPreferencesKey("user_profile")

    val userProfile: Flow<UserProfile> = context.dataStore.data.map { prefs ->
        val json = prefs[KEY_PROFILE]
        if (json != null) gson.fromJson(json, UserProfile::class.java) else UserProfile()
    }

    suspend fun saveProfile(profile: UserProfile) {
        context.dataStore.edit { prefs ->
            prefs[KEY_PROFILE] = gson.toJson(profile)
        }
    }

    // ── Rest Timer Duration ───────────────────────────────────────────────────

    private val KEY_REST_DURATION = stringPreferencesKey("rest_duration")

    val restTimerDuration: Flow<Int> = context.dataStore.data.map { prefs ->
        prefs[KEY_REST_DURATION]?.toIntOrNull() ?: 90
    }

    suspend fun saveRestTimerDuration(seconds: Int) {
        context.dataStore.edit { prefs ->
            prefs[KEY_REST_DURATION] = seconds.toString()
        }
    }

    // ── Workout Sessions ──────────────────────────────────────────────────────

    suspend fun saveWorkoutSession(session: WorkoutSession) {
        workoutDao.insert(session)
    }
}
