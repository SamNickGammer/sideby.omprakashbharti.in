package `in`.omprakashbharti.sideby.connect

import java.net.URI
import java.security.MessageDigest
import java.security.SecureRandom

object ConnectionPolicy {
    fun origin(input: String, debug: Boolean): String {
        val uri = try { URI(input.trim()) } catch (_: Exception) { throw IllegalArgumentException("Enter a valid server address.") }
        val local = uri.host in setOf("localhost", "127.0.0.1", "10.0.2.2")
        require(uri.scheme == "https" || (debug && local && uri.scheme == "http")) { "Use HTTPS, or a local development address in the debug app." }
        require(!uri.host.isNullOrBlank() && uri.userInfo == null && uri.query == null && uri.fragment == null && uri.path in listOf("", "/") && (uri.port == -1 || uri.port in 1..65535)) { "Enter only the server origin, without a path, password or query." }
        return input.trim().trimEnd('/')
    }
    fun code(input: String): String {
        val value = input.replace("-", "").replace(" ", "").uppercase()
        require(value.matches(Regex("[0-9A-F]{16}"))) { "Enter the full 16-character pairing code." }
        return value
    }
    fun credential(): String = ByteArray(32).also { SecureRandom().nextBytes(it) }.joinToString("") { "%02x".format(it) }
    fun fingerprint(credential: String): String = MessageDigest.getInstance("SHA-256").digest("verify:$credential".toByteArray(Charsets.UTF_8)).take(4).joinToString("") { "%02X".format(it) }
}
