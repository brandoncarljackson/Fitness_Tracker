package com.brand.fitnesstracker.data.remote

import com.google.gson.annotations.SerializedName

data class WgerExerciseInfoResponse(
    val count: Int,
    val next: String?,
    val results: List<WgerExerciseInfo>
)

data class WgerExerciseInfo(
    val id: Int,
    val name: String?,
    val category: WgerCategory?,
    val equipment: List<WgerEquipment>?,
    val translations: List<WgerTranslation>?
)

data class WgerCategory(
    val id: Int,
    val name: String
)

data class WgerEquipment(
    val id: Int,
    val name: String
)

data class WgerTranslation(
    val id: Int,
    val language: Int,
    val name: String,
    val description: String
)

data class WgerSearchResponse(
    val suggestions: List<WgerSearchSuggestion>?
)

data class WgerSearchSuggestion(
    val value: String,
    val data: WgerSearchData
)

data class WgerSearchData(
    val id: Int,
    @SerializedName("base_id") val baseId: Int
)
