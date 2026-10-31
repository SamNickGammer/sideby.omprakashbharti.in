// Required long-running control-plane worker. Never log tokens or participant data.
import { neon } from "@neondatabase/serverless";
import { RoomServiceClient } from "livekit-server-sdk";
if (!process.env.DATABASE_URL || !process.env.LIVEKIT_API_URL)
  throw Error("Missing live service configuration");
const sql = neon(process.env.DATABASE_URL);
const media = new RoomServiceClient(
  process.env.LIVEKIT_API_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET,
);
let stopped = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    stopped = true;
  });
console.log("Live supervisor starting");
while (!stopped) {
  try {
    await sql`UPDATE sideby_live_sessions s SET status='expired',ended_at=now() FROM sideby_devices d,sideby_children c WHERE s.device_id=d.id AND d.child_id=c.id AND s.status IN ('pending','approved','active') AND (s.expires_at<=now() OR s.parent_seen<now()-interval '20 seconds' OR (s.status<>'pending' AND s.device_seen<now()-interval '20 seconds') OR d.revoked_at IS NOT NULL OR d.credential_expires_at<=now() OR c.archived)`;
    const active =
      await sql`SELECT id FROM sideby_live_sessions WHERE status IN ('approved','active')`;
    const allowed = new Set(active.map((s) => "sideby-" + s.id));
    const rooms = await media.listRooms();
    for (const room of rooms)
      if (room.name.startsWith("sideby-") && !allowed.has(room.name))
        await media.deleteRoom(room.name);
    await sql`DELETE FROM sideby_live_sessions WHERE created_at<now()-interval '7 days' AND status IN ('ended','declined','expired')`;
    await sql`INSERT INTO sideby_live_supervisor(id,seen_at) VALUES(true,now()) ON CONFLICT(id) DO UPDATE SET seen_at=now()`;
  } catch {
    console.error(
      "Live supervisor check failed; new sessions fail closed when heartbeat expires.",
    );
  }
  await new Promise((r) => setTimeout(r, 2000));
}
await sql`DELETE FROM sideby_live_supervisor WHERE id=true`;
