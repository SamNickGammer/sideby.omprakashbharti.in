package `in`.omprakashbharti.sideby.connect

import android.app.Activity
import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import java.util.concurrent.Executors

/** Visible, optional setup. Usage collection requires explicit sharing opt-in and Android Usage Access. */
class PermissionActivity : Activity() {
    private val executor = Executors.newSingleThreadExecutor()
    private var busy = false
    private var rerun = false
    private var note = "Checking the permissions on this device…"
    private lateinit var status: TextView
    private lateinit var refresh: Button
    private fun dp(n: Int) = (n * resources.displayMetrics.density).toInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (!BuildConfig.DEBUG) window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
    override fun onResume() {
        super.onResume()
        render()
        syncStatus()
    }
    override fun onDestroy() { executor.shutdownNow(); super.onDestroy() }

    private fun render() {
        val scroll = ScrollView(this).apply { setBackgroundColor(Color.rgb(251,252,248)) }
        val body = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(24), dp(24), dp(32))
        }
        scroll.addView(body)
        scroll.setOnApplyWindowInsetsListener { view, insets ->
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                val bars = insets.getInsets(android.view.WindowInsets.Type.systemBars())
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            } else {
                @Suppress("DEPRECATION")
                view.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop, insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
            }
            insets
        }
        fun label(value: String, size: Float = 14f, color: Int = Color.rgb(24,61,56)): TextView {
            val text = TextView(this).apply {
                text = value; textSize = size; setTextColor(color)
                setPadding(0, dp(8), 0, dp(8))
            }
            body.addView(text)
            return text
        }
        fun button(value: String, action: () -> Unit): Button {
            val button = Button(this).apply {
                text = value; isAllCaps = false; minHeight = dp(52)
                setOnClickListener { action() }
            }
            body.addView(button, LinearLayout.LayoutParams(-1, -2))
            return button
        }
        button("Back to connection") { finish() }
        label("Your permissions", 28f).typeface = Typeface.DEFAULT_BOLD
        label("You choose access on this device. Pairing works without Usage Access. Your parent sees permission status, not proof that phone data is being shared.")
        status = label(note, 13f)
        refresh = button("Refresh and send status") { syncStatus() }.apply { isEnabled = !busy }
        val states = PermissionSnapshot.states(this)
        val keys = listOf("internet", "usage") + states.keys.filter { it != "internet" && it != "usage" }
        for (key in keys) {
            val state = states.getValue(key)
            val granted = state == "granted"
            val description = when(state) {
                "granted" -> "Granted"
                "not_granted" -> "Not allowed · optional"
                else -> "Not available in this version"
            }
            label("${PermissionSnapshot.labels[key]}\n$description", 16f,
                if(granted) Color.rgb(40,101,79) else if(state == "not_granted") Color.rgb(137,83,20) else Color.rgb(97,115,106))
            if (key == "internet") label("Android grants Internet access at installation. There is no permission popup for it.", 12f)
            if (key == "usage") {
                label("Optional setup for digital wellbeing. Android Usage Access can allow reading app activity. With usage sharing enabled below, Sideby shares today’s app names, package identifiers and estimated foreground time while this app is open. No message content or browsing history is shared.", 12f)
                button(if(granted) "Manage Usage Access" else "Set up Usage Access") { explainUsage() }
                val session = try { SecureSession(this).load() } catch (_: Exception) { null }
                if (session?.connected == true) {
                    val enabled = UsageSharing.enabled(this,session)
                    label(if(enabled) "Usage sharing is ON" else "Usage sharing is OFF", 14f)
                    button(if(enabled) "Stop usage sharing" else "Enable usage sharing") {
                        AlertDialog.Builder(this).setTitle(if(enabled) "Stop usage sharing?" else "Share today's app usage?")
                            .setMessage(if(enabled) "Stops collection now and clears the latest server snapshot when this device next connects. If offline, the parent may still see the old snapshot until then." else "Your paired parent will see today's app names, package identifiers, estimated foreground time and device timezone. Android Usage Access is also needed. Sync runs while Sideby is open. The server keeps only the latest snapshot. You can stop here at any time.")
                            .setNegativeButton("Cancel",null)
                            .setPositiveButton(if(enabled) "Stop sharing" else "Enable sharing") { _,_ ->
                                UsageSharing.setEnabled(this,session,!enabled)
                                render(); syncStatus()
                            }.show()
                    }.isEnabled = !busy
                }
            }
        }
        label("Unavailable features cannot be enabled here. Screen sharing will require consent for each session. Accessibility and device admin are not required for this setup.", 12f)
        setContentView(scroll)
    }

    private fun explainUsage() {
        AlertDialog.Builder(this).setTitle("Optional Usage Access")
            .setMessage("Android will open a settings page where you can allow or remove access to app-usage information. Permission status is shared with your parent. App usage is shared only if you separately enable usage sharing in Sideby. You may skip this step and stay paired.")
            .setNegativeButton("Not now", null)
            .setPositiveButton("Open Android settings") { _, _ ->
                try {
                    startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.parse("package:$packageName")))
                } catch (_: ActivityNotFoundException) {
                    try { startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }
                    catch (_: ActivityNotFoundException) {
                        note = "Usage Access settings are unavailable on this device. Your connection still works."
                        render()
                    }
                }
            }.show()
    }

    private fun syncStatus() {
        if (busy) { rerun = true; return }
        val session = try { SecureSession(this).load() } catch (_: Exception) { null }
        if (session == null || !session.connected) {
            note = "Pair and get parent approval before sending permission status."
            status.text = note
            return
        }
        busy = true
        refresh.isEnabled = false
        status.text = "Sending current permission status…"
        executor.execute {
            val result = try {
                val api = PairingApi()
                api.reportPermissions(session, PermissionSnapshot.report(this))
                "Permission status sent. " + UsageSharing.sync(this,session,api)
            } catch (_: Exception) {
                "Permissions or usage could not be sent. Check your connection and tap Refresh. Your saved pairing is unchanged."
            }
            runOnUiThread {
                if (isDestroyed || isFinishing) return@runOnUiThread
                busy = false
                note = result
                render()
                if (rerun) { rerun = false; syncStatus() }
            }
        }
    }
}
