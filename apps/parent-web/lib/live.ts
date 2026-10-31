import "server-only";
import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
} from "livekit-server-sdk";
import { z } from "zod";
import { sql } from "./db";
import { HttpError } from "./http";
import { digest } from "./pairing";

export const startLiveSchema = z
  .object({
    device_id: z.uuid(),
    kind: z.enum(["screen", "camera", "audio"]),
    lens: z.enum(["front", "back"]).optional(),
  })
  .strict()
  .refine(
    (v) => !v.lens || v.kind === "camera",
    "Lens requires a camera session.",
  );
export const parentLiveSchema = z
  .object({
    action: z.enum(["poll", "join", "stop", "lens"]),
    lens: z.enum(["front", "back"]).optional(),
  })
  .strict()
  .refine(
    (v) => (v.action === "lens" ? !!v.lens : !v.lens),
    "Lens is only valid with lens action.",
  );
export const deviceLiveSchema = z
  .object({
    action: z.enum(["approve", "join", "decline", "stop", "pulse"]),
    lens: z.enum(["front", "back"]).optional(),
  })
  .strict()
  .refine(
    (v) => !v.lens || v.action === "pulse",
    "Lens is only valid with pulse.",
  );
export function mediaService() {
  for (const key of ["LIVEKIT_URL", "LIVEKIT_DEVICE_URL", "LIVEKIT_API_URL"]) {
    const raw =
      process.env[key] ||
      (key === "LIVEKIT_DEVICE_URL" ? process.env.LIVEKIT_URL : undefined);
    if (!raw) throw new HttpError(503, "Live sharing is not configured.");
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new HttpError(503, "Invalid media configuration.");
    }
    const secure = key === "LIVEKIT_API_URL" ? "https:" : "wss:";
    const local =
      process.env.NEON_BRANCH === "dev" &&
      ["127.0.0.1", "localhost", "10.0.2.2"].includes(url.hostname) &&
      url.protocol === (key === "LIVEKIT_API_URL" ? "http:" : "ws:");
    if (
      (!local && url.protocol !== secure) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new HttpError(
        503,
        "Live sharing requires a secure media endpoint.",
      );
  }

  if (
    !process.env.LIVEKIT_API_URL ||
    !process.env.LIVEKIT_API_KEY ||
    !process.env.LIVEKIT_API_SECRET
  )
    throw new HttpError(503, "Live sharing is not configured.");
  return new RoomServiceClient(
    process.env.LIVEKIT_API_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  );
}
const open = ["pending", "approved", "active"];
export function publicSession(s: Record<string, unknown> | undefined) {
  if (!s) return null;
  return Object.fromEntries(
    [
      "id",
      "device_id",
      "kind",
      "status",
      "desired_lens",
      "actual_lens",
      "created_at",
      "expires_at",
    ].map((k) => [k, s[k]]),
  );
}
async function ready() {
  mediaService();
  const [r] =
    await sql`SELECT seen_at>now()-interval '8 seconds' AS ready FROM sideby_live_supervisor WHERE id=true`;
  if (!r?.ready)
    throw new HttpError(
      503,
      "Live sharing service is offline. Try again shortly.",
    );
}
export async function expireSessions() {
  await sql`UPDATE sideby_live_sessions s SET status='expired',ended_at=now() FROM sideby_devices d,sideby_children c
 WHERE s.device_id=d.id AND d.child_id=c.id AND s.status IN ('pending','approved','active') AND
 (s.expires_at<=now() OR s.parent_seen<now()-interval '20 seconds' OR (s.status<>'pending' AND s.device_seen<now()-interval '20 seconds') OR d.revoked_at IS NOT NULL OR d.credential_expires_at<=now() OR c.archived)`;
}
export async function liveDevice(req: Request) {
  const token = req.headers
    .get("authorization")
    ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new HttpError(401, "Device is not authorized.");
  const [d] =
    await sql`SELECT d.id FROM sideby_devices d JOIN sideby_children c ON c.id=d.child_id WHERE d.credential_hash=${digest(token)} AND d.revoked_at IS NULL AND d.credential_expires_at>now() AND NOT c.archived`;
  if (!d) throw new HttpError(401, "Device is not authorized.");
  return d.id as string;
}
export async function liveSnapshot(child: string) {
  await expireSessions();
  const devices =
    await sql`SELECT d.id,d.name,d.last_seen_at FROM sideby_devices d JOIN sideby_children c ON c.id=d.child_id WHERE d.child_id=${child} AND NOT c.archived AND d.revoked_at IS NULL AND d.credential_expires_at>now() ORDER BY d.created_at DESC`;
  const sessions =
    await sql`SELECT DISTINCT ON(s.device_id) s.* FROM sideby_live_sessions s JOIN sideby_devices d ON d.id=s.device_id WHERE d.child_id=${child} ORDER BY s.device_id,s.created_at DESC`;
  return { devices, sessions: sessions.map(publicSession) };
}
export async function startLive(
  child: string,
  input: z.infer<typeof startLiveSchema>,
) {
  await ready();
  await expireSessions();
  // Serialize requests on the device row, including the rolling request budget.
  const [s] =
    await sql`WITH device AS MATERIALIZED (SELECT d.id FROM sideby_devices d JOIN sideby_children c ON c.id=d.child_id WHERE d.id=${input.device_id} AND d.child_id=${child} AND NOT c.archived AND d.revoked_at IS NULL AND d.credential_expires_at>now() FOR UPDATE OF d), inserted AS (
 INSERT INTO sideby_live_sessions(device_id,kind,desired_lens) SELECT id,${input.kind},${input.lens || "front"} FROM device
 WHERE (SELECT count(*) FROM sideby_live_sessions WHERE device_id=${input.device_id} AND created_at>now()-interval '1 hour')<10
 ON CONFLICT DO NOTHING RETURNING *) SELECT row_to_json(inserted) AS session FROM inserted`;
  if (!s)
    throw new HttpError(
      409,
      "Device unavailable, a session is already open, or the hourly request limit was reached.",
    );
  return { session: publicSession(s.session) };
}
async function session(id: string, child?: string, device?: string) {
  await expireSessions();
  const [s] =
    await sql`SELECT s.* FROM sideby_live_sessions s JOIN sideby_devices d ON d.id=s.device_id WHERE s.id=${id} AND (${child || null}::uuid IS NULL OR d.child_id=${child || null}::uuid) AND (${device || null}::uuid IS NULL OR d.id=${device || null}::uuid)`;
  if (!s) throw new HttpError(404, "Session not found.");
  return s;
}
async function stop(id: string, state = "ended") {
  await sql`UPDATE sideby_live_sessions SET status=${state},ended_at=now() WHERE id=${id} AND status IN ('pending','approved','active')`;
  try {
    await mediaService().deleteRoom("sideby-" + id);
  } catch {
    /* Supervisor retries room removal; terminal state never grants tokens. */
  }
}
async function join(s: Record<string, unknown>, publisher: boolean) {
  await ready();
  if (!["approved", "active"].includes(String(s.status)))
    throw new HttpError(409, "This session is not approved or has ended.");
  const service = mediaService(),
    room = "sideby-" + s.id;
  await service.createRoom({
    name: room,
    emptyTimeout: 10,
    departureTimeout: 5,
    maxParticipants: 2,
  });
  // Check again after provider IO, so a concurrent stop does not knowingly issue credentials.
  const fresh = await session(String(s.id));
  if (!["approved", "active"].includes(fresh.status))
    throw new HttpError(409, "Session ended.");
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: publisher ? "device" : "parent", ttl: 15 },
  );
  token.addGrant({
    room,
    roomJoin: true,
    canPublish: publisher,
    canSubscribe: !publisher,
    canPublishData: false,
    canUpdateOwnMetadata: false,
    ...(publisher
      ? {
          canPublishSources: [
            s.kind === "screen"
              ? TrackSource.SCREEN_SHARE
              : s.kind === "camera"
                ? TrackSource.CAMERA
                : TrackSource.MICROPHONE,
          ],
        }
      : {}),
  });
  const url = publisher
    ? process.env.LIVEKIT_DEVICE_URL || process.env.LIVEKIT_URL
    : process.env.LIVEKIT_URL;
  if (!url) throw new HttpError(503, "Live sharing URL is not configured.");
  return { session: publicSession(fresh), url, token: await token.toJwt() };
}
export async function parentLive(
  child: string,
  id: string,
  input: z.infer<typeof parentLiveSchema>,
) {
  let s = await session(id, child);
  if (input.action === "stop") {
    await stop(id);
    return { session: publicSession(await session(id, child)) };
  }
  if (!open.includes(s.status)) return { session: publicSession(s) };
  await ready();
  if (
    input.action === "lens" &&
    (s.kind !== "camera" || s.status === "pending")
  )
    throw new HttpError(409, "No active camera session.");
  await sql`UPDATE sideby_live_sessions SET parent_seen=now(),desired_lens=CASE WHEN ${input.action}='lens' THEN ${input.lens || "front"} ELSE desired_lens END WHERE id=${id} AND status IN ('pending','approved','active')`;
  s = await session(id, child);
  return input.action === "join"
    ? join(s, false)
    : { session: publicSession(s) };
}
export async function pollDevice(device: string) {
  await ready();
  await expireSessions();
  const [s] =
    await sql`SELECT * FROM sideby_live_sessions WHERE device_id=${device} AND status IN ('pending','approved','active') ORDER BY created_at DESC LIMIT 1`;
  return { session: publicSession(s) };
}
export async function deviceLive(
  device: string,
  id: string,
  input: z.infer<typeof deviceLiveSchema>,
) {
  let s = await session(id, undefined, device);
  if (input.action === "stop" || input.action === "decline") {
    await stop(id, input.action === "decline" ? "declined" : "ended");
    return { session: publicSession(await session(id, undefined, device)) };
  }
  await ready();
  if (input.action === "approve") {
    const [approved] =
      await sql`UPDATE sideby_live_sessions SET status='approved',expires_at=now()+interval '5 minutes',device_seen=now() WHERE id=${id} AND status='pending' AND expires_at>now() AND parent_seen>now()-interval '20 seconds' RETURNING *`;
    if (!approved)
      throw new HttpError(409, "Request expired or already answered.");
    s = approved;
  } else if (input.action === "pulse") {
    if (input.lens && s.kind !== "camera")
      throw new HttpError(400, "Lens requires camera.");
    await sql`UPDATE sideby_live_sessions SET device_seen=now(),status='active',actual_lens=${input.lens || null} WHERE id=${id} AND status IN ('approved','active')`;
    s = await session(id, undefined, device);
  }
  return input.action === "join"
    ? join(s, true)
    : { session: publicSession(s) };
}
