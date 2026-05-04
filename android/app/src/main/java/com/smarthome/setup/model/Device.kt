package com.smarthome.setup.model

data class Device(
    val id: String,
    val name: String,
    val type: DeviceType,
    val ip: String,
    var status: String = "offline",
    var state: Map<String, Any> = emptyMap()
)

enum class DeviceType(val displayName: String, val icon: String) {
    XIAOMI_SOCKET("Xiaomi Socket", "🔌"),
    XIAOMI_GATEWAY("Xiaomi Gateway", "🌐"),
    MIDEA_AC("Midea AC", "❄️"),
    SONOFF("Sonoff", "⚡"),
    FLOOR_HEATING("Floor Heating", "🔥"),
    UNKNOWN("Unknown", "❓");

    companion object {
        fun fromString(type: String) = values().find {
            it.name.lowercase() == type.lowercase().replace("-", "_")
        } ?: UNKNOWN
    }
}
