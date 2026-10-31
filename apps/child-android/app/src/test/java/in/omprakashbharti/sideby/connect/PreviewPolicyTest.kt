package `in`.omprakashbharti.sideby.connect
import org.junit.Assert.*
import org.junit.Test
class PreviewPolicyTest {
 @Test fun requiresAllGates(){assertFalse(PreviewPolicy.allowed("a",setOf("a"),false,true));assertFalse(PreviewPolicy.allowed("a",setOf("a"),true,false));assertFalse(PreviewPolicy.allowed("b",setOf("a"),true,true));assertTrue(PreviewPolicy.allowed("a",setOf("a"),true,true))}
 @Test fun protectsCodes(){listOf("Your code is 123456","OTP incoming","Reset your PASSWORD","Verification code").forEach{assertTrue(PreviewPolicy.sensitive(it))}}
 @Test fun allowsOrdinaryPreview(){assertFalse(PreviewPolicy.sensitive("Meet at the park"))}
}
