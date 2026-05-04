package com.smarthome.setup

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.smarthome.setup.network.AddDeviceRequest
import com.smarthome.setup.network.RetrofitClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class DeviceConfigActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_device_config)

        val devices = intent.getParcelableArrayListExtra<DeviceParcel>("devices") ?: return
        val wifiSsid = intent.getStringExtra("wifi_ssid") ?: ""
        val tvStatus = findViewById<TextView>(R.id.tvConfigStatus)
        val progressBar = findViewById<ProgressBar>(R.id.progressConfig)
        val btnFinish = findViewById<Button>(R.id.btnFinish)

        btnFinish.isEnabled = false

        configureDevices(devices, wifiSsid, tvStatus, progressBar) {
            runOnUiThread {
                btnFinish.isEnabled = true
            }
        }

        btnFinish.setOnClickListener {
            startActivity(Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
            })
        }
    }

    private fun configureDevices(
        devices: List<DeviceParcel>,
        wifiSsid: String,
        tvStatus: TextView,
        progressBar: ProgressBar,
        onComplete: () -> Unit
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            devices.forEachIndexed { index, device ->
                withContext(Dispatchers.Main) {
                    tvStatus.text = "Configuring ${device.type} at ${device.ip}…"
                    progressBar.progress = ((index.toFloat() / devices.size) * 100).toInt()
                }
                delay(1000) // Simulate configuration time
                try {
                    val deviceId = "${device.type.lowercase()}_${device.mac.replace(":", "").takeLast(4)}"
                    val request = AddDeviceRequest(
                        id = deviceId,
                        name = "${device.type.replace("_", " ").lowercase().replaceFirstChar { it.uppercase() }} (${device.mac.takeLast(5)})",
                        type = device.type.lowercase(),
                        ip = device.ip
                    )
                    RetrofitClient.getApiService().addDevice(request)
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@DeviceConfigActivity, "Warning: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            withContext(Dispatchers.Main) {
                progressBar.progress = 100
                tvStatus.text = getString(R.string.setup_complete)
                onComplete()
            }
        }
    }
}
