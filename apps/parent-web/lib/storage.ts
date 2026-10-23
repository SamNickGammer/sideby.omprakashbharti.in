import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
export const s3 = new S3Client({ forcePathStyle: true });
export const bucket = process.env.STORAGE_BUCKET || "assets";
