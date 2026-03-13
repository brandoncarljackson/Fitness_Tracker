package com.brand.fitnesstracker.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.brand.fitnesstracker.data.local.AppDatabase
import com.brand.fitnesstracker.data.model.Exercise
import com.brand.fitnesstracker.data.model.UserProfile
import com.brand.fitnesstracker.data.model.WorkoutExercise
import com.brand.fitnesstracker.data.model.WorkoutSession
import com.brand.fitnesstracker.data.model.WorkoutSet
import com.brand.fitnesstracker.data.remote.WgerApiService
import com.brand.fitnesstracker.data.repository.ExerciseRepository
import com.brand.fitnesstracker.data.repository.WorkoutRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class WorkoutViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    private val api = WgerApiService.create()
    private val exerciseRepo = ExerciseRepository(db.exerciseDao(), api)
    private val workoutRepo = WorkoutRepository(db.workoutDao(), application)

    // ── Exercise cache ────────────────────────────────────────────────────────

    val exercises: StateFlow<List<Exercise>> = exerciseRepo.allExercises.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        emptyList()
    )

    private val _isLoadingMore = MutableStateFlow(false)
    val isLoadingMore: StateFlow<Boolean> = _isLoadingMore.asStateFlow()

    private val _syncProgress = MutableStateFlow(0)
    val syncProgress: StateFlow<Int> = _syncProgress.asStateFlow()

    // ── Workout history ───────────────────────────────────────────────────────

    val workoutHistory: StateFlow<List<WorkoutSession>> = workoutRepo.allSessions.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        emptyList()
    )

    // ── User profile ──────────────────────────────────────────────────────────

    val userProfile: StateFlow<UserProfile> = workoutRepo.userProfile.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        UserProfile()
    )

    // ── Rest timer duration ───────────────────────────────────────────────────

    val restTimerDuration: StateFlow<Int> = workoutRepo.restTimerDuration.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        90
    )

    // ── Active workout state ──────────────────────────────────────────────────

    data class ActiveWorkout(
        val startTime: Long,
        val exercises: List<WorkoutExercise> = emptyList()
    )

    private val _activeWorkout = MutableStateFlow<ActiveWorkout?>(null)
    val activeWorkout: StateFlow<ActiveWorkout?> = _activeWorkout.asStateFlow()

    private val _timer = MutableStateFlow(0)
    val timer: StateFlow<Int> = _timer.asStateFlow()

    private var timerJob: Job? = null

    // ── Init ──────────────────────────────────────────────────────────────────

    init {
        viewModelScope.launch {
            if (exerciseRepo.count() < 50) {
                performDeepSync()
            }
        }
    }

    // ── Sync ──────────────────────────────────────────────────────────────────

    fun performDeepSync() {
        if (_isLoadingMore.value) return
        viewModelScope.launch {
            _isLoadingMore.value = true
            exerciseRepo.performDeepSync { progress ->
                _syncProgress.value = progress
            }
            _isLoadingMore.value = false
            _syncProgress.value = 0
        }
    }

    fun searchFromInternet(query: String) {
        if (_isLoadingMore.value || query.isBlank()) return
        viewModelScope.launch {
            _isLoadingMore.value = true
            exerciseRepo.searchFromInternet(query)
            _isLoadingMore.value = false
        }
    }

    // ── Workout control ───────────────────────────────────────────────────────

    fun startWorkout() {
        _activeWorkout.value = ActiveWorkout(startTime = System.currentTimeMillis())
        _timer.value = 0
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (isActive) {
                delay(1_000)
                _timer.update { it + 1 }
            }
        }
    }

    fun endWorkout() {
        val current = _activeWorkout.value ?: return
        timerJob?.cancel()
        timerJob = null
        val now = System.currentTimeMillis()
        val session = WorkoutSession(
            startTime = current.startTime,
            endTime = now,
            duration = _timer.value,
            exercises = current.exercises
        )
        viewModelScope.launch { workoutRepo.saveWorkoutSession(session) }
        _activeWorkout.value = null
        _timer.value = 0
    }

    fun addExerciseToWorkout(exercise: Exercise, sets: List<WorkoutSet>) {
        _activeWorkout.update { workout ->
            workout?.copy(
                exercises = workout.exercises + WorkoutExercise(
                    name = exercise.name,
                    sets = sets
                )
            )
        }
        viewModelScope.launch { exerciseRepo.markUsed(exercise.id) }
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    fun updateProfile(profile: UserProfile) {
        viewModelScope.launch { workoutRepo.saveProfile(profile) }
    }

    // ── Rest timer duration ───────────────────────────────────────────────────

    fun updateRestTimerDuration(seconds: Int) {
        val clamped = seconds.coerceIn(5, 600)
        viewModelScope.launch { workoutRepo.saveRestTimerDuration(clamped) }
    }
}
