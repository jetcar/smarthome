package com.smarthome.setup

import android.content.Intent
import android.net.wifi.WifiManager
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class WifiSetupActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_wifi_setup)

        val etSsid = findViewById<EditText>(R.id.etSsid)
        val etPassword = findViewById<EditText>(R.id.etPassword)
        val btnScanWifi = findViewById<Button>(R.id.btnScanWifi)
        val btnNext = findViewById<Button>(R.id.btnNext)

        // Pre-fill current network SSID
        val wifiManager = applicationContext.getSystemService(WIFI_SERVICE) as WifiManager
        @Suppress("DEPRECATION")
        val currentSsid = wifiManager.connectionInfo?.ssid?.removePrefix("\"")?.removeSuffix("\"")
        if (!currentSsid.isNullOrEmpty() && currentSsid != "<unknown ssid>") {
            etSsid.setText(currentSsid)
        }

        btnScanWifi.setOnClickListener {
            Toast.makeText(this, "Scanning for Wi-Fi networks...", Toast.LENGTH_SHORT).show()
        }

        btnNext.setOnClickListener {
            val ssid = etSsid.text.toString().trim()
            val password = etPassword.text.toString()
            if (ssid.isBlank()) {
                etSsid.error = "Enter Wi-Fi SSID"
                return@setOnClickListener
            }
            val intent = Intent(this, DeviceDiscoveryActivity::class.java).apply {
                putExtra("wifi_ssid", ssid)
                putExtra("wifi_password", password)
            }
            startActivity(intent)
        }
    }
}
