package com.hrapp.ui

import android.content.ClipData
import android.content.ClipboardManager
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
            binding.errorCard.visibility = View.GONE
            login(email, password)
        }

        binding.btnCopyError.setOnClickListener {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("error", binding.tvErrorMessage.text))
            Toast.makeText(this, "Error copied", Toast.LENGTH_SHORT).show()
        }
    }

    private fun login(email: String, password: String) {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnLogin.isEnabled = false

        lifecycleScope.launch {
            try {
                val api = RetrofitClient.getInstance(applicationContext)
                val res = api.login(LoginRequest(email, password))
                val body = if (res.isSuccessful) res.body() else null
                val token = body?.token
                val user = body?.user
                when {
                    !res.isSuccessful -> {
                        val errBody = res.errorBody()?.string() ?: "HTTP ${res.code()}"
                        binding.errorCard.visibility = View.VISIBLE
                        binding.tvErrorMessage.text = "HTTP ${res.code()}\n$errBody"
                    }
                    token == null -> {
                        binding.errorCard.visibility = View.VISIBLE
                        binding.tvErrorMessage.text = "Login succeeded but no token returned.\nRaw body: $body"
                    }
                    user == null -> {
                        binding.errorCard.visibility = View.VISIBLE
                        binding.tvErrorMessage.text = "Token received but user profile is null.\n\nYour Supabase Auth account exists but there is no matching row in the public.users table.\n\nFix: In Supabase SQL Editor run:\nINSERT INTO public.users (id, name, email, role)\nVALUES ('<your-auth-uuid>', 'Your Name', '${ binding.etEmail.text }', 'admin');"
                    }
                    else -> {
                        getSharedPreferences("hr_prefs", Context.MODE_PRIVATE).edit()
                            .putString("token", token)
                            .putString("user_name", user.name)
                            .putString("user_role", user.role)
                            .apply()
                        startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                        finish()
                    }
                }
            } catch (e: Exception) {
                val fullError = "${e.javaClass.name}: ${e.message}\n\n${e.stackTraceToString().take(800)}"
                binding.errorCard.visibility = View.VISIBLE
                binding.tvErrorMessage.text = fullError
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.btnLogin.isEnabled = true
            }
        }
    }
}
