package com.smarthome.setup

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.smarthome.setup.model.DeviceType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class DiscoveredDevice(
    val ip: String,
    val type: DeviceType,
    val mac: String,
    var selected: Boolean = false
)

class DeviceDiscoveryActivity : AppCompatActivity() {

    private val discoveredDevices = mutableListOf<DiscoveredDevice>()
    private lateinit var adapter: DiscoveredDeviceAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_device_discovery)

        val wifiSsid = intent.getStringExtra("wifi_ssid") ?: ""
        val wifiPassword = intent.getStringExtra("wifi_password") ?: ""

        val rvDevices = findViewById<RecyclerView>(R.id.rvDiscoveredDevices)
        val btnScan = findViewById<Button>(R.id.btnScan)
        val btnNext = findViewById<Button>(R.id.btnNext)
        val tvStatus = findViewById<TextView>(R.id.tvScanStatus)

        adapter = DiscoveredDeviceAdapter(discoveredDevices)
        rvDevices.layoutManager = LinearLayoutManager(this)
        rvDevices.adapter = adapter

        btnScan.setOnClickListener {
            startNetworkScan(tvStatus, btnNext)
        }

        btnNext.setOnClickListener {
            val selected = discoveredDevices.filter { it.selected }
            if (selected.isEmpty()) {
                Toast.makeText(this, "Select at least one device", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val intent = Intent(this, DeviceConfigActivity::class.java).apply {
                putExtra("wifi_ssid", wifiSsid)
                putExtra("wifi_password", wifiPassword)
                putParcelableArrayListExtra("devices", ArrayList(selected.map { d ->
                    DeviceParcel(d.ip, d.type.name, d.mac)
                }))
            }
            startActivity(intent)
        }
    }

    private fun startNetworkScan(tvStatus: TextView, btnNext: Button) {
        tvStatus.text = getString(R.string.scanning)
        discoveredDevices.clear()
        adapter.notifyDataSetChanged()
        btnNext.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            // Simulate network scan discovering IoT devices
            delay(2000)
            val simulated = listOf(
                DiscoveredDevice("192.168.1.101", DeviceType.XIAOMI_SOCKET, "AA:BB:CC:DD:EE:01"),
                DiscoveredDevice("192.168.1.102", DeviceType.XIAOMI_SOCKET, "AA:BB:CC:DD:EE:02"),
                DiscoveredDevice("192.168.1.100", DeviceType.XIAOMI_GATEWAY, "AA:BB:CC:DD:EE:00"),
                DiscoveredDevice("192.168.1.110", DeviceType.MIDEA_AC, "AA:BB:CC:DD:EE:10"),
                DiscoveredDevice("192.168.1.120", DeviceType.SONOFF, "AA:BB:CC:DD:EE:20"),
                DiscoveredDevice("192.168.1.130", DeviceType.FLOOR_HEATING, "AA:BB:CC:DD:EE:30")
            )
            withContext(Dispatchers.Main) {
                discoveredDevices.addAll(simulated)
                adapter.notifyDataSetChanged()
                tvStatus.text = getString(R.string.devices_found, simulated.size)
                btnNext.isEnabled = true
            }
        }
    }
}

class DiscoveredDeviceAdapter(private val devices: List<DiscoveredDevice>) :
    RecyclerView.Adapter<DiscoveredDeviceAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvIcon: TextView = view.findViewById(R.id.tvDeviceIcon)
        val tvType: TextView = view.findViewById(R.id.tvDeviceType)
        val tvIp: TextView = view.findViewById(R.id.tvDeviceIp)
        val checkbox: CheckBox = view.findViewById(R.id.cbSelect)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        ViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_discovered_device, parent, false))

    override fun getItemCount() = devices.size

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val device = devices[position]
        holder.tvIcon.text = device.type.icon
        holder.tvType.text = device.type.displayName
        holder.tvIp.text = device.ip
        holder.checkbox.isChecked = device.selected
        holder.checkbox.setOnCheckedChangeListener { _, checked ->
            device.selected = checked
        }
        holder.itemView.setOnClickListener {
            device.selected = !device.selected
            holder.checkbox.isChecked = device.selected
        }
    }
}
