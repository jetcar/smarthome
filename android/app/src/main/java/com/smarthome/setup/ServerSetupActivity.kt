package com.smarthome.setup

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.smarthome.setup.network.RetrofitClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ServerSetupActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_server_setup)

        val etServerUrl = findViewById<EditText>(R.id.etServerUrl)
        val btnNext = findViewById<Button>(R.id.btnNext)

        btnNext.setOnClickListener {
            val serverUrl = etServerUrl.text.toString().trim()
            if (serverUrl.isBlank()) {
                etServerUrl.error = getString(R.string.server_url_hint)
                return@setOnClickListener
            }
            RetrofitClient.setBaseUrl(serverUrl)
            testServerConnection(serverUrl)
        }
    }

    private fun testServerConnection(serverUrl: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.getApiService().getDevices()
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@ServerSetupActivity, "Connected!", Toast.LENGTH_SHORT).show()
                        startActivity(Intent(this@ServerSetupActivity, WifiSetupActivity::class.java))
                    } else {
                        Toast.makeText(this@ServerSetupActivity, "Server error: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@ServerSetupActivity, "Cannot connect: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
