import { redirect } from "next/navigation";
import { authenticated, ApiError } from "../../lib/core";
import Dashboard from "./workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await authenticated();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }
  return <Dashboard />;
}
