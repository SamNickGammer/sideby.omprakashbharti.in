import { auth } from "../../lib/auth";
import { redirect } from "next/navigation";
import Dashboard from "../../components/dashboard";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const initialTab = [
    "Overview",
    "Children",
    "Routines",
    "Requests",
    "Settings",
  ].includes(view || "")
    ? view
    : "Overview";
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/auth/sign-in");
  return <Dashboard userId={data.user.id} initialTab={initialTab} />;
}
