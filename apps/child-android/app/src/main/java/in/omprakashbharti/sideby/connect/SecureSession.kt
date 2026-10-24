package `in`.omprakashbharti.sideby.connect

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import org.json.JSONObject
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

data class Session(val origin: String, val credential: String, val code: String, val name: String, val connected: Boolean = false, val lastSeen: String = "", val startedAt: Long = System.currentTimeMillis())

class SecureSession(context: Context) {
    private val prefs = context.getSharedPreferences("connection", Context.MODE_PRIVATE)
    private val alias = "sideby_connection_v1"
    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(alias, null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
            init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
        }.generateKey()
    }
    fun save(s: Session) {
        val json = JSONObject().put("origin",s.origin).put("credential",s.credential).put("code",s.code).put("name",s.name).put("connected",s.connected).put("lastSeen",s.lastSeen).put("startedAt",s.startedAt)
        val cipher=Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE,key()) }
        val encrypted=cipher.doFinal(json.toString().toByteArray(Charsets.UTF_8))
        check(prefs.edit().putString("value",Base64.encodeToString(cipher.iv+encrypted,Base64.NO_WRAP)).commit()) { "Could not save connection securely." }
    }
    fun load(): Session? {
        val encoded=prefs.getString("value",null) ?: return null
        val data=Base64.decode(encoded,Base64.NO_WRAP)
        require(data.size>28)
        val cipher=Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.DECRYPT_MODE,key(),GCMParameterSpec(128,data.copyOfRange(0,12))) }
        val j=JSONObject(String(cipher.doFinal(data.copyOfRange(12,data.size)),Charsets.UTF_8))
        return Session(j.getString("origin"),j.getString("credential"),j.getString("code"),j.getString("name"),j.getBoolean("connected"),j.getString("lastSeen"),j.getLong("startedAt"))
    }
    fun clear() { check(prefs.edit().clear().commit()) }
}
