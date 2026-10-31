import {
  ApiError,
  body,
  endpoint,
  limit,
  origin,
  required,
  response,
  source,
  sql,
} from "../../../../lib/core";
import { bug } from "../../../../lib/schema";
export async function OPTIONS(r: Request) {
  return endpoint(async () => {
    origin(r, true);
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": required("WEBSITE_ORIGIN"),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      },
    });
  }, true);
}
export async function POST(r: Request) {
  return endpoint(async () => {
    origin(r, true);
    await limit("bug:" + source(r), 5, 3600);
    const v = bug.parse(await body(r, 10000));
    if (v.website) throw new ApiError(400, "Unable to submit this report.");
    const rows =
      await sql()`INSERT INTO sideby_bug_reports(name,email,category,subject,description) VALUES (${v.name},${v.email},${v.category},${v.subject},${v.description}) RETURNING id`;
    return response({ reference: rows[0].id }, 201, true);
  }, true);
}
