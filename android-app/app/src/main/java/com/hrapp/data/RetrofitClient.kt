package com.hrapp.data

import android.content.Context
import com.hrapp.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private var instance: ApiService? = null

    fun getInstance(context: Context): ApiService {
        if (instance == null) {
            val prefs = context.getSharedPreferences("hr_prefs", Context.MODE_PRIVATE)
            val client = OkHttpClient.Builder()
                .addInterceptor { chain ->
                    val token = prefs.getString("token", null)
                    val req = if (token != null) {
                        chain.request().newBuilder()
                            .addHeader("Authorization", "Bearer $token")
                            .build()
                    } else chain.request()
                    chain.proceed(req)
                }
                .addInterceptor(HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BODY
                })
                .build()

            instance = Retrofit.Builder()
                .baseUrl(BuildConfig.BASE_URL + "/")
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiService::class.java)
        }
        return instance!!
    }
}
