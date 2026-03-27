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

    val isPunchedIn: Boolean
        get() = prefs.getBoolean("is_punched_in", false)

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
}
