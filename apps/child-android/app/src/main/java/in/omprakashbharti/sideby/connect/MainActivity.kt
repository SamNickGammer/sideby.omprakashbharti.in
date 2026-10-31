package `in`.omprakashbharti.sideby.connect

import android.app.Activity
import android.app.AlertDialog
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.*
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private val ink=Color.rgb(24,61,56)
    private val muted=Color.rgb(97,115,106)
    private val green=Color.rgb(40,101,79)
    private val handler=Handler(Looper.getMainLooper())
    private val executor=Executors.newSingleThreadExecutor()
    private lateinit var storage: SecureSession
    private var session: Session?=null
    private var busy=false
    private var active=false
    private var generation=0
    private var message=""
    private lateinit var content: LinearLayout
    private lateinit var server: EditText
    private lateinit var device: EditText
    private lateinit var code: EditText
    private val tick=Runnable { sync() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Pairing codes and device status must not leak into screenshots or recent-task previews.
        if (!BuildConfig.DEBUG) window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        storage=SecureSession(this)
        try { session=storage.load() } catch (_: Exception) {
            storage.clear(); message="The saved connection could not be opened. Please pair again."
        }
        render()
    }
    override fun onStart() { super.onStart(); active=true; if(session!=null) handler.post(tick) }
    override fun onStop() { active=false; handler.removeCallbacks(tick); super.onStop() }
    override fun onDestroy() { generation++; executor.shutdownNow(); super.onDestroy() }

    private fun dp(n:Int)=(n*resources.displayMetrics.density).toInt()
    private fun background(color:Int,radius:Int=18)=GradientDrawable().apply { setColor(color); cornerRadius=dp(radius).toFloat() }
    private fun text(value:String,size:Float=15f,color:Int=ink,bold:Boolean=false)=TextView(this).apply {
        text=value; textSize=size; setTextColor(color); setLineSpacing(dp(3).toFloat(),1f)
        if(bold) typeface=Typeface.create("sans-serif-medium",Typeface.NORMAL)
    }
    private fun LinearLayout.space(n:Int) { addView(View(this@MainActivity),LinearLayout.LayoutParams(1,dp(n))) }
    private fun LinearLayout.label(value:String,size:Float=15f,color:Int=ink,bold:Boolean=false) { addView(text(value,size,color,bold)) }
    private fun button(label:String,secondary:Boolean=false,action:()->Unit)=Button(this).apply {
        text=label; isAllCaps=false; textSize=15f; minHeight=dp(52); setPadding(dp(12),dp(8),dp(12),dp(8))
        setTextColor(if(secondary)green else Color.WHITE); background=background(if(secondary)Color.rgb(232,240,226) else green,12)
        setOnClickListener { action() }; layoutParams=LinearLayout.LayoutParams(-1,dp(54))
    }
    private fun field(label:String,value:String,hint:String,id:Int):EditText {
        content.label(label,12f,muted,true); content.space(7)
        return EditText(this).apply {
            this.id=id; setText(value); this.hint=hint; textSize=15f; setTextColor(ink); setHintTextColor(muted)
            setSingleLine(); setPadding(dp(14),dp(10),dp(14),dp(10)); background=background(Color.WHITE,12)
            inputType=InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
            importantForAutofill=View.IMPORTANT_FOR_AUTOFILL_NO
            content.addView(this,LinearLayout.LayoutParams(-1,dp(56))); content.space(18)
        }
    }
    private fun render() {
        val scroll=ScrollView(this).apply { setBackgroundColor(Color.rgb(251,252,248)); isFillViewport=true }
        content=LinearLayout(this).apply { orientation=LinearLayout.VERTICAL; setPadding(dp(26),dp(24),dp(26),dp(28)) }
        scroll.addView(content)
        scroll.setOnApplyWindowInsetsListener { v,insets ->
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                val bars=insets.getInsets(android.view.WindowInsets.Type.systemBars() or android.view.WindowInsets.Type.ime())
                v.setPadding(bars.left,bars.top,bars.right,bars.bottom)
            } else {
                @Suppress("DEPRECATION")
                v.setPadding(insets.systemWindowInsetLeft,insets.systemWindowInsetTop,insets.systemWindowInsetRight,insets.systemWindowInsetBottom)
            }
            insets
        }
        setContentView(scroll)
        val brand=LinearLayout(this).apply { orientation=LinearLayout.HORIZONTAL; gravity=Gravity.CENTER_VERTICAL }
        brand.addView(ImageView(this).apply { setImageResource(`in`.omprakashbharti.sideby.connect.R.drawable.ic_sideby); contentDescription="Sideby" },LinearLayout.LayoutParams(dp(38),dp(38)))
        brand.addView(text("  sideby connect",18f,ink,true)); content.addView(brand); content.space(34)
        val s=session
        if(s==null) {
            content.label("YOUR FAMILY, CONNECTED",10f,green,true); content.space(12)
            content.label("A little closer.\nSide by side.",32f,ink,true); content.space(14)
            content.label("Connect this device to your family’s Sideby Parent dashboard. You’ll see what’s shared, right here.",15f,muted); content.space(28)
            if(BuildConfig.DEBUG) {
                server=field("LOCAL TEST SERVER","http://127.0.0.1:3000","http://127.0.0.1:3000",101)
            } else server=field("PARENT SERVER","","https://your-parent-server",101)
            server.inputType=InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
            device=field("DEVICE NAME",android.os.Build.MODEL.take(60),"My phone",102)
            code=field("PAIRING CODE","","ABCD – 1234 – EFAB – 5678",103)
            code.inputType=InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
            if(message.isNotEmpty()) { content.label(message,13f,Color.rgb(153,63,48)); content.space(15) }
            content.addView(button("Connect to my family") { beginPairing() }); content.space(22)
            content.label("Ask your parent to open your Child’s Space → Devices and create a pairing code.",13f,muted)
        } else {
            content.label(if(s.connected)"YOUR CONNECTION" else "ONE MORE STEP",10f,green,true); content.space(12)
            content.label(if(s.connected)"You’re paired." else "Ask your parent\nto confirm.",32f,ink,true); content.space(14)
            content.label(if(s.connected)"This device is linked to your family. A check-in lets your parent know this app was recently open." else "Compare this confirmation number with Sideby Parent before your parent approves this device.",15f,muted); content.space(26)
            val card=LinearLayout(this).apply { orientation=LinearLayout.VERTICAL; setPadding(dp(22),dp(22),dp(22),dp(22)); background=background(Color.rgb(232,240,226)) }
            if(!s.connected) { card.label("CONFIRMATION NUMBER",10f,green,true); card.space(8); card.label(ConnectionPolicy.fingerprint(s.credential).chunked(4).joinToString("  "),30f,ink,true); card.space(18) }
            card.label(s.name,18f,ink,true); card.space(8)
            card.label(if(s.connected)"Paired with your parent" else "Waiting for parent approval",13f,muted)
            if(s.lastSeen.isNotEmpty()) { card.space(12); card.label("Last check-in: ${displayTime(s.lastSeen)}",12f,muted) }
            content.addView(card); content.space(18)
            content.label(if(message.isNotEmpty())message else if(busy)"Checking connection…" else "Ready to check in.",13f,muted); content.space(20)
            content.addView(button(if(s.connected)"Check in now" else "Check approval") { sync() }.apply { isEnabled=!busy }); content.space(12)
            content.addView(button(if(s.connected)"Forget this connection" else "Cancel on this device",true) { confirmForget() })
            content.space(12)
            content.addView(button("Permissions on this device",true) {
                startActivity(android.content.Intent(this, PermissionActivity::class.java))
            })
            content.space(12); content.addView(button("Manage data sharing",true) { startActivity(android.content.Intent(this,SharingActivity::class.java)) })
            content.space(12); content.addView(button("Live sharing",true) { startActivity(android.content.Intent(this,LiveActivity::class.java)) })
            if(BuildConfig.DEBUG) { content.space(20); content.label("Local test server\n${s.origin}",11f,muted) }
        }
        content.space(30)
        val info=LinearLayout(this).apply { orientation=LinearLayout.VERTICAL; setPadding(dp(18),dp(18),dp(18),dp(18)); background=background(Color.rgb(242,244,238),12) }
        info.label("A connection you can see.",14f,ink,true); info.space(8)
        info.label("This version shares the device name, Android version, app version, check-in time and permission status. If you enable usage sharing, it also shares today’s per-app foreground time. Other sharing (apps, notification previews, contacts, supported SMS/call records and selected photos) is separately enabled in Manage data sharing. Live screen, camera and microphone sessions are separately approved in Live sharing. Location remains unavailable.",12f,muted)
        info.space(10); info.label("Check-ins run while this app is open. Background syncing is not included yet.",12f,muted)
        if(BuildConfig.DEBUG) { info.space(10); info.label("Development build · local connection testing",10f,green,true) }
        content.addView(info)
    }
    private fun displayTime(value:String):String=try { DateTimeFormatter.ofPattern("d MMM, HH:mm:ss").withZone(ZoneId.systemDefault()).format(Instant.parse(value)) } catch (_:Exception) { "Received" }
    private fun beginPairing() {
        if(busy)return
        try {
            val name=device.text.toString().trim(); require(name.isNotBlank()&&name.length<=60) { "Use a device name between 1 and 60 characters." }
            val s=Session(ConnectionPolicy.origin(server.text.toString(),BuildConfig.DEBUG),ConnectionPolicy.credential(),ConnectionPolicy.code(code.text.toString()),name)
            storage.save(s); session=s; message="Connecting securely…"; render(); sync()
        } catch(e:IllegalArgumentException) { Toast.makeText(this,e.message,Toast.LENGTH_LONG).show() }
        catch(_:Exception) { Toast.makeText(this,"Could not save the connection securely. Try again.",Toast.LENGTH_LONG).show() }
    }
    private fun sync() {
        val current=session ?: return
        if(busy||!active)return
        handler.removeCallbacks(tick); busy=true; val version=generation
        executor.execute {
            var updated=current
            var note=""
            var remove=false
            var delay=if(current.connected)60000L else 5000L
            try {
                val api=PairingApi()
                try {
                    val seen=api.heartbeat(current)
                    updated=current.copy(connected=true,code="",lastSeen=seen)
                    note="Check-in received. Your parent can see this device’s latest status."
                    delay=60000L
                    try {
                        api.reportPermissions(updated, PermissionSnapshot.report(this))
                        note="Check-in received. " + UsageSharing.sync(this,updated,api) + "\n" + ContentSharing.sync(this,updated,api)
                    } catch (_: Exception) {
                        note="Check-in received, but permissions or usage could not sync. We’ll retry at the next check-in."
                    }
                } catch(e:ApiFailure) {
                    if(e.status!=401)throw e
                    if(current.connected) { remove=true; note="This connection is no longer authorised. Ask your parent for a new pairing code." }
                    else {
                        if(System.currentTimeMillis()-current.startedAt>10*60*1000L)throw ApiFailure(404)
                        api.claim(current); note="Waiting for your parent. Compare the confirmation number on both screens."
                    }
                }
            } catch(e:ApiFailure) {
                if(e.status in listOf(400,404) && !current.connected) { remove=true; note="This pairing code is unavailable or expired. Ask your parent to create a new one." }
                else { note=if(e.status==429)"Too many attempts. Waiting before trying again." else "The server could not accept the check-in. We’ll retry while this app is open."; delay=60000L }
            } catch(_:Exception) { note="Can’t reach the parent server. Your saved connection is kept; we’ll retry while this app is open."; delay=15000L }
            runOnUiThread {
                if(isDestroyed||version!=generation)return@runOnUiThread
                busy=false
                try { if(remove) { UsageSharing.forget(this,current); ContentSharing.forget(this,current); storage.clear(); session=null } else { storage.save(updated); session=updated }; message=note }
                catch(_:Exception) { message="Could not save the connection securely. Close the app and try again." }
                render()
                if(active&&session!=null)handler.postDelayed(tick,delay)
            }
        }
    }
    private fun confirmForget() {
        AlertDialog.Builder(this).setTitle("Forget this connection?")
            .setMessage("This removes the saved key from this device and stops check-ins here. Your parent must also disconnect or cancel it in Sideby Parent to revoke access on the server.")
            .setNegativeButton("Keep connection",null).setPositiveButton("Forget") { _,_ ->
                generation++; handler.removeCallbacks(tick); session?.let { UsageSharing.forget(this,it); ContentSharing.forget(this,it) }; storage.clear(); session=null; busy=false; message="Connection removed from this device."; render()
            }.show()
    }
}
