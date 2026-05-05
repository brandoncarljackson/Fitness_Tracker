package com.brand.fitnesstracker.data.remote

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface WgerApiService {
    @GET("exerciseinfo/")
    suspend fun getExercises(
        @Query("language") language: Int = 2,
        @Query("limit") limit: Int = 100,
        @Query("offset") offset: Int = 0
    ): WgerExerciseInfoResponse

    @GET("exerciseinfo/{id}/")
    suspend fun getExerciseInfo(
        @Path("id") id: Int,
        @Query("language") language: Int = 2
    ): WgerExerciseInfo

    @GET("exercise/search/")
    suspend fun searchExercises(
        @Query("term") term: String,
        @Query("language") language: String = "english",
        @Query("format") format: String = "json"
    ): WgerSearchResponse

    companion object {
        private const val BASE_URL = "https://wger.de/api/v2/"

        fun create(): WgerApiService {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
                .build()
            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(WgerApiService::class.java)
        }
    }
}
