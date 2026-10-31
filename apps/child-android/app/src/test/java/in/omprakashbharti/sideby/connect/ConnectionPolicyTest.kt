package `in`.omprakashbharti.sideby.connect
import org.junit.Assert.*
import org.junit.Test
class ConnectionPolicyTest {
    @Test fun releaseRejectsLocalHttp() { assertThrows(IllegalArgumentException::class.java) { ConnectionPolicy.origin("http://127.0.0.1:3000",false) } }
    @Test fun debugOnlyAllowsExplicitLocalHosts() {
        assertEquals("http://127.0.0.1:3000",ConnectionPolicy.origin("http://127.0.0.1:3000/",true))
        for(url in listOf("http://example.com","http://127.0.0.1.evil.com","http://192.168.1.10:3000","https://user:pass@example.com","https://example.com/path","https://example.com?credential=a","https://example.com#token","https://example.com:99999")) assertThrows(url,IllegalArgumentException::class.java) { ConnectionPolicy.origin(url,true) }
    }
    @Test fun acceptsHttpsOrigin() { assertEquals("https://parent.example.com",ConnectionPolicy.origin("https://parent.example.com/",false)) }
    @Test fun normalizesCodesAndRejectsMalformed() {
        assertEquals("0123456789ABCDEF",ConnectionPolicy.code("0123-4567 89ab-cdef"))
        assertThrows(IllegalArgumentException::class.java) { ConnectionPolicy.code("0123-4567-89AB-CDEG") }
    }
    @Test fun credentialsAreRandomAndMatchContract() {
        val values=(1..50).map { ConnectionPolicy.credential() }
        assertEquals(50,values.toSet().size)
        assertTrue(values.all { it.matches(Regex("[0-9a-f]{64}")) })
        assertEquals("86602061",ConnectionPolicy.fingerprint("0".repeat(64)))
    }
}
