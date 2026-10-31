package `in`.omprakashbharti.sideby.connect

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONObject

/** Reports this app's own grants only. Never requests permissions or reads phone content. */
object PermissionSnapshot {
    val labels = linkedMapOf(
        "internet" to "Internet connection", "camera" to "Camera", "microphone" to "Microphone",
        "location" to "Location", "notifications" to "Notification access", "usage" to "App usage access",
        "photos" to "Photos", "contacts" to "Contacts", "sms" to "SMS messages",
        "call_history" to "Call history", "screen_share" to "Screen sharing"
    )
    fun states(context: Context): Map<String, String> {
        @Suppress("DEPRECATION")
        val declared = context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS).requestedPermissions?.toSet() ?: emptySet()
        fun permission(name: String): String = if (name !in declared) "not_available"
            else if (context.checkSelfPermission(name) == PackageManager.PERMISSION_GRANTED) "granted" else "not_granted"
        // Special access and session features remain unsupported until their actual feature is implemented.
        return linkedMapOf(
            "internet" to permission(Manifest.permission.INTERNET),
            "camera" to permission(Manifest.permission.CAMERA),
            "microphone" to permission(Manifest.permission.RECORD_AUDIO),
            "location" to permission(Manifest.permission.ACCESS_COARSE_LOCATION),
            "notifications" to "not_available", "usage" to "not_available", "photos" to "not_available",
            "contacts" to permission(Manifest.permission.READ_CONTACTS),
            "sms" to permission(Manifest.permission.READ_SMS),
            "call_history" to permission(Manifest.permission.READ_CALL_LOG), "screen_share" to "not_available"
        )
    }
    fun report(context: Context): JSONObject = JSONObject()
        .put("version", 1).put("app_version", BuildConfig.VERSION_NAME).put("android_api", Build.VERSION.SDK_INT)
        .put("permissions", JSONObject(states(context)))
    fun description(context: Context): String = states(context).entries.joinToString("\n\n") { (key, state) ->
        "${labels[key]}: ${when(state) { "granted" -> "Granted"; "not_granted" -> "Not allowed"; else -> "Not available in this app" }}"
    }
}
