import {
  body,
  endpoint,
  limit,
  login,
  origin,
  response,
  source,
} from "../../../lib/core";
import { credentials } from "../../../lib/schema";
export async function POST(r: Request) {
  return endpoint(async () => {
    origin(r);
    await limit("login:" + source(r), 10, 900);
    await limit("login:account", 50, 900);
    const v = credentials.parse(await body(r, 2048));
    await login(v.email, v.password);
    return response({ ok: true });
  });
}
