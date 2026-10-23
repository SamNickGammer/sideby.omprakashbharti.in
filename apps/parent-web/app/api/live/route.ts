import { identity, handle, json, family, HttpError } from "../../../lib/http";
import { createRealtime, rawSql } from "@neon/realtime/server";
export const GET = (req: Request) =>
  handle(async () => {
    const u = await identity();
    if (new URL(req.url).searchParams.get("userId") !== u.id)
      throw new HttpError(401, "Your account changed. Sign in again.");
    await family(u.id);
    const realtime = createRealtime({
      secret: process.env.NEON_REALTIME_SECRET!,
      db: new URL(process.env.DATABASE_URL!).pathname.slice(1),
    });
    const sealed = await realtime.seal({
      query: rawSql<{ id: string; revision: number }>(
        "SELECT id,revision FROM sideby_families WHERE owner_id = $1",
        [u.id],
      ),
    });
    return json({ sealed, url: process.env.NEON_REALTIME_URL });
  });
