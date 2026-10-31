package `in`.omprakashbharti.sideby.connect

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.security.MessageDigest

object PreviewBuffer {
    @Volatile var screenVisible=false
    private var owner=""
    private val items=linkedMapOf<String,JSONObject>()
    @Synchronized fun clear(){items.clear();owner=""}
    @Synchronized fun add(credential:String,id:String,value:JSONObject) {
        if(owner!=credential){clear();owner=credential}
        items.remove(id);items[id]=value
        while(items.size>100)items.remove(items.keys.first())
    }
    @Synchronized fun snapshot(credential:String):JSONArray {
        if(owner!=credential)return JSONArray()
        val cutoff=System.currentTimeMillis()-86400000L
        items.entries.removeAll{Instant.parse(it.value.getString("time")).toEpochMilli()<cutoff}
        return JSONArray(items.values.toList().reversed())
    }
}
class PreviewListener:NotificationListenerService() {
    override fun onNotificationPosted(sbn:StatusBarNotification) {
        val s=try{SecureSession(this).load()}catch(_:Exception){null} ?: return
        if(!s.connected||!PreviewPolicy.allowed(sbn.packageName,ContentSharing.sources(this,s),ContentSharing.enabled(this,s,"notifications"),PreviewBuffer.screenVisible))return
        val n=sbn.notification
        if(n.flags and Notification.FLAG_GROUP_SUMMARY != 0)return
        val title=n.extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?:""
        val text=n.extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?:""
        val redacted=n.visibility!=Notification.VISIBILITY_PUBLIC||PreviewPolicy.sensitive(title+" "+text)
        val id=MessageDigest.getInstance("SHA-256").digest(sbn.key.toByteArray()).joinToString(""){"%02x".format(it)}
        val app=try{packageManager.getApplicationLabel(packageManager.getApplicationInfo(sbn.packageName,0)).toString()}catch(_:Exception){sbn.packageName}
        PreviewBuffer.add(s.credential,id,JSONObject().put("id",id).put("package",sbn.packageName).put("app",app.take(120)).put("title",if(redacted)"Sensitive notification" else title.take(160)).put("text",if(redacted)"Content withheld" else text.take(500)).put("time",Instant.ofEpochMilli(sbn.postTime).toString()).put("redacted",redacted))
    }
    override fun onListenerDisconnected(){PreviewBuffer.clear()}
}
