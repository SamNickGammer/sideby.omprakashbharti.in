import { auth } from "../../lib/auth";
import { redirect } from "next/navigation";
import Dashboard from "../../components/dashboard";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/auth/sign-in");
  return <Dashboard userId={data.user.id} />;
}
