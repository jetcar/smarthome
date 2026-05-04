package com.smarthome.setup

import android.os.Parcel
import android.os.Parcelable

data class DeviceParcel(
    val ip: String,
    val type: String,
    val mac: String
) : Parcelable {
    constructor(parcel: Parcel) : this(
        parcel.readString() ?: "",
        parcel.readString() ?: "",
        parcel.readString() ?: ""
    )

    override fun writeToParcel(parcel: Parcel, flags: Int) {
        parcel.writeString(ip)
        parcel.writeString(type)
        parcel.writeString(mac)
    }

    override fun describeContents() = 0

    companion object CREATOR : Parcelable.Creator<DeviceParcel> {
        override fun createFromParcel(parcel: Parcel) = DeviceParcel(parcel)
        override fun newArray(size: Int) = arrayOfNulls<DeviceParcel>(size)
    }
}
