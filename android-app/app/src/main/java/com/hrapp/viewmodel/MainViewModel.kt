package com.hrapp.viewmodel

import android.app.Application
import android.content.Context
import android.os.Build
import android.provider.Settings
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.hrapp.data.*
import kotlinx.coroutines.launch
import kotlin.math.*

sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val api = RetrofitClient.getInstance(app)
    private val prefs = app.getSharedPreferences("hr_prefs", Context.MODE_PRIVATE)

    private val _punchState = MutableLiveData<UiState<AttendanceLog>>()
    val punchState: LiveData<UiState<AttendanceLog>> = _punchState

    private val _logs = MutableLiveData<UiState<AttendanceResponse>>()
    val logs: LiveData<UiState<AttendanceResponse>> = _logs

    private val _campaigns = MutableLiveData<UiState<List<Campaign>>>()
    val campaigns: LiveData<UiState<List<Campaign>>> = _campaigns

    private val _payslipRequests = MutableLiveData<UiState<List<PayslipRequest>>>()
    val payslipRequests: LiveData<UiState<List<PayslipRequest>>> = _payslipRequests

    private val _payslipRequestState = MutableLiveData<UiState<PayslipRequest>>()
    val payslipRequestState: LiveData<UiState<PayslipRequest>> = _payslipRequestState

    val isPunchedIn: Boolean
        get() = prefs.getBoolean("is_punched_in", false)

    fun loadCampaigns() = viewModelScope.launch {
        _campaigns.value = UiState.Loading
        try {
            val res = api.getCampaigns()
            if (res.isSuccessful) _campaigns.value = UiState.Success(res.body() ?: emptyList())
            else _campaigns.value = UiState.Error("Failed to load campaigns")
        } catch (e: Exception) {
            _campaigns.value = UiState.Error(e.message ?: "Network error")
        }
    }

    fun punchIn(lat: Double, lng: Double) = viewModelScope.launch {
        _punchState.value = UiState.Loading
        try {
            val deviceInfo = DeviceInfo(
                deviceName = Build.MODEL,
                os = "Android ${Build.VERSION.RELEASE}",
                deviceId = Settings.Secure.getString(
                    getApplication<Application>().contentResolver,
                    Settings.Secure.ANDROID_ID
                )
            )
            val res = api.punchIn(PunchRequest(lat, lng, deviceInfo))
            if (res.isSuccessful) {
                prefs.edit().putBoolean("is_punched_in", true).apply()
                _punchState.value = UiState.Success(res.body()!!)
            } else {
                _punchState.value = UiState.Error(res.errorBody()?.string() ?: "Punch in failed")
            }
        } catch (e: Exception) {
            _punchState.value = UiState.Error(e.message ?: "Network error")
        }
    }

    fun punchOut(lat: Double, lng: Double) = viewModelScope.launch {
        _punchState.value = UiState.Loading
        try {
            val res = api.punchOut(PunchRequest(lat, lng))
            if (res.isSuccessful) {
                prefs.edit().putBoolean("is_punched_in", false).apply()
                _punchState.value = UiState.Success(res.body()!!)
            } else {
                _punchState.value = UiState.Error(res.errorBody()?.string() ?: "Punch out failed")
            }
        } catch (e: Exception) {
            _punchState.value = UiState.Error(e.message ?: "Network error")
        }
    }

    fun loadLogs() = viewModelScope.launch {
        _logs.value = UiState.Loading
        try {
            val res = api.getAttendance()
            if (res.isSuccessful) _logs.value = UiState.Success(res.body()!!)
            else _logs.value = UiState.Error("Failed to load logs")
        } catch (e: Exception) {
            _logs.value = UiState.Error(e.message ?: "Network error")
        }
    }

    fun loadPayslipRequests() = viewModelScope.launch {
        _payslipRequests.value = UiState.Loading
        try {
            val res = api.getPayslipRequests()
            if (res.isSuccessful) _payslipRequests.value = UiState.Success(res.body() ?: emptyList())
            else _payslipRequests.value = UiState.Error("Failed to load requests")
        } catch (e: Exception) {
            _payslipRequests.value = UiState.Error(e.message ?: "Network error")
        }
    }

    fun requestPayslip(month: String) = viewModelScope.launch {
        _payslipRequestState.value = UiState.Loading
        try {
            val res = api.requestPayslip(PayslipRequestBody(month))
            if (res.isSuccessful) {
                _payslipRequestState.value = UiState.Success(res.body()!!)
                loadPayslipRequests()
            } else {
                _payslipRequestState.value = UiState.Error(res.errorBody()?.string() ?: "Request failed")
            }
        } catch (e: Exception) {
            _payslipRequestState.value = UiState.Error(e.message ?: "Network error")
        }
    }

    // Returns distance in meters between two lat/lng points
    fun distanceMeters(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
        val r = 6371000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLng = Math.toRadians(lng2 - lng1)
        val a = sin(dLat / 2).pow(2) + cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLng / 2).pow(2)
        return r * 2 * atan2(sqrt(a), sqrt(1 - a))
    }
}
