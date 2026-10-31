import { endpoint, logout, origin, response } from "../../../lib/core";
export async function POST(r: Request) {
  return endpoint(async () => {
    origin(r);
    await logout();
    return response({ ok: true });
  });
}
