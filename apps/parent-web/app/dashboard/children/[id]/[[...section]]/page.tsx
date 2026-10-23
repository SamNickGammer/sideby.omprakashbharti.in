import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../../lib/auth";
import { sql } from "../../../../../lib/db";
import { idSchema } from "../../../../../lib/validation";
import ChildSpace from "../../../../../components/child-space";
import type { Child } from "../../../../../lib/types";
export const metadata = { title: "Child’s Space · Sideby Parent" };
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; section?: string[] }>;
}) {
  const { id, section = [] } = await params;
  const allowed = [
    "overview",
    "usage",
    "apps",
    "notifications",
    "screen",
    "camera",
    "audio",
    "accounts",
    "services",
    "devices",
    "settings",
  ];
  if (
    !idSchema.safeParse(id).success ||
    section.length > 1 ||
    !allowed.includes(section[0] || "overview")
  )
    notFound();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");
  const [row] =
    await sql`SELECT c.id,c.name,c.age,c.color,c.avatar_key,c.archived,(SELECT count(*)::int FROM sideby_devices d WHERE d.child_id=c.id AND d.revoked_at IS NULL AND d.credential_expires_at>now()) AS device_count,f.name AS family_name FROM sideby_children c JOIN sideby_families f ON f.id=c.family_id WHERE c.id=${id} AND f.owner_id=${session.user.id}`;
  if (!row) notFound();
  return (
    <ChildSpace
      child={row as Child}
      familyName={row.family_name}
      userId={session.user.id}
      section={section[0] || "overview"}
    />
  );
}
