import {
  authenticated,
  endpoint,
  response,
  sql,
  ApiError,
} from "../../../lib/core";
export async function GET(r: Request) {
  return endpoint(async () => {
    await authenticated();
    const page = Number(new URL(r.url).searchParams.get("page") || 1);
    if (!Number.isInteger(page) || page < 1 || page > 100000)
      throw new ApiError(400, "Invalid page");
    const rows =
      await sql()`SELECT id,name,email,category,subject,description,status,created_at FROM sideby_bug_reports ORDER BY created_at DESC,id DESC LIMIT 26 OFFSET ${(page - 1) * 25}`;
    return response({
      reports: rows.slice(0, 25),
      hasMore: rows.length > 25,
      page,
    });
  });
}
