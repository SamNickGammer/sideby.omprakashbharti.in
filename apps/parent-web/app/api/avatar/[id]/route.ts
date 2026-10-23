import {
  identity,
  handle,
  family,
  HttpError,
  json,
} from "../../../../lib/http";
import { sql } from "../../../../lib/db";
import { idSchema } from "../../../../lib/validation";
import { s3, bucket } from "../../../../lib/storage";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
async function owner(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await identity(req);
  const f = await family(u.id);
  const id = idSchema.parse((await ctx.params).id);
  const [c] =
    await sql`SELECT id,avatar_key FROM sideby_children WHERE id=${id} AND family_id=${f.id}`;
  if (!c) throw new HttpError(404, "Profile not found.");
  return { f, c };
}
export const POST = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const { f, c } = await owner(req, ctx);
    if (Number(req.headers.get("content-length")) > 2200000)
      throw new HttpError(400, "Use an image smaller than 2 MB.");
    const form = await req.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 2097152 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw new HttpError(400, "Choose a JPEG, PNG or WebP image under 2 MB.");
    let body: Buffer;
    try {
      body = await sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 16000000,
      })
        .rotate()
        .resize(256, 256, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      throw new HttpError(400, "That image could not be read.");
    }
    const key = `families/${f.id}/${c.id}/${crypto.randomUUID()}.webp`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "image/webp",
      }),
    );
    try {
      await sql.transaction([
        sql`UPDATE sideby_children SET avatar_key=${key} WHERE id=${c.id} AND family_id=${f.id}`,
        sql`UPDATE sideby_families SET revision=revision+1 WHERE id=${f.id}`,
      ]);
    } catch (e) {
      await s3
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        .catch(() => {});
      throw e;
    }
    if (c.avatar_key)
      await s3
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: c.avatar_key }))
        .catch(() => {});
    return json({ ok: true });
  });
export const GET = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const { c } = await owner(req, ctx);
    if (!c.avatar_key) throw new HttpError(404, "No profile photo.");
    const obj = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: c.avatar_key }),
    );
    return new Response((await obj.Body!.transformToByteArray()) as BodyInit, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
