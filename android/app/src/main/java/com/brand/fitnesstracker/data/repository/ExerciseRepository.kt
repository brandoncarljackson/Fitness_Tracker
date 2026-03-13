package com.brand.fitnesstracker.data.repository

import android.util.Log
import com.brand.fitnesstracker.data.local.ExerciseDao
import com.brand.fitnesstracker.data.model.Exercise
import com.brand.fitnesstracker.data.remote.WgerApiService
import com.brand.fitnesstracker.data.remote.WgerExerciseInfo
import kotlinx.coroutines.flow.Flow

private const val TAG = "ExerciseRepo"
private const val SAMPLE_VIDEO_URL =
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
private const val ENGLISH_LANGUAGE_ID = 2
private const val SYNC_BATCH_SIZE = 100
private const val SYNC_TOTAL_LIMIT = 1000

class ExerciseRepository(
    private val exerciseDao: ExerciseDao,
    private val api: WgerApiService
) {
    val allExercises: Flow<List<Exercise>> = exerciseDao.getAllExercises()

    fun searchExercises(query: String): Flow<List<Exercise>> =
        if (query.isBlank()) exerciseDao.getAllExercises()
        else exerciseDao.searchExercises(query)

    suspend fun count(): Int = exerciseDao.count()

    suspend fun markUsed(exerciseId: String) {
        exerciseDao.updateLastUsed(exerciseId, System.currentTimeMillis())
    }

    /** Full sync from wger.de — fetches up to [SYNC_TOTAL_LIMIT] English exercises in batches. */
    suspend fun performDeepSync(onProgress: (Int) -> Unit = {}) {
        var total = 0
        try {
            for (offset in 0 until SYNC_TOTAL_LIMIT step SYNC_BATCH_SIZE) {
                val response = api.getExercises(
                    language = ENGLISH_LANGUAGE_ID,
                    limit = SYNC_BATCH_SIZE,
                    offset = offset
                )
                val exercises = response.results.map { it.toExercise() }
                exerciseDao.insertAll(exercises)
                total += exercises.size
                onProgress((total.toFloat() / SYNC_TOTAL_LIMIT * 100).toInt())
                if (response.next == null) break
            }
        } catch (e: Exception) {
            Log.e(TAG, "Deep sync failed", e)
        }
    }

    /** Internet search — finds exercises matching [query] via wger search API. */
    suspend fun searchFromInternet(query: String): List<Exercise> {
        if (query.isBlank()) return emptyList()
        return try {
            val searchResult = api.searchExercises(query)
            val suggestions = searchResult.suggestions?.take(10) ?: return emptyList()
            suggestions.mapNotNull { suggestion ->
                try {
                    api.getExerciseInfo(suggestion.data.baseId).toExercise()
                        .also { exerciseDao.insert(it) }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to fetch exercise ${suggestion.data.baseId}", e)
                    null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Internet search failed", e)
            emptyList()
        }
    }

    private fun WgerExerciseInfo.toExercise(): Exercise {
        val english = translations?.find { it.language == ENGLISH_LANGUAGE_ID }
        val resolvedName = english?.name?.takeIf { it.isNotBlank() }
            ?: name?.takeIf { it.isNotBlank() }
            ?: "Unknown Exercise"
        val rawDescription = english?.description ?: ""
        val instructions = rawDescription
            .replace(Regex("<[^>]+>"), " ")
            .replace(Regex("&[a-zA-Z]+;"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
            .ifBlank { "No instructions available." }

        return Exercise(
            id = id.toString(),
            name = resolvedName,
            category = category?.name ?: "General",
            equipment = equipment?.firstOrNull()?.name ?: "No equipment",
            instructions = instructions,
            videoUrl = SAMPLE_VIDEO_URL
        )
    }
}
