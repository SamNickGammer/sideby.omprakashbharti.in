package `in`.omprakashbharti.sideby.connect

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.provider.ContactsContract
import android.provider.Telephony
import android.provider.CallLog
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.security.MessageDigest

object ContentSharing {
    val labels = linkedMapOf("apps" to "Installed apps", "notifications" to "Notification previews", "contacts" to "Contacts", "sms" to "SMS messages", "calls" to "Call history")
    val permissions = mapOf("contacts" to Manifest.permission.READ_CONTACTS, "sms" to Manifest.permission.READ_SMS, "calls" to Manifest.permission.READ_CALL_LOG)
    private fun prefs(c:Context)=c.getSharedPreferences("content_sharing",Context.MODE_PRIVATE)
    private fun key(s:Session)=MessageDigest.getInstance("SHA-256").digest(s.credential.toByteArray()).joinToString(""){"%02x".format(it)}
    fun enabled(c:Context,s:Session,kind:String)=prefs(c).getBoolean(key(s)+kind,false)
    fun setEnabled(c:Context,s:Session,kind:String,value:Boolean) { prefs(c).edit().putBoolean(key(s)+kind,value).apply(); if(kind=="notifications") PreviewBuffer.clear() }
    fun sources(c:Context,s:Session)=prefs(c).getStringSet(key(s)+"sources",emptySet())!!.toSet()
    fun setSources(c:Context,s:Session,values:Set<String>) { prefs(c).edit().putStringSet(key(s)+"sources",values).apply();PreviewBuffer.clear() }
    fun forget(c:Context,s:Session) { val edit=prefs(c).edit();prefs(c).all.keys.filter{it.startsWith(key(s))}.forEach{edit.remove(it)};edit.apply();PreviewBuffer.clear() }
    fun granted(c:Context,kind:String)=when(kind) {
        "notifications" -> if(android.os.Build.VERSION.SDK_INT>=27) c.getSystemService(android.app.NotificationManager::class.java).isNotificationListenerAccessGranted(android.content.ComponentName(c,PreviewListener::class.java)) else (android.provider.Settings.Secure.getString(c.contentResolver,"enabled_notification_listeners")?:"").split(':').any{it==android.content.ComponentName(c,PreviewListener::class.java).flattenToString()}
        else -> permissions[kind]?.let{c.checkSelfPermission(it)==PackageManager.PERMISSION_GRANTED} ?: true
    }
    @Suppress("DEPRECATION")
    fun visibleApps(c:Context): List<android.content.pm.ApplicationInfo> = c.packageManager.queryIntentActivities(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER),0)
        .map{it.activityInfo.applicationInfo}.distinctBy{it.packageName}.sortedBy{c.packageManager.getApplicationLabel(it).toString().lowercase()}
    fun report(status:String,items:JSONArray=JSONArray(),omitted:Int=0)=JSONObject().put("version",1).put("status",status).put("generated_at",Instant.now().toString()).put("items",items).put("omitted",omitted)
    @Synchronized fun sync(c:Context,s:Session,api:PairingApi,only:String?=null):String {
        val notes=mutableListOf<String>()
        for((kind,label) in labels.filterKeys{only==null||it==only}) {
            try {
                var status=if(!enabled(c,s,kind)) "disabled" else if(!granted(c,kind)) "no_permission" else "ready"
                var items=JSONArray();var omitted=0
                if(status=="ready") {
                    try {
                        when(kind) {
                            "apps" -> {
                                val apps=visibleApps(c);omitted=(apps.size-500).coerceAtLeast(0)
                                for(app in apps.take(500)) {
                                    @Suppress("DEPRECATION") val version=c.packageManager.getPackageInfo(app.packageName,0).versionName ?: ""
                                    items.put(JSONObject().put("id",app.packageName).put("name",c.packageManager.getApplicationLabel(app).toString().take(120)).put("version",version.take(80)).put("system",app.flags and ApplicationInfo.FLAG_SYSTEM != 0))
                                }
                            }
                            "notifications" -> items=PreviewBuffer.snapshot(s.credential)
                            "contacts" -> c.contentResolver.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI,arrayOf("_id","display_name","data1"),null,null,"display_name ASC")?.use{cur->
                                omitted=(cur.count-200).coerceAtLeast(0)
                                while(items.length()<200&&cur.moveToNext()) items.put(JSONObject().put("id",cur.getString(0)).put("name",(cur.getString(1)?:"").take(120)).put("number",(cur.getString(2)?:"").take(80)))
                            } ?: error("Contacts unavailable")
                            "sms" -> c.contentResolver.query(Telephony.Sms.CONTENT_URI,arrayOf("_id","address","body","date","type"),"date>=?",arrayOf((System.currentTimeMillis()-7*86400000L).toString()),"date DESC")?.use{cur->
                                omitted=(cur.count-100).coerceAtLeast(0)
                                while(items.length()<100&&cur.moveToNext()) {
                                    val body=cur.getString(2)?:""
                                    items.put(JSONObject().put("id",cur.getString(0)).put("address",(cur.getString(1)?:"").take(80)).put("body",if(PreviewPolicy.sensitive(body)) "Sensitive message withheld" else body.take(500)).put("time",Instant.ofEpochMilli(cur.getLong(3)).toString()).put("direction",when(cur.getInt(4)){1->"incoming";2->"outgoing";else->"other"}))
                                }
                            } ?: error("SMS unavailable")
                            "calls" -> c.contentResolver.query(CallLog.Calls.CONTENT_URI,arrayOf("_id","number","type","duration","date"),"date>=?",arrayOf((System.currentTimeMillis()-7*86400000L).toString()),"date DESC")?.use{cur->
                                omitted=(cur.count-100).coerceAtLeast(0)
                                while(items.length()<100&&cur.moveToNext())items.put(JSONObject().put("id",cur.getString(0)).put("number",(cur.getString(1)?:"").take(80)).put("type",when(cur.getInt(2)){1->"incoming";2->"outgoing";3->"missed";else->"other"}).put("duration",cur.getLong(3).coerceIn(0,604800)).put("time",Instant.ofEpochMilli(cur.getLong(4)).toString()))
                            } ?: error("Call history unavailable")
                        }
                    } catch(_:Exception) {status="unavailable"}
                }
                if(!enabled(c,s,kind))status="disabled" else if(!granted(c,kind))status="no_permission"
                if(status!="ready"){items=JSONArray();omitted=0}
                api.reportContent(s,kind,report(status,items,omitted))
                if(enabled(c,s,kind))notes.add("$label: ${if(status=="ready") "${items.length()} shared" else status.replace('_',' ')}")
            } catch(_:Exception) {notes.add("$label: sync failed; retry when connected")}
        }
        return if(notes.isEmpty()) "Sharing settings synced. Disabled snapshots cleared." else notes.joinToString("\n")
    }
}
