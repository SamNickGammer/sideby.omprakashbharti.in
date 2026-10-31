// Retry durable deletion jobs. Does not inspect or delete active shared objects.
import { neon } from "@neondatabase/serverless";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
if(process.env.NEON_BRANCH!=="dev")throw new Error("Explicit dev environment required");
const sql=neon(process.env.DATABASE_URL),s3=new S3Client({forcePathStyle:true});
const jobs=await sql`SELECT object_key FROM sideby_content_gc WHERE NOT pending_upload OR created_at<now()-interval '30 minutes' LIMIT 100`;
let deleted=0;
for(const job of jobs){await s3.send(new DeleteObjectCommand({Bucket:process.env.STORAGE_BUCKET||"assets",Key:job.object_key}));await sql`DELETE FROM sideby_content_gc WHERE object_key=${job.object_key}`;deleted++}
console.log(`PASS ${deleted} queued storage deletions`);
