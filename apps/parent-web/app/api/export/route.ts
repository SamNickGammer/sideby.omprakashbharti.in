import { GET as getFamily } from "../family/route";
export async function GET() {
  const res = await getFamily();
  if (!res.ok) return res;
  return new Response(JSON.stringify(await res.json(), null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=sideby-family.json",
      "Cache-Control": "no-store",
    },
  });
}
