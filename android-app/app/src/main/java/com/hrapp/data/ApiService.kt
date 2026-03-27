package com.hrapp.data

import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("auth/me")
    suspend fun getMe(): Response<User>

    @POST("attendance/punch-in")
    suspend fun punchIn(@Body request: PunchRequest): Response<AttendanceLog>

    @POST("attendance/punch-out")
    suspend fun punchOut(@Body request: PunchRequest): Response<AttendanceLog>

    @GET("attendance")
    suspend fun getAttendance(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<AttendanceResponse>
}
