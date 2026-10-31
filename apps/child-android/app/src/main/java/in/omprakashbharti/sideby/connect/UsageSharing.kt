package `in`.omprakashbharti.sideby.connect

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest
import java.time.Instant
import java.time.ZoneId

object UsageSharing {
    private fun prefs(context:Context) = context.getSharedPreferences("usage_sharing",Context.MODE_PRIVATE)
    private fun key(session:Session) = MessageDigest.getInstance("SHA-256").digest(session.credential.toByteArray()).joinToString("") { "%02x".format(it) }
    fun enabled(context:Context, session:Session) = prefs(context).getBoolean(key(session),false)
    fun setEnabled(context:Context, session:Session, enabled:Boolean) { prefs(context).edit().putBoolean(key(session),enabled).apply() }
    fun forget(context:Context, session:Session) { prefs(context).edit().remove(key(session)).apply() }

    // Serialize usage snapshots across the connection and permission screens.
    @Synchronized fun sync(context:Context, session:Session, api:PairingApi): String {
        val zone = if (enabled(context,session)) ZoneId.systemDefault() else ZoneId.of("UTC")
        val end = Instant.now()
        val day = end.atZone(zone).toLocalDate()
        val start = day.atStartOfDay(zone).toInstant()
        var status = when {
            !enabled(context,session) -> "disabled"
            !PermissionSnapshot.usageGranted(context) -> "no_permission"
            else -> "ready"
        }
        var apps = JSONArray()
        var omitted = 0
        if(status == "ready") {
            try {
                val manager = context.getSystemService(UsageStatsManager::class.java)
                val events = manager.queryEvents(start.toEpochMilli()-24*3600000L,end.toEpochMilli()) ?: error("Usage unavailable")
                val accumulator = UsageAccumulator(start.toEpochMilli(),end.toEpochMilli())
                val event = UsageEvents.Event()
                var count = 0
                while(events.hasNextEvent()) {
                    check(++count <= 200000) { "Usage window too large" }
                    events.getNextEvent(event)
                    accumulator.event(event.timeStamp,event.eventType,event.packageName,event.className ?: event.packageName ?: "unknown")
                }
                val totals = accumulator.finish().filterKeys { it.length<=255 && it.matches(Regex("[A-Za-z0-9_]+(\\.[A-Za-z0-9_]+)*")) }
                    .entries.sortedByDescending { it.value }
                omitted = (totals.size-100).coerceAtLeast(0)
                for ((pkg,millis) in totals.take(100)) {
                    val name = try {
                        @Suppress("DEPRECATION")
                        val info = context.packageManager.getApplicationInfo(pkg,0)
                        context.packageManager.getApplicationLabel(info).toString()
                    } catch (_: Exception) { pkg }
                    apps.put(JSONObject().put("package_name",pkg).put("name",name.take(80).ifBlank { pkg.take(80) }).put("foreground_ms",millis))
                }
            } catch (_: Exception) { status = "unavailable"; apps = JSONArray(); omitted = 0 }
        }
        // A stop/revoke during collection wins over the collected result.
        if (!enabled(context,session)) status = "disabled"
        else if (!PermissionSnapshot.usageGranted(context)) status = "no_permission"
        if (status != "ready") { apps = JSONArray(); omitted = 0 }
        val report = JSONObject().put("version",1).put("status",status)
            .put("generated_at",end.toString()).put("day",day.toString()).put("timezone",zone.id)
            .put("period_start",start.toString()).put("apps",apps).put("omitted_apps",omitted)
        api.reportUsage(session,report)
        return when(status) {
            "ready" -> "Today's usage shared: ${apps.length()} apps. Check Digital wellbeing in Sideby Parent."
            "disabled" -> "Usage sharing is off. The server's latest usage snapshot is cleared."
            "no_permission" -> "Usage Access is not allowed. No app usage was shared."
            else -> "Android usage data is unavailable. No app usage was shared."
        }
    }
}
