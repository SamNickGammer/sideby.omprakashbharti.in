package `in`.omprakashbharti.sideby.connect

object PreviewPolicy {
    fun sensitive(text:String)=Regex("\\b\\d{4,8}\\b|\\botp\\b|verification code|password|passcode",RegexOption.IGNORE_CASE).containsMatchIn(text)
    fun allowed(source:String,sources:Set<String>,enabled:Boolean,screenVisible:Boolean)=enabled&&screenVisible&&source in sources
}
