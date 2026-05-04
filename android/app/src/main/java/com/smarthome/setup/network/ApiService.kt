package com.smarthome.setup.network

import retrofit2.Response
import retrofit2.http.*

data class DeviceResponse(
    val id: String,
    val name: String,
    val type: String,
    val ip: String,
    val status: String,
    val state: Map<String, Any>
)

data class AddDeviceRequest(
    val id: String,
    val name: String,
    val type: String,
    val ip: String
)

interface ApiService {
    @GET("api/devices")
    suspend fun getDevices(): Response<List<DeviceResponse>>

    @POST("api/devices")
    suspend fun addDevice(@Body device: AddDeviceRequest): Response<DeviceResponse>

    @DELETE("api/devices/id/{id}")
    suspend fun removeDevice(@Path("id") id: String): Response<Unit>
}
