package `in`.omprakashbharti.sideby.connect

/** Per-package union of resumed activity intervals; never sums overlapping activities twice. */
class UsageAccumulator(private val start: Long, private val end: Long) {
    private val active = mutableMapOf<String, MutableSet<String>>()
    private val opened = mutableMapOf<String, Long>()
    private val totals = mutableMapOf<String, Long>()
    fun event(time: Long, type: Int, pkg: String?, activity: String) {
        if (time > end) return
        // Screen off, keyguard shown, runtime shutdown/startup end foreground intervals.
        if (type in setOf(16,17,26,27)) {
            opened.keys.toList().forEach { close(it,time) }; active.clear(); return
        }
        if (pkg.isNullOrBlank()) return
        if (type == 1) {
            val set = active.getOrPut(pkg) { mutableSetOf() }
            if (set.isEmpty()) opened[pkg] = time
            set.add(activity)
        } else if (type == 2 || type == 23) {
            val set = active[pkg] ?: return
            set.remove(activity)
            if (set.isEmpty()) { close(pkg,time); active.remove(pkg) }
        }
    }
    private fun close(pkg: String, time: Long) {
        val from = opened.remove(pkg) ?: return
        val duration = (minOf(time,end)-maxOf(from,start)).coerceAtLeast(0)
        if (duration > 0) totals[pkg] = (totals[pkg] ?: 0)+duration
    }
    fun finish(): Map<String,Long> {
        opened.keys.toList().forEach { close(it,end) }
        active.clear()
        return totals.toMap()
    }
}
