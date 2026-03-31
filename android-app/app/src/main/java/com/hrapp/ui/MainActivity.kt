package com.hrapp.ui

import android.Manifest
import android.content.Context
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
import com.hrapp.data.Campaign
import com.hrapp.databinding.ActivityMainBinding
import com.hrapp.viewmodel.MainViewModel
import com.hrapp.viewmodel.UiState

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val viewModel: MainViewModel by viewModels()
    private val fusedLocationClient by lazy { LocationServices.getFusedLocationProviderClient(this) }

    private var activeCampaign: Campaign? = null
    private var currentLat = 0.0
    private var currentLng = 0.0

    private val locationPermission = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { perms ->
        if (perms[Manifest.permission.ACCESS_FINE_LOCATION] == true) performPunch()
        else Toast.makeText(this, "Location permission required", Toast.LENGTH_SHORT).show()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val prefs = getSharedPreferences("hr_prefs", Context.MODE_PRIVATE)
        binding.tvWelcome.text = "Hello, ${prefs.getString("user_name", "Employee")}"

        setupTabs()
        setupRecyclerViews()
        observeViewModel()

        binding.btnPunch.setOnClickListener { checkLocationAndPunch() }

        binding.btnRequestPayslip.setOnClickListener {
            val month = binding.etPayslipMonth.text.toString().trim()
            if (!month.matches(Regex("\\d{4}-\\d{2}"))) {
                Toast.makeText(this, "Enter month as YYYY-MM", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewModel.requestPayslip(month)
        }

        viewModel.loadCampaigns()
        viewModel.loadLogs()
        viewModel.loadPayslipRequests()
        refreshLocation()
    }

    private fun setupTabs() {
        binding.tabHome.setOnClickListener { showTab(0) }
        binding.tabAttendance.setOnClickListener { showTab(1) }
        binding.tabPayslip.setOnClickListener { showTab(2) }
    }

    private fun showTab(index: Int) {
        binding.pageHome.visibility = if (index == 0) View.VISIBLE else View.GONE
        binding.pageAttendance.visibility = if (index == 1) View.VISIBLE else View.GONE
        binding.pagePayslip.visibility = if (index == 2) View.VISIBLE else View.GONE

        val active = 0xFF4F46E5.toInt()
        val inactive = 0xFFE2E8F0.toInt()
        val activeText = 0xFFFFFFFF.toInt()
        val inactiveText = 0xFF4F46E5.toInt()

        listOf(binding.tabHome, binding.tabAttendance, binding.tabPayslip).forEachIndexed { i, btn ->
            btn.backgroundTintList = android.content.res.ColorStateList.valueOf(if (i == index) active else inactive)
            btn.setTextColor(if (i == index) activeText else inactiveText)
        }
    }

    private fun setupRecyclerViews() {
        binding.rvAttendance.layoutManager = LinearLayoutManager(this)
        binding.rvPayslipRequests.layoutManager = LinearLayoutManager(this)
    }

    private fun observeViewModel() {
        viewModel.campaigns.observe(this) { state ->
            if (state is UiState.Success) {
                val campaign = state.data.firstOrNull()
                activeCampaign = campaign
                if (campaign != null) {
                    binding.cardCampaign.visibility = View.VISIBLE
                    binding.tvNoCampaign.visibility = View.GONE
                    binding.tvCampaignName.text = campaign.name
                    updatePunchButton()
                } else {
                    binding.cardCampaign.visibility = View.GONE
                    binding.tvNoCampaign.visibility = View.VISIBLE
                }
            }
        }

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

        viewModel.payslipRequests.observe(this) { state ->
            if (state is UiState.Success) {
                binding.rvPayslipRequests.adapter = PayslipRequestAdapter(state.data)
            }
        }

        viewModel.payslipRequestState.observe(this) { state ->
            when (state) {
                is UiState.Success -> {
                    Toast.makeText(this, "Request sent! Waiting for admin approval.", Toast.LENGTH_LONG).show()
                    binding.etPayslipMonth.text?.clear()
                }
                is UiState.Error -> Toast.makeText(this, state.message, Toast.LENGTH_LONG).show()
                else -> {}
            }
        }
    }

    private fun updatePunchButton() {
        val campaign = activeCampaign ?: return
        val inLocation = isInLocation(campaign)
        binding.btnPunch.isEnabled = inLocation
        binding.tvLocationWarning.visibility = if (!inLocation && campaign.location_lat != null) View.VISIBLE else View.GONE

        if (viewModel.isPunchedIn) {
            binding.btnPunch.text = "PUNCH OUT"
            binding.btnPunch.backgroundTintList = android.content.res.ColorStateList.valueOf(
                if (inLocation) 0xFFDC2626.toInt() else 0xFF94A3B8.toInt()
            )
        } else {
            binding.btnPunch.text = "PUNCH IN"
            binding.btnPunch.backgroundTintList = android.content.res.ColorStateList.valueOf(
                if (inLocation) 0xFF22C55E.toInt() else 0xFF94A3B8.toInt()
            )
        }
    }

    private fun isInLocation(campaign: Campaign): Boolean {
        val lat = campaign.location_lat ?: return true // no geofence set = always allowed
        val lng = campaign.location_lng ?: return true
        val radius = campaign.location_radius_meters ?: 200
        if (currentLat == 0.0 && currentLng == 0.0) return false
        return viewModel.distanceMeters(currentLat, currentLng, lat, lng) <= radius
    }

    private fun refreshLocation() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                if (loc != null) {
                    currentLat = loc.latitude
                    currentLng = loc.longitude
                    updatePunchButton()
                }
            }
        }
    }

    private fun checkLocationAndPunch() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            performPunch()
        } else {
            locationPermission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
        }
    }

    private fun performPunch() {
        fusedLocationClient.lastLocation.addOnSuccessListener { location ->
            val lat = location?.latitude ?: 0.0
            val lng = location?.longitude ?: 0.0
            currentLat = lat
            currentLng = lng
            if (!isInLocation(activeCampaign ?: return@addOnSuccessListener)) {
                Toast.makeText(this, "You are not at the work location", Toast.LENGTH_SHORT).show()
                updatePunchButton()
                return@addOnSuccessListener
            }
            if (viewModel.isPunchedIn) viewModel.punchOut(lat, lng)
            else viewModel.punchIn(lat, lng)
        }.addOnFailureListener {
            Toast.makeText(this, "Could not get location", Toast.LENGTH_SHORT).show()
        }
    }
}
