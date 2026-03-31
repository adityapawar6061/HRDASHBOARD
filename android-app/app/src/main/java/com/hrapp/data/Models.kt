package com.hrapp.data

data class LoginRequest(val email: String, val password: String)

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String
)

data class LoginResponse(val token: String?, val user: User?)

data class DeviceInfo(
    val deviceName: String,
    val os: String,
    val deviceId: String
)

data class PunchRequest(
    val latitude: Double,
    val longitude: Double,
    val device_info: DeviceInfo? = null
)

data class AttendanceLog(
    val id: String,
    val user_id: String,
    val punch_in_time: String,
    val punch_out_time: String?,
    val punch_in_lat: Double?,
    val punch_in_lng: Double?,
    val punch_out_lat: Double?,
    val punch_out_lng: Double?
)

data class AttendanceResponse(
    val logs: List<AttendanceLog>,
    val total: Int,
    val page: Int
)

data class Campaign(
    val id: String,
    val name: String,
    val description: String?,
    val location_lat: Double?,
    val location_lng: Double?,
    val location_radius_meters: Int?
)

data class CampaignAssignment(
    val campaign_id: String,
    val campaigns: Campaign?
)

data class PayslipRequest(
    val id: String,
    val user_id: String,
    val month: String,
    val status: String,
    val requested_at: String
)

data class PayslipRequestBody(val month: String)
