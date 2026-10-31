import "server-only";
import { neon } from "@neondatabase/serverless";
import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
const scrypt = promisify(scryptCallback);
export const sql = () => neon(required("DATABASE_URL"));
export function required(key: string) {
  const value = process.env[key];
  if (!value) throw new Error("Server configuration unavailable");
  return value;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const cookieName =
  process.env.NODE_ENV === "production"
    ? "__Host-sideby_admin"
    : "sideby_admin";
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function authenticated() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new ApiError(401, "Please sign in.");
  const rows =
    await sql()`SELECT token_hash FROM sideby_admin_sessions WHERE token_hash=${digest(token)} AND expires_at>now()`;
  if (!rows.length) throw new ApiError(401, "Please sign in.");
}
export function origin(request: Request, publicRoute = false) {
  const expected = required(publicRoute ? "WEBSITE_ORIGIN" : "ADMIN_ORIGIN");
  if (
    !["GET", "OPTIONS"].includes(request.method) &&
    !request.headers.get("content-type")?.startsWith("application/json")
  )
    throw new ApiError(415, "JSON required.");
  if (request.headers.get("origin") !== expected)
    throw new ApiError(403, "Request origin not allowed.");
}
export async function body(request: Request, max = 70000) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError(415, "JSON required.");
  if (Number(request.headers.get("content-length") || 0) > max)
    throw new ApiError(413, "Request too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Request body required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new ApiError(413, "Request too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "Invalid JSON.");
  }
}
export function source(request: Request) {
  // Vercel overwrites x-vercel-forwarded-for. Never trust client-supplied x-forwarded-for.
  const address = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : "local";
  return createHmac("sha256", required("ADMIN_RATE_SECRET"))
    .update(address || "unknown")
    .digest("hex");
}
export async function limit(key: string, max: number, seconds: number) {
  const rows =
    await sql()`INSERT INTO sideby_admin_limits(key,count,expires_at) VALUES (${key},1,now()+make_interval(secs=>${seconds})) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN sideby_admin_limits.expires_at<=now() THEN 1 ELSE sideby_admin_limits.count+1 END, expires_at=CASE WHEN sideby_admin_limits.expires_at<=now() THEN EXCLUDED.expires_at ELSE sideby_admin_limits.expires_at END RETURNING count`;
  if (rows[0].count > max)
    throw new ApiError(429, "Too many requests. Please try again later.");
}
export async function login(email: string, password: string) {
  const parts = required("ADMIN_PASSWORD_HASH").split(":");
  if (
    parts.length !== 2 ||
    !/^[a-f0-9]{32}$/.test(parts[0]) ||
    !/^[a-f0-9]{128}$/.test(parts[1])
  )
    throw new Error("Invalid credential configuration");
  const actual = (await scrypt(password, parts[0], 64)) as Buffer;
  const valid = timingSafeEqual(actual, Buffer.from(parts[1], "hex"));
  if (!valid || email.toLowerCase() !== required("ADMIN_EMAIL").toLowerCase())
    throw new ApiError(401, "Email or password is incorrect.");
  const token = randomBytes(32).toString("hex");
  await sql()`INSERT INTO sideby_admin_sessions(token_hash,expires_at) VALUES (${digest(token)},now()+interval '8 hours')`;
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 28800,
  });
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token)
    await sql()`DELETE FROM sideby_admin_sessions WHERE token_hash=${digest(token)}`;
  jar.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
export function response(data: unknown, status = 200, publicRoute = false) {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (publicRoute) {
    headers["Access-Control-Allow-Origin"] = required("WEBSITE_ORIGIN");
    headers.Vary = "Origin";
  }
  return Response.json(data, { status, headers });
}
export async function endpoint(
  run: () => Promise<Response>,
  publicRoute = false,
) {
  try {
    return await run();
  } catch (e) {
    if (e instanceof ApiError)
      return response({ error: e.message }, e.status, publicRoute);
    if (e instanceof Error && e.name === "ZodError")
      return response(
        { error: "Please check the submitted fields." },
        400,
        publicRoute,
      );
    return response(
      { error: "Service unavailable. Please try again." },
      503,
      publicRoute,
    );
  }
}
