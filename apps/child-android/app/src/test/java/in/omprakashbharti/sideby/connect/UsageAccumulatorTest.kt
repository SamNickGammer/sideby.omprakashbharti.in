package `in`.omprakashbharti.sideby.connect
import org.junit.Assert.assertEquals
import org.junit.Test
class UsageAccumulatorTest {
    @Test fun clipsCrossMidnightAndOpenActivity() {
        val a=UsageAccumulator(1000,5000)
        a.event(500,1,"demo","A");a.event(2000,2,"demo","A")
        a.event(4000,1,"demo","A")
        assertEquals(mapOf("demo" to 2000L),a.finish())
    }
    @Test fun unionsOverlappingActivitiesPerApp() {
        val a=UsageAccumulator(0,10000)
        a.event(1000,1,"demo","A");a.event(2000,1,"demo","B")
        a.event(3000,2,"demo","A");a.event(4000,2,"demo","B")
        assertEquals(mapOf("demo" to 3000L),a.finish())
    }
    @Test fun screenLockAndRestartCloseSessions() {
        for(type in listOf(16,17,26,27)) {
            val a=UsageAccumulator(0,10000)
            a.event(1000,1,"demo","A");a.event(3000,type,null,"")
            a.event(6000,2,"demo","A")
            assertEquals(mapOf("demo" to 2000L),a.finish())
        }
    }
    @Test fun repeatedResumeAndStopDontDoubleCount() {
        val a=UsageAccumulator(0,10000)
        a.event(1000,1,"demo","A");a.event(2000,1,"demo","A")
        a.event(3000,2,"demo","A");a.event(3500,23,"demo","A")
        a.event(7000,2,"unknown","A")
        assertEquals(mapOf("demo" to 2000L),a.finish())
    }
    @Test fun separatesAppsAndIgnoresOutsideWindow() {
        val a=UsageAccumulator(1000,5000)
        a.event(0,1,"old","A");a.event(500,2,"old","A")
        a.event(1000,1,"one","A");a.event(2000,1,"two","A")
        a.event(6000,1,"late","A")
        assertEquals(mapOf("one" to 4000L,"two" to 3000L),a.finish())
    }
}
