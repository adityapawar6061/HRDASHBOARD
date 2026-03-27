package com.hrapp.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.hrapp.data.LoginRequest
import com.hrapp.data.RetrofitClient
import com.hrapp.databinding.ActivityLoginBinding
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // If already logged in, go to main
        val prefs = getSharedPreferences("hr_prefs", Context.MODE_PRIVATE)
        if (prefs.getString("token", null) != null) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()
            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            login(email, password)
        }
    }

    private fun login(email: String, password: String) {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnLogin.isEnabled = false

        lifecycleScope.launch {
            try {
                val api = RetrofitClient.getInstance(applicationContext)
                val res = api.login(LoginRequest(email, password))
                if (res.isSuccessful) {
                    val body = res.body()!!
                    getSharedPreferences("hr_prefs", Context.MODE_PRIVATE).edit()
                        .putString("token", body.token)
                        .putString("user_name", body.user.name)
                        .putString("user_role", body.user.role)
                        .apply()
                    startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(this@LoginActivity, "Invalid credentials", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@LoginActivity, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.btnLogin.isEnabled = true
            }
        }
    }
}
