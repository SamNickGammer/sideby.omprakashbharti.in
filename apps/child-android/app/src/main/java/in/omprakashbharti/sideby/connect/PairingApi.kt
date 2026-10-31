package `in`.omprakashbharti.sideby.connect

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI

class ApiFailure(val status: Int): Exception("Request failed")
class PairingApi {
    private fun request(s: Session, path: String, body: JSONObject? = null): JSONObject {
        ConnectionPolicy.origin(s.origin,BuildConfig.DEBUG)
        val connection=URI(s.origin+path).toURL().openConnection() as HttpURLConnection
        try {
            connection.instanceFollowRedirects=false
            connection.requestMethod="POST"
            connection.connectTimeout=8000
            connection.readTimeout=8000
            connection.useCaches=false
            connection.setRequestProperty("Accept","application/json")
            if(body!=null) {
                connection.doOutput=true
                connection.setRequestProperty("Content-Type","application/json")
                connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            } else connection.setRequestProperty("Authorization","Bearer ${s.credential}")
            val status=connection.responseCode
            if(status !in 200..299) throw ApiFailure(status)
            val text=connection.inputStream.bufferedReader().use { reader ->
                val buffer=CharArray(1024)
                val result=StringBuilder()
                while(true) {
                    val count=reader.read(buffer)
                    if(count<0)break
                    require(result.length+count<=8192) { "Response too large" }
                    result.append(buffer,0,count)
                }
                result.toString()
            }
            return JSONObject(text)
        } finally { connection.disconnect() }
    }
    fun claim(s: Session) {
        val result=request(s,"/api/device/claim",JSONObject().put("code",s.code).put("credential",s.credential).put("name",s.name).put("platform","android"))
        require(result.getString("status") in listOf("pending","approved") && result.getString("verification")==ConnectionPolicy.fingerprint(s.credential)) { "Unexpected pairing response" }
    }
    fun heartbeat(s: Session): String {
        val result=request(s,"/api/device/heartbeat")
        require(result.getString("status")=="connected")
        return result.getString("server_time")
    }
}
