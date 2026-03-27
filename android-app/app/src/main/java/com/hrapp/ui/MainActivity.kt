package com.hrapp.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.gms.location.LocationServices
import com.hrapp.databinding.ActivityMainBinding
import com.hrapp.viewmodel.MainViewModel
import com.hrapp.viewmodel.UiState

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val viewModel: MainViewModel by viewModels()
    private val fusedLocationClient by lazy { LocationServices.getFusedLocationProviderClient(this) }

    private val locationPermission = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { perms ->
        if (perms[Manifest.permission.ACCESS_FINE_LOCATION] == true) {
            performPunch()
        } else {
            Toast.makeText(this, "Location permission required", Toast.LENGTH_SHORT).show()
        }
    }

    private var pendingPunchIn = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val prefs = getSharedPreferences("hr_prefs", Context.MODE_PRIVATE)
        binding.tvWelcome.text = "Hello, ${prefs.getString("user_name", "Employee")}"

        updatePunchButton()

        binding.btnPunch.setOnClickListener {
            pendingPunchIn = !viewModel.isPunchedIn
            checkLocationAndPunch()
        }

        binding.btnLogout.setOnClickListener {
            prefs.edit().clear().apply()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }

        binding.rvAttendance.layoutManager = LinearLayoutManager(this)

        viewModel.punchState.observe(this) { state ->
            when (state) {
                is UiState.Loading -> binding.progressBar.visibility = View.VISIBLE
                is UiState.Success -> {
                    binding.progressBar.visibility = View.GONE
                    updatePunchButton()
                    Toast.makeText(this, if (viewModel.isPunchedIn) "Punched In!" else "Punched Out!", Toast.LENGTH_SHORT).show()
                    viewModel.loadLogs()
                }
                is UiState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                }
            }
        }

        viewModel.logs.observe(this) { state ->
            if (state is UiState.Success) {
                binding.rvAttendance.adapter = AttendanceAdapter(state.data.logs)
            }
        }

        viewModel.loadLogs()
    }

    private fun updatePunchButton() {
        if (viewModel.isPunchedIn) {
            binding.btnPunch.text = "PUNCH OUT"
            binding.btnPunch.setBackgroundColor(getColor(android.R.color.holo_red_light))
        } else {
            binding.btnPunch.text = "PUNCH IN"
            binding.btnPunch.setBackgroundColor(getColor(android.R.color.holo_green_dark))
        }
    }

    private fun checkLocationAndPunch() {
        val fineGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (fineGranted) performPunch()
        else locationPermission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
    }

    private fun performPunch() {
        fusedLocationClient.lastLocation.addOnSuccessListener { location ->
            val lat = location?.latitude ?: 0.0
            val lng = location?.longitude ?: 0.0
            if (pendingPunchIn) viewModel.punchIn(lat, lng)
            else viewModel.punchOut(lat, lng)
        }.addOnFailureListener {
            Toast.makeText(this, "Could not get location", Toast.LENGTH_SHORT).show()
        }
    }
}
