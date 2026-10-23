import "server-only";
import { auth } from "./auth";
import { sql } from "./db";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function identity(request?: Request) {
  if (request && !["GET", "HEAD"].includes(request.method)) {
    if (
      request.headers.get("origin") !==
      (process.env.APP_ORIGIN || new URL(request.url).origin)
    )
      throw new HttpError(403, "Request origin not allowed.");
  }
  const { data: session } = await auth.getSession();
  if (!session?.user) throw new HttpError(401, "Please sign in to continue.");
  const expected = request?.headers.get("x-sideby-user");
  if (expected && expected !== session.user.id)
    throw new HttpError(401, "Your account changed. Reload to continue.");
  return session.user;
}
export async function family(userId: string) {
  const [f] =
    await sql`SELECT id,name,revision FROM sideby_families WHERE owner_id=${userId}`;
  if (!f) throw new HttpError(404, "Create your family first.");
  return f;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    if (e instanceof ZodError)
      return json({ error: e.issues[0]?.message || "Invalid input." }, 400);
    if (e instanceof SyntaxError)
      return json({ error: "Invalid request." }, 400);
    console.error(
      "Sideby service request failed",
      e instanceof Error ? e.name : "UnknownError",
    );
    return json({ error: "We couldn’t complete that. Please try again." }, 503);
  }
}
